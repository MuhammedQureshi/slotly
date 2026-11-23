-- Run only as a transaction: this exercises the migration and leaves no rows.
begin;
alter table public.users drop constraint if exists users_email_key;

do $$
declare
  test_email text := 'clerk-migration-' || gen_random_uuid()::text || '@example.invalid';
  old_clerk_id text := 'test_old_' || gen_random_uuid()::text;
  new_clerk_id text := 'test_new_' || gen_random_uuid()::text;
  old_user_id uuid;
  new_user_id uuid;
begin
  insert into public.users (clerk_user_id, email, plan)
    values (old_clerk_id, test_email, 'pro') returning id into old_user_id;
  insert into public.users (clerk_user_id, email)
    values (new_clerk_id, test_email) returning id into new_user_id;

  if old_user_id = new_user_id or not exists (
    select 1 from public.users where id = new_user_id and plan = 'free'
      and not onboarding_complete and stripe_customer_id is null
      and stripe_subscription_id is null
  ) then
    raise exception 'new account is not separate and free';
  end if;

  insert into public.users (clerk_user_id, email, full_name)
    values (new_clerk_id, test_email, 'Updated')
    on conflict (clerk_user_id) do update set full_name = excluded.full_name;

  if not exists (select 1 from public.users where id = old_user_id and plan = 'pro')
     or (select count(*) from public.users where email = test_email) <> 2
     or exists (select 1 from public.booking_pages where user_id = new_user_id)
  then
    raise exception 'account isolation or idempotency check failed';
  end if;

  begin
    insert into public.users (clerk_user_id, email)
      values (old_clerk_id, 'different-' || test_email);
    raise exception 'duplicate Clerk ID was accepted';
  exception when unique_violation then
    null;
  end;
end $$;
rollback;
