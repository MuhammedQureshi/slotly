-- Check a customer's cancellation cutoff while holding the calendar lock.
begin;
create or replace function public.cancel_booking_by_token(p_token uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_booking public.bookings%rowtype;
  v_page public.booking_pages%rowtype;
begin
  select * into v_booking from public.bookings where cancel_token = p_token;
  if not found then return false; end if;
  select * into v_page from public.booking_pages where id = v_booking.booking_page_id for update;
  select * into v_booking from public.bookings where id = v_booking.id for update;
  if v_booking.status <> 'confirmed' or
      v_booking.starts_at <= now() + v_page.change_cutoff_hours * interval '1 hour' then
    return false;
  end if;
  update public.bookings set status = 'cancelled', cancelled_by = 'customer', cancelled_at = now()
    where id = v_booking.id;
  return true;
end;
$$;
revoke all on function public.cancel_booking_by_token(uuid) from public, anon, authenticated;
grant execute on function public.cancel_booking_by_token(uuid) to service_role;
commit;
