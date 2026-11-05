import { auth, currentUser } from '@clerk/nextjs/server'
import { formatInTimeZone } from 'date-fns-tz'
import { Clock3, Globe2, MoreHorizontal, Plus, Scissors } from 'lucide-react'
import Link from 'next/link'

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

function chartPaths(values: number[]) {
  const width = 320
  const height = 72
  const top = 7
  const bottom = 63
  const max = Math.max(...values, 1)
  const points = values.map((value, index) => ({
    x: values.length === 1 ? 0 : (index / (values.length - 1)) * width,
    y: bottom - (value / max) * (bottom - top),
  }))
  if (points.length === 0) return { line: '', area: '' }

  let line = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const midpoint = (current.x + next.x) / 2
    line += ` C${midpoint.toFixed(1)},${current.y.toFixed(1)} ${midpoint.toFixed(1)},${next.y.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`
  }
  return { line, area: `${line} L${width},${height} L0,${height} Z` }
}

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
  const chart = chartPaths(activity.trend.map((point) => point.count))
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
    <div className="space-y-3">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{greeting}, {firstName}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Here&apos;s what&apos;s happening with your business.</p>
        </div>
        <p className="hidden pt-1 text-[11px] text-muted-foreground sm:block">
          {new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: timezone }).format(now)}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 py-1">
        <Link href="/bookings?new=true" className={buttonVariants({ size: 'sm', className: 'rounded-full bg-accent px-3 text-accent-foreground hover:bg-accent/85' })}>
          <Plus aria-hidden="true" /> Add booking
        </Link>
        <Link href="/services" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-full px-3' })}>
          <Scissors aria-hidden="true" /> Add service
        </Link>
        <Link href="/my-page?tab=availability" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-full px-3' })}>
          <Clock3 aria-hidden="true" /> Block time
        </Link>
        <Link href={bookingPage?.slug ? `/book/${bookingPage.slug}` : '/my-page'} target={bookingPage?.slug ? '_blank' : undefined} rel={bookingPage?.slug ? 'noreferrer' : undefined} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-full px-3' })}>
          <Globe2 aria-hidden="true" /> View page
        </Link>
        <Link href="/my-page" className="ml-auto hidden text-[10px] text-muted-foreground hover:text-foreground sm:block">Customise</Link>
      </div>

      <section aria-label="Booking overview" className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Bookings this month
              <span className="grid size-3.5 place-items-center rounded-full bg-accent text-accent-foreground"><span className="text-[9px]">✓</span></span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {metrics.bookingsThisMonth}
              <span className="ml-1 text-xs font-normal text-muted-foreground">/ {isPro ? 'unlimited' : FREE_MONTHLY_BOOKING_LIMIT}</span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
              <span className="text-muted-foreground">Last 30 days</span>
              <span className="text-accent">{delta >= 0 ? '+' : ''}{delta} bookings</span>
              <span className="text-destructive">{activity.cancelledLast30} cancelled</span>
            </div>
            <svg aria-label="Bookings over the last 30 days" className="mt-3 h-24 w-full" viewBox="0 0 320 72" preserveAspectRatio="none" role="img">
              <defs>
                <linearGradient id="dashboard-bookings-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={chart.area} fill="url(#dashboard-bookings-area)" />
              <path d={chart.line} fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Today</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Link href="/bookings?new=true" aria-label="Add booking" className="hover:text-foreground"><Plus className="size-3.5" /></Link>
                <Link href="/bookings?view=day" aria-label="View today's bookings" className="hover:text-foreground"><MoreHorizontal className="size-3.5" /></Link>
              </div>
            </div>
            {activity.today.length ? (
              <div className="mt-2 space-y-0.5">
                {activity.today.slice(0, 4).map((booking) => (
                  <Link key={booking.id} href={`/bookings?q=${encodeURIComponent(booking.customer_name)}`} className="flex items-center gap-3 rounded-lg py-2 hover:bg-secondary/70">
                    <span className="w-10 text-[10px] text-muted-foreground">{formatTime(booking.starts_at)}</span>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[9px] font-medium">{initials(booking.customer_name)}</span>
                    <span className="min-w-0"><span className="block truncate text-xs font-medium">{booking.customer_name}</span><span className="block truncate text-[10px] text-muted-foreground">{booking.service?.name ?? 'Service unavailable'}</span></span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex h-28 flex-col items-center justify-center text-center">
                <Clock3 className="size-5 text-muted-foreground/60" />
                <p className="mt-2 text-xs font-medium">No appointments today</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Your next booking will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="gap-0 py-0 shadow-none">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-xs font-medium">Recent appointments</p>
          <Link href="/bookings" className="text-[10px] font-medium text-accent hover:underline">View all</Link>
        </div>
        {recentBookings.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 px-4 text-[10px] font-normal">Date</TableHead>
                <TableHead className="h-8 text-[10px] font-normal">Customer</TableHead>
                <TableHead className="hidden h-8 text-[10px] font-normal sm:table-cell">Service</TableHead>
                <TableHead className="h-8 text-[10px] font-normal">Amount</TableHead>
                <TableHead className="h-8 px-4 text-[10px] font-normal">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="px-4 py-2.5 text-[11px] text-muted-foreground">{formatDate(booking.starts_at)}</TableCell>
                  <TableCell className="py-2.5 text-xs font-medium">{booking.customer_name}</TableCell>
                  <TableCell className="hidden py-2.5 text-[11px] text-muted-foreground sm:table-cell">{booking.service?.name ?? 'Service unavailable'}</TableCell>
                  <TableCell className="py-2.5 text-xs">{formatPrice(booking.price_pence)}</TableCell>
                  <TableCell className="px-4 py-2.5"><Badge variant="outline" className={`text-[9px] capitalize ${statusClass(booking.status)}`}>{booking.status.replaceAll('_', ' ')}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="border-t px-4 py-10 text-center text-xs text-muted-foreground">Bookings from your public page will appear here.</div>
        )}
      </Card>
    </div>
  )
}
