import { auth, currentUser } from '@clerk/nextjs/server'
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  UsersRound,
} from 'lucide-react'
import Link from 'next/link'

import MetricCard from '@/components/dashboard/MetricCard'
import RevenueMetricCard from '@/components/dashboard/RevenueMetricCard'
import {
  getDashboardMetrics,
  getRecentBookings,
} from '@/lib/dashboard'
import { supabaseAdmin } from '@/lib/supabase'
import { isProPlan } from '@/lib/plans'

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

export default async function DashboardPage() {
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
  const [metrics, recentBookings] = await Promise.all([
    getDashboardMetrics(appUser.id, { includeRevenue: isPro }),
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

      <section aria-label="Booking metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard
          label="Bookings this month"
          value={metrics.bookingsThisMonth}
          description="All appointments this month"
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

      <section
        aria-labelledby="recent-bookings-heading"
        className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="recent-bookings-heading"
              className="font-semibold text-stone-950"
            >
              Recent bookings
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Your five latest appointments.
            </p>
          </div>
          <Link
            href="/bookings"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-amber-800 transition hover:text-amber-950 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          >
            View all
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        {recentBookings.length > 0 ? (
          <ul className="divide-y divide-stone-100">
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
                <span
                  className={
                    'rounded-full px-2.5 py-1 text-xs font-medium capitalize ' +
                    getStatusClassName(booking.status)
                  }
                >
                  {booking.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-stone-100 text-stone-500">
              <Clock3 aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-3 font-medium text-stone-950">No bookings yet</p>
            <p className="mt-1 max-w-sm text-sm leading-6 text-stone-600">
              Bookings from your public page will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
