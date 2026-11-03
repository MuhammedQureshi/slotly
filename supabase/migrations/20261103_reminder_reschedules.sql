-- Keep reminder timing tied to the most recent appointment move.
-- Existing bookings keep their original creation time as the reference.
begin;
alter table public.bookings add column if not exists reminder_reference_at timestamptz;

create or replace function public.mark_booking_reschedule()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at then
    new.reminder_reference_at := now();
    new.reminder_sent_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists booking_reschedule_reminder on public.bookings;
create trigger booking_reschedule_reminder before update of starts_at, ends_at on public.bookings
  for each row execute function public.mark_booking_reschedule();

create or replace function public.claim_booking_reminder(p_booking_id uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  update public.bookings b set reminder_sent_at = now() where b.id = p_booking_id
    and b.reminder_sent_at is null and b.status = 'confirmed'
    and b.starts_at > now() and b.starts_at <= now() + interval '25 hours'
    and b.starts_at > coalesce(b.reminder_reference_at, b.created_at) + interval '24 hours'
    and exists (select 1 from public.booking_pages p join public.users u on u.id = p.user_id
      where p.id = b.booking_page_id and u.plan = 'pro')
    returning b.id into v_id;
  return v_id is not null;
end;
$$;
revoke all on function public.claim_booking_reminder(uuid) from public, anon, authenticated;
grant execute on function public.claim_booking_reminder(uuid) to service_role;
commit;
