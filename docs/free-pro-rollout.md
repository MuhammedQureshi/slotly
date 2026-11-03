# Free and Pro rollout

The app code in this change requires `supabase/migrations/20261103_booking_entitlements.sql`.
Do not deploy the app code before applying that migration: public and manual booking
creation call `create_booking_with_limit`, and availability reads the new break fields.
The migration was applied to the Slotly production Supabase project on 2026-11-03.
Verification showed three Pro users, one Free user, twelve preserved bookings,
all three booking functions, the new fields and logo bucket, and server-only
booking write access.

## Before the migration

Take a database backup. In the Supabase SQL Editor, inspect the existing accounts:

```sql
select plan, count(*), count(stripe_subscription_id) as linked_subscriptions
from public.users group by plan;
select user_id, count(*) from public.booking_pages group by user_id having count(*) > 1;
```

The migration adds fields, indexes and server-only database functions. It gives
new users a Free default and only sets existing null plans to Free when they have
no Stripe identifiers. It does not delete or downgrade an existing Pro account.
Run the SQL file in Supabase SQL Editor. Verify its final statements complete
without an error before deploying the corresponding app commit.

## Environment and scheduler

- Keep the existing test-mode `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID` (£6.99
  GBP monthly), `STRIPE_WEBHOOK_SECRET`, and Stripe portal configuration.
- Add the same long random value as `CRON_SECRET` in Vercel Production and
  `SLOTLY_CRON_SECRET` in this GitHub repository's Actions secrets. The included
  workflow calls the reminders route hourly at minute 17 UTC. The route is inert
  without the Vercel secret. Run the workflow manually once after deployment.
- Ensure `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `NEXT_PUBLIC_APP_URL` point to
  the intended email sender and public Slotly URL. Resend test sending may only
  deliver to its allowed test recipient until the sender domain is verified.
- Update the Stripe webhook endpoint to include
  `customer.subscription.created` and `customer.subscription.updated` in addition
  to `checkout.session.completed` and `customer.subscription.deleted`.

## Verification in Stripe test mode and a disposable booking page

1. Confirm Free shows 20 bookings and Pro shows unlimited in Billing.
2. Create 20 confirmed appointments scheduled in the same shop-local month,
   including at least one manual booking. The next public booking must show the
   neutral shop-contact message; the next manual booking must show Upgrade.
3. Cancel one appointment; one more booking in that month should succeed.
   A pending attempt must not consume allowance.
4. Submit two booking requests for the final slot at once. Only one may succeed.
   Repeat with distinct slots when 19 appointments exist; only one may succeed.
5. Reschedule into a full month and confirm the original appointment remains.
   Reschedule into a month with capacity and check the new date and reminder.
6. Complete a test-mode Checkout, send renewal, past-due, unpaid and deletion
   events, then replay each event. `stripe_events` should contain one processed
   row per event ID. Confirm a delayed old event does not re-upgrade a cancelled
   subscription. A period-end cancellation should keep Pro while Stripe says
   active, and downgrade after deletion.
7. Confirm branding, notes, statistics and QR download are Pro-only. Downgrade
   and verify existing appointments and notes remain, while the public page
   shows the default branding and Slotly footer.
8. Verify both exports and the customer directory contain only the signed-in
   barber's records. Public booking responses must not include private notes.
9. Run `npm run lint`, `npm run test:plans`, and `npm run build`.

No customer payments or Stripe Connect are part of this implementation.
