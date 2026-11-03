import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { getEntitlements } from '@/lib/plans'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'

function validDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export default async function StatsPage({ searchParams }: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { userId } = await auth()
  if (!userId) return <p>Please sign in.</p>
  const { data: user } = await supabaseAdmin.from('users').select('id, plan')
    .eq('clerk_user_id', userId).maybeSingle()
  if (!user) return <p>Account not found.</p>
  if (!getEntitlements(user.plan).statistics) return <Card>
    <CardHeader><CardTitle>Booking statistics</CardTitle>
      <CardDescription>Upgrade to Pro to view appointment trends and estimated service value.</CardDescription></CardHeader>
    <CardContent><Link href="/billing" className={buttonVariants({ variant: 'outline' })}>View Pro</Link></CardContent>
  </Card>
  const { data: pages } = await supabaseAdmin.from('booking_pages').select('id, timezone').eq('user_id', user.id)
  const ids = (pages ?? []).map((page) => page.id)
  const timezone = pages?.[0]?.timezone || 'Europe/London'
  const requested = await searchParams
  const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')
  const first = `${today.slice(0, 7)}-01`
  const from = validDate(requested.from) ? requested.from : first
  const to = validDate(requested.to) ? requested.to : today
  if (from > to) return <p>Start date must be before end date.</p>
  const dayAfter = new Date(`${to}T12:00:00Z`)
  dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)
  const start = fromZonedTime(`${from}T00:00:00`, timezone).toISOString()
  const end = fromZonedTime(`${dayAfter.toISOString().slice(0, 10)}T00:00:00`, timezone).toISOString()
  const bookings: { status: string; price_pence: number | null }[] = []
  if (ids.length) for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabaseAdmin.from('bookings').select('status, price_pence')
      .in('booking_page_id', ids).gte('starts_at', start)
      .lt('starts_at', end).range(offset, offset + 499)
    if (error) return <p>Unable to load statistics.</p>
    bookings.push(...(data ?? []))
    if ((data ?? []).length < 500) break
  }
  const count = (status: string) => bookings.filter((booking) => booking.status === status).length
  const estimate = bookings.filter((booking) => ['confirmed', 'completed', 'no_show'].includes(booking.status))
    .reduce((total, booking) => total + (booking.price_pence ?? 0), 0)
  return <div className="space-y-6">
    <header><h1 className="text-3xl font-semibold tracking-tight">Booking statistics</h1>
      <p className="mt-2 text-sm text-muted-foreground">A closer look at appointments and estimated service value.</p></header>
    <Card><CardContent>
      <form className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <DatePicker label="From" name="from" defaultValue={from} timezone={timezone} />
        <DatePicker label="To" name="to" defaultValue={to} timezone={timezone} />
        <Button type="submit">Apply dates</Button>
      </form>
    </CardContent></Card>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {([
        ['Appointments', bookings.length], ['Completed', count('completed')],
        ['Cancellations', count('cancelled')], ['No-shows', count('no_show')],
        ['Estimated service value', new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(estimate / 100)],
      ] as [string, string | number][]).map(([label, value]) => <Card key={label}>
        <CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle></CardHeader>
      </Card>)}
    </div>
    <p className="text-xs text-stone-500">Service value is an estimate based on appointment prices. Slotly does not collect customer payments.</p>
  </div>
}
