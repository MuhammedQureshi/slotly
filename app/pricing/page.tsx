import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { FREE_MONTHLY_BOOKING_LIMIT } from '@/lib/plans'

export const metadata: Metadata = { title: 'Pricing | Slotly' }

const shared = [
  'One barber and one booking calendar',
  'Services, working hours and manual appointments',
  'Customer confirmation emails and booking management links',
  'Customer directory and CSV exports',
  'Standard booking page with Slotly branding',
]
const pro = [
  'Unlimited appointments',
  'Custom logo and colours, with no Slotly footer',
  'Automatic email reminders',
  'Customer history and private notes',
  'Booking statistics and a downloadable QR code',
]

export default function PricingPage() {
  return <main className="min-h-screen bg-stone-50 px-4 py-12 sm:py-20">
    <div className="mx-auto max-w-5xl">
      <Link href="/" className="text-sm font-semibold text-stone-700 hover:underline">← Slotly</Link>
      <header className="mx-auto mt-10 max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-stone-950">Simple pricing for barbers</h1>
        <p className="mt-3 text-stone-600">Start free. Upgrade when your appointment book grows. No booking commissions or customer acquisition fees.</p>
      </header>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Free</CardTitle><CardDescription>For a barbershop getting started.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <p className="text-4xl font-semibold">£0</p>
            <ul className="space-y-3 text-sm">{[`${FREE_MONTHLY_BOOKING_LIMIT} appointments per calendar month`, ...shared].map((feature) =>
              <li key={feature} className="flex gap-2"><Check aria-hidden="true" className="size-4 shrink-0 text-emerald-600" />{feature}</li>
            )}</ul>
            <Link href="/sign-up" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full' })}>Start free</Link>
          </CardContent>
        </Card>
        <Card className="border-amber-300">
          <CardHeader><CardTitle>Pro</CardTitle><CardDescription>More flexibility and insight as you grow.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <p><span className="text-4xl font-semibold">£6.99</span><span className="text-stone-500"> / month</span></p>
            <p className="text-sm text-stone-600">Everything in Free, plus:</p>
            <ul className="space-y-3 text-sm">{pro.map((feature) =>
              <li key={feature} className="flex gap-2"><Check aria-hidden="true" className="size-4 shrink-0 text-emerald-600" />{feature}</li>
            )}</ul>
            <Link href="/billing" className={buttonVariants({ size: 'lg', className: 'w-full' })}>View Pro in Billing</Link>
            <p className="text-xs text-stone-500">Subscription payments are handled by Stripe. Customers pay their barber directly for appointments.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </main>
}
