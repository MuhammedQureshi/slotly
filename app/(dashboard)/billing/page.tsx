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

import { BillingActionForm } from './BillingActionForm'

const proFeatures = [
  ['Unlimited bookings', 'No monthly appointment limit'],
  ['Personal booking page', 'Your logo, services, prices and contact details'],
  ['Service management', 'Different appointment lengths and prices'],
  ['Availability controls', 'Working hours, breaks, days off and holidays'],
  ['Booking confirmations', 'Automatic confirmation emails'],
  ['Email reminders', 'Remind customers before their appointment'],
  ['Cancel and reschedule', 'Customers manage their booking through a link'],
  ['Client history', 'Customer details and previous appointments'],
  ['Manual appointments', 'Add bookings received by phone or in person'],
  ['Booking link and QR code', 'Share on Instagram or display in the shop'],
]

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { userId: clerkUserId } = await auth()
  const { success } = await searchParams

  if (!clerkUserId) {
    return <p className="text-sm text-stone-600">Please sign in to view billing.</p>
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('plan, stripe_customer_id, stripe_subscription_id')
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
            <p className="font-medium">Payment successful</p>
            <p className="mt-1 text-sm text-emerald-800">
              Welcome to Slotly Pro. Your features are now being activated.
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
                <p className="font-medium">Up to 25 bookings per month</p>
                <p className="mt-0.5 text-xs text-stone-500">Your allowance resets each month.</p>
              </div>
            </div>
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
            <CardDescription>The complete toolkit for running your booking business.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>
              <span className="text-4xl font-semibold tracking-tight text-stone-950">£6.99</span>
              <span className="text-stone-500"> / month</span>
            </p>
            <ul className="space-y-3">
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
            {isPro ? <BillingActionForm kind="portal" /> : <BillingActionForm kind="checkout" />}
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
