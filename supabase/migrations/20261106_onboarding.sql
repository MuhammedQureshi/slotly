alter table public.users
  add column if not exists onboarding_complete boolean not null default false;

-- Existing shops were already onboarded before the wizard existed.
update public.users u
set onboarding_complete = true
where exists (select 1 from public.booking_pages p where p.user_id = u.id);
