-- Clerk development and production instances have separate user IDs. Keep
-- their accounts separate even when the same verified email is used in both.
-- Ownership and upserts continue to use the unique clerk_user_id and users.id.
alter table public.users drop constraint if exists users_email_key;
