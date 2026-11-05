import { auth, currentUser } from '@clerk/nextjs/server'
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  Globe2,
  Plus,
  Scissors,
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
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-accent uppercase">
          Overview
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Good to see you, {firstName}
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          Here&apos;s what&apos;s happening with your bookings.
        </p>
        </div>
        <p className="text-xs text-muted-foreground sm:pt-7">
          {new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: timezone }).format(new Date())}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/bookings" className={buttonVariants({ size: 'sm', className: 'rounded-full px-3' })}>
          <Plus aria-hidden="true" /> Add booking
        </Link>
        <Link href="/services" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-full px-3' })}>
          <Scissors aria-hidden="true" /> Add service
        </Link>
        <Link href="/my-page" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-full px-3' })}>
          <Globe2 aria-hidden="true" /> View booking page
        </Link>
      </div>

      {!isPro && (
        <Card className="gap-3 bg-background py-4" aria-label="Monthly booking allowance">
          <CardHeader><CardTitle>{metrics.bookingsThisMonth} of {FREE_MONTHLY_BOOKING_LIMIT} free bookings used</CardTitle>
            <CardDescription>Free allowance for {monthLabel}</CardDescription></CardHeader>
          <CardContent>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min((metrics.bookingsThisMonth / FREE_MONTHLY_BOOKING_LIMIT) * 100, 100)}%` }} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
            {month > currentMonth && <Link href={`/dashboard?month=${previousMonth.toISOString().slice(0, 7)}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Previous month</Link>}
            <Link href={`/dashboard?month=${nextMonth.toISOString().slice(0, 7)}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Next month</Link>
            {metrics.bookingsThisMonth >= FREE_MONTHLY_BOOKING_LIMIT && <Link href="/billing" className={buttonVariants({ size: 'sm' })}>Upgrade for unlimited bookings</Link>}
            </div>
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

      <Card aria-labelledby="recent-bookings-heading" className="gap-0 py-0">
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
                className="flex items-center gap-4 px-4 py-3.5 sm:px-5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                  <CalendarDays aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {booking.customer_name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {booking.service?.name ?? 'Service unavailable'}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-foreground">
                    {dateFormatter.format(new Date(booking.starts_at))}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
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
            <span className="grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground">
              <Clock3 aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-3 font-medium text-foreground">No bookings yet</p>
            <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
              Bookings from your public page will appear here.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
