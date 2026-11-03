-- Inspect existing plan/subscription rows before changing any account entitlement.
-- This migration preserves all existing users and appointments.
begin;
alter table public.users alter column plan set default 'free';
alter table public.users add column if not exists ever_pro boolean not null default false;
update public.users set ever_pro = true
  where plan = 'pro' or stripe_subscription_id is not null;
update public.users set plan = 'free'
  where plan is null and stripe_customer_id is null and stripe_subscription_id is null;
revoke update on public.users from anon, authenticated;
create index if not exists bookings_page_start_status_idx
  on public.bookings (booking_page_id, starts_at, status);

-- Customer data is read only through server routes that verify ownership.
alter table public.bookings enable row level security;
revoke all on public.bookings from anon, authenticated;

create or replace function public.enforce_one_booking_page()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  perform 1 from public.users where id = new.user_id for update;
  if (select count(*) from public.booking_pages where user_id = new.user_id) >= 1 then
    raise exception 'one_booking_page_per_account';
  end if;
  return new;
end;
$$;
drop trigger if exists one_booking_page_per_account on public.booking_pages;
create trigger one_booking_page_per_account before insert on public.booking_pages
  for each row execute function public.enforce_one_booking_page();

create or replace function public.create_booking_with_limit(
  p_booking_page_id uuid,
  p_service_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_customer_notes text,
  p_price_pence integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_page public.booking_pages%rowtype;
  v_plan text;
  v_month_start timestamptz;
  v_month_end timestamptz;
  v_count integer;
  v_booking public.bookings%rowtype;
begin
  if p_starts_at <= now() or p_ends_at <= p_starts_at or p_ends_at > p_starts_at + interval '12 hours' then
    raise exception 'invalid_booking_time';
  end if;

  -- The page row lock serialises all booking and rescheduling writes on this calendar.
  select * into v_page from public.booking_pages
    where id = p_booking_page_id and is_active and is_published for update;
  if not found then raise exception 'booking_page_unavailable'; end if;

  if not exists (select 1 from public.services
    where id = p_service_id and booking_page_id = p_booking_page_id) then
    raise exception 'service_unavailable';
  end if;

  select plan into v_plan from public.users where id = v_page.user_id;
  select count(*) into v_count from public.bookings
    where booking_page_id = p_booking_page_id and status = 'confirmed'
      and starts_at >= date_trunc('day', p_starts_at at time zone coalesce(v_page.timezone, 'Europe/London'))
        at time zone coalesce(v_page.timezone, 'Europe/London')
      and starts_at < ((date_trunc('day', p_starts_at at time zone coalesce(v_page.timezone, 'Europe/London')) + interval '1 day')
        at time zone coalesce(v_page.timezone, 'Europe/London'));
  if v_count >= 100 then raise exception 'daily_booking_limit_reached'; end if;
  if v_plan is distinct from 'pro' then
    v_month_start := date_trunc('month', p_starts_at at time zone coalesce(v_page.timezone, 'Europe/London'))
      at time zone coalesce(v_page.timezone, 'Europe/London');
    v_month_end := ((v_month_start at time zone coalesce(v_page.timezone, 'Europe/London')) + interval '1 month')
      at time zone coalesce(v_page.timezone, 'Europe/London');
    select count(*) into v_count from public.bookings
      where booking_page_id = p_booking_page_id
        and status in ('confirmed', 'completed', 'no_show')
        and starts_at >= v_month_start and starts_at < v_month_end;
    if v_count >= 20 then raise exception 'monthly_booking_limit_reached'; end if;
  end if;

  if exists (select 1 from public.bookings
    where booking_page_id = p_booking_page_id
      and status in ('confirmed', 'completed', 'no_show')
      and starts_at < p_ends_at and ends_at > p_starts_at) then
    raise exception 'slot_already_booked';
  end if;

  insert into public.bookings (
    booking_page_id, service_id, customer_name, customer_email, customer_phone,
    customer_notes, price_pence, starts_at, ends_at, status
  ) values (
    p_booking_page_id, p_service_id, p_customer_name, p_customer_email, p_customer_phone,
    p_customer_notes, p_price_pence, p_starts_at, p_ends_at, 'confirmed'
  ) returning * into v_booking;
  return to_jsonb(v_booking);
end;
$$;

revoke all on function public.create_booking_with_limit(uuid,uuid,text,text,text,text,integer,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.create_booking_with_limit(uuid,uuid,text,text,text,text,integer,timestamptz,timestamptz) to service_role;

alter table public.booking_pages
  add column if not exists accent_color text not null default '#0c0a09',
  add column if not exists logo_path text;
alter table public.availability_rules
  add column if not exists break_start time,
  add column if not exists break_end time;
alter table public.bookings
  add column if not exists private_notes text,
  add column if not exists reminder_sent_at timestamptz;

create or replace function public.reschedule_booking_with_limit(
  p_booking_id uuid, p_starts_at timestamptz, p_ends_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_booking public.bookings%rowtype;
  v_page public.booking_pages%rowtype;
  v_plan text;
  v_start timestamptz;
  v_end timestamptz;
  v_count integer;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found or v_booking.status <> 'confirmed' then raise exception 'booking_unavailable'; end if;
  select * into v_page from public.booking_pages where id = v_booking.booking_page_id for update;
  -- Lock again after acquiring the calendar lock, so concurrent edits see the latest booking.
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found or v_booking.status <> 'confirmed' then raise exception 'booking_unavailable'; end if;
  if p_starts_at <= now() or p_ends_at - p_starts_at <> v_booking.ends_at - v_booking.starts_at then
    raise exception 'invalid_booking_time';
  end if;
  if exists (select 1 from public.bookings where booking_page_id = v_booking.booking_page_id
    and id <> p_booking_id and status in ('confirmed','completed','no_show')
    and starts_at < p_ends_at and ends_at > p_starts_at) then
    raise exception 'slot_already_booked';
  end if;
  select plan into v_plan from public.users where id = v_page.user_id;
  if v_plan is distinct from 'pro' then
    v_start := date_trunc('month', p_starts_at at time zone coalesce(v_page.timezone, 'Europe/London'))
      at time zone coalesce(v_page.timezone, 'Europe/London');
    v_end := ((v_start at time zone coalesce(v_page.timezone, 'Europe/London')) + interval '1 month')
      at time zone coalesce(v_page.timezone, 'Europe/London');
    if v_booking.starts_at < v_start or v_booking.starts_at >= v_end then
      select count(*) into v_count from public.bookings where booking_page_id = v_booking.booking_page_id
        and status in ('confirmed','completed','no_show') and starts_at >= v_start and starts_at < v_end;
      if v_count >= 20 then raise exception 'monthly_booking_limit_reached'; end if;
    end if;
  end if;
  update public.bookings set starts_at = p_starts_at, ends_at = p_ends_at,
    reminder_sent_at = null where id = p_booking_id returning * into v_booking;
  return to_jsonb(v_booking);
end;
$$;
revoke all on function public.reschedule_booking_with_limit(uuid,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.reschedule_booking_with_limit(uuid,timestamptz,timestamptz) to service_role;

-- A second worker cannot claim the same appointment's reminder.
create or replace function public.claim_booking_reminder(p_booking_id uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  update public.bookings b set reminder_sent_at = now() where b.id = p_booking_id
    and b.reminder_sent_at is null and b.status = 'confirmed'
    and b.starts_at > now() and b.starts_at <= now() + interval '25 hours'
    and b.starts_at > b.created_at + interval '24 hours'
    and exists (select 1 from public.booking_pages p join public.users u on u.id = p.user_id
      where p.id = b.booking_page_id and u.plan = 'pro')
    returning b.id into v_id;
  return v_id is not null;
end;
$$;
revoke all on function public.claim_booking_reminder(uuid) from public, anon, authenticated;
grant execute on function public.claim_booking_reminder(uuid) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booking-logos', 'booking-logos', true, 2097152,
  array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = excluded.allowed_mime_types;
commit;
