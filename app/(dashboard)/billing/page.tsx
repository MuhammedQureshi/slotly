import { auth } from '@clerk/nextjs/server'
import {
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { supabaseAdmin } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'
import { FREE_MONTHLY_BOOKING_LIMIT } from '@/lib/plans'

import { BillingActionForm } from './BillingActionForm'

const proFeatures = [
  ['Unlimited bookings', 'No monthly appointment limit'],
  ['Custom branding', 'Add your logo and colours; remove the Slotly footer'],
  ['Email reminders', 'One reminder about 24 hours before an appointment'],
  ['Private notes', 'Keep barber-only notes on customer appointments'],
  ['Booking statistics', 'See activity and estimated service value'],
  ['Booking QR code', 'Download a code for your booking page'],
]
const sharedFeatures = [
  'One barber calendar and public booking page',
  'Services with prices and durations',
  'Working hours, a break and days off',
  'Manual appointments and confirmation emails',
  'Customer cancellation and rescheduling links',
  'Customer directory and CSV exports',
]

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; session_id?: string }>
}) {
  const { userId: clerkUserId } = await auth()
  const { success } = await searchParams

  if (!clerkUserId) {
    return <p className="text-sm text-stone-600">Please sign in to view billing.</p>
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, plan, stripe_customer_id, stripe_subscription_id')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (error || !user) {
    return (
      <p className="text-sm text-stone-600">
        We could not load your billing account. Please try again.
      </p>
    )
  }

  const isPro = user.plan === 'pro'
  let subscription = null
  if (user.stripe_subscription_id) {
    try {
      subscription = await getStripe().subscriptions.retrieve(user.stripe_subscription_id)
    } catch (subscriptionError) {
      console.error('Unable to load subscription details:', subscriptionError)
    }
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-stone-200 pb-6">
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-amber-700 uppercase">
          Billing
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
            Your Slotly plan
          </h1>
          <Badge variant={isPro ? 'default' : 'secondary'}>
            {isPro ? 'Pro' : 'Free'}
          </Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Upgrade securely through Stripe, or manage your existing subscription.
        </p>
      </header>

      {success === 'true' && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">Checkout complete</p>
            <p className="mt-1 text-sm text-emerald-800">
              Stripe is confirming your subscription. Refresh this page shortly to see your plan update.
            </p>
          </div>
        </div>
      )}

      {isPro && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <Sparkles aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">You&apos;re on Slotly Pro</p>
            <p className="mt-1 text-sm text-emerald-800">
              Your Pro features are active. Manage payment details or cancellation through Stripe.
            </p>
          </div>
        </div>
      )}

      {subscription && (
        <p className="text-sm text-stone-600">
          Subscription: {subscription.status.replaceAll('_', ' ')}
          {subscription.cancel_at_period_end ? ' · Ends at the close of the paid period' : ''}
          {subscription.items.data[0]?.current_period_end
            ? ` · ${subscription.cancel_at_period_end ? 'Ends' : 'Renews'} ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(subscription.items.data[0].current_period_end * 1000))}`
            : ''}
        </p>
      )}
      {(subscription?.status === 'past_due' || subscription?.status === 'unpaid') && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Stripe could not collect your latest payment. Please update your payment method in Manage subscription.
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Card className={!isPro ? 'ring-2 ring-stone-300' : undefined}>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <span className="grid size-10 place-items-center rounded-xl bg-stone-100 text-stone-700">
                <CalendarDays aria-hidden="true" className="size-5" />
              </span>
              {!isPro && <Badge variant="secondary">Current plan</Badge>}
            </div>
            <CardTitle className="mt-3 text-xl">Slotly Free</CardTitle>
            <CardDescription>A simple way to start taking appointments online.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>
              <span className="text-4xl font-semibold tracking-tight text-stone-950">£0</span>
            </p>
            <div className="flex items-start gap-2 text-stone-700">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <div>
                <p className="font-medium">Up to {FREE_MONTHLY_BOOKING_LIMIT} bookings per month</p>
                <p className="mt-0.5 text-xs text-stone-500">Your allowance resets each month.</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-stone-700">{sharedFeatures.map((feature) =>
              <li key={feature} className="flex gap-2"><Check aria-hidden="true" className="size-4 shrink-0 text-emerald-600" />{feature}</li>
            )}</ul>
          </CardContent>
        </Card>

        <Card className={!isPro ? 'ring-2 ring-amber-500' : 'ring-2 ring-emerald-500'}>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
                <CreditCard aria-hidden="true" className="size-5" />
              </span>
              <Badge className={isPro ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}>
                {isPro ? 'Current plan' : 'Recommended'}
              </Badge>
            </div>
            <CardTitle className="mt-3 text-xl">Slotly Pro</CardTitle>
            <CardDescription>The complete toolkit for running your barbershop.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>
              <span className="text-4xl font-semibold tracking-tight text-stone-950">£6.99</span>
              <span className="text-stone-500"> / month</span>
            </p>
            <ul className="space-y-3">
              <li className="text-sm text-stone-600">Everything in Free, plus:</li>
              {proFeatures.map(([feature, description]) => (
                <li key={feature} className="flex items-start gap-2 text-stone-700">
                  <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-medium">{feature}</p>
                    <p className="mt-0.5 text-xs leading-5 text-stone-500">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
            {isPro || subscription?.status === 'unpaid'
              ? <BillingActionForm kind="portal" /> : <BillingActionForm kind="checkout" />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 text-sm leading-6 text-stone-600">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-stone-700" />
          <p>
            Payments and card details are handled securely by Stripe. You can manage or cancel your
            Pro subscription from the billing portal.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
