-- Apply after 20261104_free_100_bookings.sql. Existing appointments are kept.
begin;

alter table public.booking_pages
  add column if not exists change_cutoff_hours integer not null default 12;
alter table public.booking_pages
  add constraint change_cutoff_hours_valid check (change_cutoff_hours between 0 and 168);
alter table public.bookings
  add column if not exists request_key uuid;
create unique index if not exists bookings_page_request_key_idx
  on public.bookings (booking_page_id, request_key) where request_key is not null;

create table if not exists public.availability_overrides (
  id uuid primary key default gen_random_uuid(),
  booking_page_id uuid not null references public.booking_pages(id) on delete cascade,
  date date not null,
  is_active boolean not null,
  start_time time not null default '09:00',
  end_time time not null default '17:00',
  break_start time,
  break_end time,
  unique (booking_page_id, date),
  constraint override_hours_valid check (not is_active or start_time < end_time),
  constraint override_break_valid check (
    (break_start is null and break_end is null) or
    (break_start is not null and break_end is not null and
      break_start < break_end and break_start >= start_time and break_end <= end_time)
  )
);
alter table public.availability_overrides enable row level security;
revoke all on public.availability_overrides from anon, authenticated;
grant all on public.availability_overrides to service_role;

-- This trigger runs inside the same transaction as the booking RPC. Locking the
-- page serialises writes even if two requests choose the same time together.
create or replace function public.enforce_booking_schedule()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_page public.booking_pages%rowtype;
  v_service public.services%rowtype;
  v_local_start timestamp;
  v_local_end timestamp;
  v_date date;
  v_active boolean;
  v_open time;
  v_close time;
  v_break_start time;
  v_break_end time;
  v_buffer interval;
begin
  if new.status not in ('confirmed', 'completed', 'no_show') then return new; end if;
  if tg_op = 'UPDATE' then
    if old.status in ('confirmed', 'completed', 'no_show')
        and new.starts_at is not distinct from old.starts_at
        and new.ends_at is not distinct from old.ends_at then
      return new;
    end if;
  end if;

  select * into v_page from public.booking_pages where id = new.booking_page_id for update;
  if not found or (tg_op = 'INSERT' and not v_page.is_active) then
    raise exception 'booking_page_unavailable';
  end if;
  select * into v_service from public.services
    where id = new.service_id and booking_page_id = new.booking_page_id;
  if not found then raise exception 'service_unavailable'; end if;
  if new.ends_at <= new.starts_at then raise exception 'invalid_booking_time'; end if;
  if tg_op = 'INSERT' and (not v_service.is_active or
      new.ends_at - new.starts_at <> v_service.duration_minutes * interval '1 minute'
      or new.price_pence is distinct from v_service.price_pence) then
    raise exception 'service_details_changed';
  end if;

  v_local_start := new.starts_at at time zone coalesce(v_page.timezone, 'Europe/London');
  v_local_end := new.ends_at at time zone coalesce(v_page.timezone, 'Europe/London');
  v_date := v_local_start::date;
  if v_local_end::date <> v_date or v_local_end <= v_local_start then
    raise exception 'outside_working_hours';
  end if;
  if exists (select 1 from public.blocked_dates
      where booking_page_id = new.booking_page_id and blocked_date = v_date) then
    raise exception 'date_unavailable';
  end if;

  select is_active, start_time, end_time, break_start, break_end
    into v_active, v_open, v_close, v_break_start, v_break_end
    from public.availability_overrides
    where booking_page_id = new.booking_page_id and date = v_date;
  if not found then
    select is_active, start_time, end_time, break_start, break_end
      into v_active, v_open, v_close, v_break_start, v_break_end
      from public.availability_rules
      where booking_page_id = new.booking_page_id
        and day_of_week = extract(dow from v_local_start)::integer;
  end if;
  if not found or not v_active or v_local_start::time < v_open or v_local_end::time > v_close then
    raise exception 'outside_working_hours';
  end if;
  if v_break_start is not null and v_break_end is not null
      and v_local_start::time < v_break_end and v_local_end::time > v_break_start then
    raise exception 'break_unavailable';
  end if;

  v_buffer := greatest(coalesce(v_page.buffer_minutes, 0), 0) * interval '1 minute';
  if exists (select 1 from public.bookings b
    where b.booking_page_id = new.booking_page_id
      and b.id <> new.id and b.status in ('confirmed', 'completed', 'no_show')
      and b.starts_at < new.ends_at + v_buffer
      and b.ends_at + v_buffer > new.starts_at) then
    raise exception 'slot_already_booked';
  end if;
  return new;
end;
$$;
drop trigger if exists booking_schedule_guard on public.bookings;
create trigger booking_schedule_guard before insert or update of starts_at, ends_at, status
  on public.bookings for each row execute function public.enforce_booking_schedule();

-- A replay with the same request key returns its first appointment. The page
-- lock prevents a concurrent replay from creating another row or email.
create or replace function public.create_booking_idempotent(
  p_request_key uuid,
  p_booking_page_id uuid,
  p_service_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_customer_notes text,
  p_price_pence integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing public.bookings%rowtype;
  v_created jsonb;
begin
  if p_request_key is null then raise exception 'request_key_required'; end if;
  perform 1 from public.booking_pages where id = p_booking_page_id for update;
  select * into v_existing from public.bookings
    where booking_page_id = p_booking_page_id and request_key = p_request_key;
  if found then
    if v_existing.status <> 'confirmed' then raise exception 'booking_unavailable'; end if;
    if v_existing.service_id <> p_service_id
      or v_existing.customer_name <> p_customer_name
      or lower(v_existing.customer_email) <> lower(p_customer_email)
      or v_existing.customer_phone is distinct from p_customer_phone
      or v_existing.customer_notes is distinct from p_customer_notes
      or v_existing.starts_at <> p_starts_at or v_existing.ends_at <> p_ends_at
      or v_existing.price_pence is distinct from p_price_pence then
      raise exception 'request_key_reused';
    end if;
    return to_jsonb(v_existing) || jsonb_build_object('idempotency_replayed', true);
  end if;

  v_created := public.create_booking_with_limit(
    p_booking_page_id, p_service_id, p_customer_name, p_customer_email,
    p_customer_phone, p_customer_notes, p_price_pence, p_starts_at, p_ends_at
  );
  update public.bookings set request_key = p_request_key
    where id = (v_created->>'id')::uuid;
  return v_created || jsonb_build_object('idempotency_replayed', false);
end;
$$;
revoke all on function public.create_booking_idempotent(uuid,uuid,uuid,text,text,text,text,integer,timestamptz,timestamptz)
  from public, anon, authenticated;
grant execute on function public.create_booking_idempotent(uuid,uuid,uuid,text,text,text,text,integer,timestamptz,timestamptz)
  to service_role;

-- The customer link checks its cutoff inside the rescheduling transaction.
-- Owners keep using reschedule_booking_with_limit after verifying ownership.
create or replace function public.reschedule_booking_by_token(
  p_token uuid, p_starts_at timestamptz, p_ends_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_booking public.bookings%rowtype;
  v_page public.booking_pages%rowtype;
begin
  select * into v_booking from public.bookings where cancel_token = p_token;
  if not found then raise exception 'booking_unavailable'; end if;
  select * into v_page from public.booking_pages where id = v_booking.booking_page_id for update;
  select * into v_booking from public.bookings where id = v_booking.id for update;
  if v_booking.status <> 'confirmed' or
      v_booking.starts_at <= now() + v_page.change_cutoff_hours * interval '1 hour' then
    raise exception 'change_cutoff_passed';
  end if;
  return public.reschedule_booking_with_limit(v_booking.id, p_starts_at, p_ends_at);
end;
$$;
revoke all on function public.reschedule_booking_by_token(uuid,timestamptz,timestamptz)
  from public, anon, authenticated;
grant execute on function public.reschedule_booking_by_token(uuid,timestamptz,timestamptz)
  to service_role;

create table if not exists public.booking_rate_limits (
  fingerprint text not null,
  minute timestamptz not null,
  attempts integer not null default 1,
  primary key (fingerprint, minute)
);
alter table public.booking_rate_limits enable row level security;
revoke all on public.booking_rate_limits from anon, authenticated;
grant all on public.booking_rate_limits to service_role;

create or replace function public.consume_booking_attempt(p_fingerprint text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_attempts integer;
begin
  if p_fingerprint is null or length(p_fingerprint) <> 64 then return false; end if;
  insert into public.booking_rate_limits (fingerprint, minute, attempts)
    values (p_fingerprint, date_trunc('minute', now()), 1)
    on conflict (fingerprint, minute) do update
      set attempts = public.booking_rate_limits.attempts + 1
    returning attempts into v_attempts;
  return v_attempts <= 10;
end;
$$;
revoke all on function public.consume_booking_attempt(text) from public, anon, authenticated;
grant execute on function public.consume_booking_attempt(text) to service_role;

create table if not exists public.reminder_attempts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  result text not null check (result in ('sent', 'failed')),
  error_code text,
  provider_id text
);
create index if not exists reminder_attempts_booking_idx
  on public.reminder_attempts (booking_id, attempted_at desc);
alter table public.reminder_attempts enable row level security;
revoke all on public.reminder_attempts from anon, authenticated;
grant all on public.reminder_attempts to service_role;

commit;
