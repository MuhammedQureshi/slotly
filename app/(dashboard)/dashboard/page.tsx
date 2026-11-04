import { auth, currentUser } from '@clerk/nextjs/server'
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  UsersRound,
} from 'lucide-react'
import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'

import MetricCard from '@/components/dashboard/MetricCard'
import RevenueMetricCard from '@/components/dashboard/RevenueMetricCard'
import {
  getDashboardMetrics,
  getRecentBookings,
} from '@/lib/dashboard'
import { supabaseAdmin } from '@/lib/supabase'
import { isProPlan } from '@/lib/plans'
import { FREE_MONTHLY_BOOKING_LIMIT } from '@/lib/plans'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'Europe/London',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Europe/London',
})

function getStatusClassName(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700'
    case 'cancelled':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-amber-50 text-amber-700'
  }
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const [{ userId: clerkUserId }, clerkUser] = await Promise.all([
    auth(),
    currentUser(),
  ])

  if (!clerkUserId) {
    return <p className="text-sm text-stone-600">Please sign in to view your overview.</p>
  }

  const { data: appUser, error: appUserError } = await supabaseAdmin
    .from('users')
    .select('id, plan')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  if (appUserError || !appUser) {
    return (
      <p className="text-sm text-stone-600">
        We could not load your dashboard. Please try again.
      </p>
    )
  }

  const isPro = isProPlan(appUser.plan)
  const { data: bookingPage } = await supabaseAdmin
    .from('booking_pages').select('timezone').eq('user_id', appUser.id).limit(1).maybeSingle()
  const timezone = bookingPage?.timezone || 'Europe/London'
  const currentMonth = formatInTimeZone(new Date(), timezone, 'yyyy-MM')
  const requestedMonth = (await searchParams).month
  const month = requestedMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)
    ? requestedMonth : currentMonth
  const monthDate = new Date(`${month}-01T12:00:00Z`)
  const previousMonth = new Date(monthDate)
  previousMonth.setUTCMonth(previousMonth.getUTCMonth() - 1)
  const nextMonth = new Date(monthDate)
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1)
  const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(monthDate)
  const [metrics, recentBookings] = await Promise.all([
    getDashboardMetrics(appUser.id, { includeRevenue: isPro, timezone, month }),
    getRecentBookings(appUser.id),
  ])

  const firstName = clerkUser?.firstName || 'there'

  return (
    <div className="space-y-8">
      <header className="border-b border-stone-200 pb-6">
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-amber-700 uppercase">
          Overview
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
          Good to see you, {firstName}
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Here&apos;s how your barbershop is doing.
        </p>
      </header>

      {!isPro && (
        <Card className="bg-amber-50/60" aria-label="Monthly booking allowance">
          <CardHeader><CardTitle>{metrics.bookingsThisMonth} of {FREE_MONTHLY_BOOKING_LIMIT} bookings used</CardTitle>
            <CardDescription>Free allowance for {monthLabel}</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            {month > currentMonth && <Link href={`/dashboard?month=${previousMonth.toISOString().slice(0, 7)}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Previous month</Link>}
            <Link href={`/dashboard?month=${nextMonth.toISOString().slice(0, 7)}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Next month</Link>
            {metrics.bookingsThisMonth >= FREE_MONTHLY_BOOKING_LIMIT && <Link href="/billing" className={buttonVariants({ size: 'sm' })}>Upgrade for unlimited bookings</Link>}
          </CardContent>
        </Card>
      )}

      <section aria-label="Booking metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard
          label="Bookings this month"
          value={metrics.bookingsThisMonth}
          description={`Appointments scheduled for ${monthLabel}`}
          icon={CalendarDays}
        />
        <MetricCard
          label="Upcoming today"
          value={metrics.upcomingToday}
          description="Confirmed appointments today"
          icon={CalendarCheck2}
        />
        <MetricCard
          label="Total customers"
          value={metrics.totalCustomers}
          description="Unique customer email addresses"
          icon={UsersRound}
        />
        <RevenueMetricCard
          value={
            isPro
              ? new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP',
                }).format((metrics.revenueThisMonth ?? 0) / 100)
              : undefined
          }
        />
      </section>

      <Card
        aria-labelledby="recent-bookings-heading"
      >
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b">
          <div>
            <CardTitle id="recent-bookings-heading">Recent bookings</CardTitle>
            <CardDescription>Your five latest appointments.</CardDescription>
          </div>
          <Link
            href="/bookings"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            View all
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </CardHeader>

        {recentBookings.length > 0 ? (
          <ul className="divide-y">
            {recentBookings.map((booking) => (
              <li
                key={booking.id}
                className="flex items-center gap-4 px-5 py-4 sm:px-6"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
                  <CalendarDays aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-stone-950">
                    {booking.customer_name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-stone-600">
                    {booking.service?.name ?? 'Service unavailable'}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-stone-800">
                    {dateFormatter.format(new Date(booking.starts_at))}
                  </p>
                  <p className="mt-0.5 text-sm text-stone-500">
                    {timeFormatter.format(new Date(booking.starts_at))}
                  </p>
                </div>
                <Badge variant="outline" className={'capitalize ' + getStatusClassName(booking.status)}>
                  {booking.status}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
            <span className="grid size-11 place-items-center rounded-full bg-stone-100 text-stone-500">
              <Clock3 aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-3 font-medium text-stone-950">No bookings yet</p>
            <p className="mt-1 max-w-sm text-sm leading-6 text-stone-600">
              Bookings from your public page will appear here.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
