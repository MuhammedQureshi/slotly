import { auth, currentUser } from '@clerk/nextjs/server'
import { formatInTimeZone } from 'date-fns-tz'
import { Clock3, Globe2, MoreHorizontal, Plus, Scissors } from 'lucide-react'
import Link from 'next/link'

import { BookingsChart } from '@/components/dashboard/BookingsChart'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  getDashboardActivity, getDashboardMetrics, getRecentBookings,
} from '@/lib/dashboard'
import { FREE_MONTHLY_BOOKING_LIMIT, isProPlan } from '@/lib/plans'
import { supabaseAdmin } from '@/lib/supabase'

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'C'
}

function statusClass(status: string) {
  if (status === 'confirmed') return 'border-accent/20 bg-accent/10 text-accent'
  if (status === 'cancelled') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-border bg-secondary text-muted-foreground'
}

export default async function DashboardPage() {
  const [{ userId: clerkUserId }, clerkUser] = await Promise.all([auth(), currentUser()])
  if (!clerkUserId) return <p className="text-sm text-muted-foreground">Please sign in to view your overview.</p>

  const { data: appUser, error } = await supabaseAdmin
    .from('users')
    .select('id, plan')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()
  if (error || !appUser) return <p className="text-sm text-muted-foreground">We could not load your dashboard. Please try again.</p>

  const { data: bookingPage } = await supabaseAdmin
    .from('booking_pages')
    .select('timezone, slug')
    .eq('user_id', appUser.id)
    .limit(1)
    .maybeSingle()
  const timezone = bookingPage?.timezone || 'Europe/London'
  const now = new Date()
  const month = formatInTimeZone(now, timezone, 'yyyy-MM')
  const [metrics, activity, recentBookings] = await Promise.all([
    getDashboardMetrics(appUser.id, { timezone, month }),
    getDashboardActivity(appUser.id, timezone, now),
    getRecentBookings(appUser.id),
  ])

  const hour = Number(formatInTimeZone(now, timezone, 'H'))
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = clerkUser?.firstName || 'there'
  const isPro = isProPlan(appUser.plan)
  const delta = activity.last30Count - activity.previous30Count
  const formatTime = (value: string) => new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone,
  }).format(new Date(value))
  const formatDate = (value: string) => new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: timezone,
  }).format(new Date(value))
  const formatPrice = (value: number | null) => value
    ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value / 100)
    : 'Free'

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{greeting}, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your business.</p>
        </div>
        <p className="hidden pt-2 text-sm text-muted-foreground sm:block">
          {new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: timezone }).format(now)}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2.5">
        <Link href="/bookings?new=true" className={buttonVariants({ className: 'rounded-full bg-accent px-4 text-accent-foreground hover:bg-accent/85' })}>
          <Plus aria-hidden="true" /> Add booking
        </Link>
        <Link href="/services" className={buttonVariants({ variant: 'outline', className: 'rounded-full px-4' })}>
          <Scissors aria-hidden="true" /> Add service
        </Link>
        <Link href="/my-page?tab=availability" className={buttonVariants({ variant: 'outline', className: 'rounded-full px-4' })}>
          <Clock3 aria-hidden="true" /> Block time
        </Link>
        <Link href={bookingPage?.slug ? `/book/${bookingPage.slug}` : '/my-page'} target={bookingPage?.slug ? '_blank' : undefined} rel={bookingPage?.slug ? 'noreferrer' : undefined} className={buttonVariants({ variant: 'outline', className: 'rounded-full px-4' })}>
          <Globe2 aria-hidden="true" /> View page
        </Link>
        <Link href="/my-page" className="ml-auto hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block">Customise</Link>
      </div>

      <section aria-label="Booking overview" className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,.65fr)]">
        <Card className="gap-0 overflow-hidden py-0 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              Bookings this month
              <span className="grid size-3.5 place-items-center rounded-full bg-accent text-accent-foreground"><span className="text-[9px]">✓</span></span>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {metrics.bookingsThisMonth}
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">/ {isPro ? 'unlimited' : FREE_MONTHLY_BOOKING_LIMIT}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground">Last 30 days</span>
              <span className="text-accent">{delta >= 0 ? '+' : ''}{delta} bookings</span>
              <span className="text-destructive">{activity.cancelledLast30} cancelled</span>
            </div>
            <BookingsChart data={activity.trend} />
          </CardContent>
        </Card>

        <Card className="gap-0 py-0 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold">Today</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Link href="/bookings?new=true" aria-label="Add booking" className="rounded-md p-1.5 hover:bg-secondary hover:text-foreground"><Plus className="size-4" /></Link>
                <Link href="/bookings?view=day" aria-label="View today's bookings" className="rounded-md p-1.5 hover:bg-secondary hover:text-foreground"><MoreHorizontal className="size-4" /></Link>
              </div>
            </div>
            {activity.today.length ? (
              <div className="mt-4 space-y-1">
                {activity.today.slice(0, 4).map((booking) => (
                  <Link key={booking.id} href={`/bookings?q=${encodeURIComponent(booking.customer_name)}`} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-secondary/70">
                    <span className="w-11 text-xs font-medium text-muted-foreground">{formatTime(booking.starts_at)}</span>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">{initials(booking.customer_name)}</span>
                    <span className="min-w-0"><span className="block truncate text-sm font-medium">{booking.customer_name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{booking.service?.name ?? 'Service unavailable'}</span></span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center text-center">
                <Clock3 className="size-6 text-muted-foreground/60" />
                <p className="mt-3 text-sm font-medium">No appointments today</p>
                <p className="mt-1 text-xs text-muted-foreground">Your next booking will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="gap-0 overflow-hidden py-0 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 sm:px-6">
          <p className="text-base font-semibold">Recent appointments</p>
          <Link href="/bookings" className="text-sm font-medium text-accent hover:underline">View all</Link>
        </div>
        {recentBookings.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 px-5 text-xs font-medium sm:px-6">Date</TableHead>
                <TableHead className="h-11 text-xs font-medium">Customer</TableHead>
                <TableHead className="hidden h-11 text-xs font-medium sm:table-cell">Service</TableHead>
                <TableHead className="h-11 text-xs font-medium">Amount</TableHead>
                <TableHead className="h-11 px-5 text-xs font-medium sm:px-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="px-5 py-3.5 text-sm text-muted-foreground sm:px-6">{formatDate(booking.starts_at)}</TableCell>
                  <TableCell className="py-3.5 text-sm font-medium">{booking.customer_name}</TableCell>
                  <TableCell className="hidden py-3.5 text-sm text-muted-foreground sm:table-cell">{booking.service?.name ?? 'Service unavailable'}</TableCell>
                  <TableCell className="py-3.5 text-sm">{formatPrice(booking.price_pence)}</TableCell>
                  <TableCell className="px-5 py-3.5 sm:px-6"><Badge variant="outline" className={`text-xs capitalize ${statusClass(booking.status)}`}>{booking.status.replaceAll('_', ' ')}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="border-t px-4 py-12 text-center text-sm text-muted-foreground">Bookings from your public page will appear here.</div>
        )}
      </Card>
    </div>
  )
}
