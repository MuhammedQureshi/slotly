import { supabaseAdmin } from '@/lib/supabase'
import { getBookingMonthBoundaries } from '@/lib/plans'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'

export type DashboardMetrics = {
  bookingsThisMonth: number
  upcomingToday: number
  totalCustomers: number
  revenueThisMonth: number | null
}

export type RecentBooking = {
  id: string
  customer_name: string
  starts_at: string
  status: string
  service: { name: string } | null
}

function getPeriodBoundaries(timezone: string, month: string, now = new Date()) {
  const today = formatInTimeZone(now, timezone, 'yyyy-MM-dd')
  const nextDay = new Date(`${today}T12:00:00Z`)
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)
  const bounds = getBookingMonthBoundaries(`${month}-01`, timezone)

  return {
    startOfToday: fromZonedTime(`${today}T00:00:00`, timezone).toISOString(),
    startOfTomorrow: fromZonedTime(`${nextDay.toISOString().slice(0, 10)}T00:00:00`, timezone).toISOString(),
    startOfMonth: bounds.start.toISOString(),
    startOfNextMonth: bounds.end.toISOString(),
  }
}

async function getBookingPageIds(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('booking_pages')
    .select('id')
    .eq('user_id', userId)

  if (error) {
    throw new Error('Could not load booking pages: ' + error.message)
  }

  return (data ?? []).map((page) => page.id)
}

export async function getDashboardMetrics(
  userId: string,
  options: { includeRevenue?: boolean; timezone?: string; month?: string } = {}
): Promise<DashboardMetrics> {
  const bookingPageIds = await getBookingPageIds(userId)

  if (bookingPageIds.length === 0) {
    return {
      bookingsThisMonth: 0,
      upcomingToday: 0,
      totalCustomers: 0,
      revenueThisMonth: options.includeRevenue ? 0 : null,
    }
  }

  const {
    startOfToday,
    startOfTomorrow,
    startOfMonth,
    startOfNextMonth,
  } = getPeriodBoundaries(
    options.timezone ?? 'Europe/London',
    options.month ?? formatInTimeZone(new Date(), options.timezone ?? 'Europe/London', 'yyyy-MM')
  )

  const [monthResult, todayResult, customersResult, revenueResult] = await Promise.all([
    supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('booking_page_id', bookingPageIds)
      .in('status', ['confirmed', 'completed', 'no_show'])
      .gte('starts_at', startOfMonth)
      .lt('starts_at', startOfNextMonth),
    supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('booking_page_id', bookingPageIds)
      .eq('status', 'confirmed')
      .gte('starts_at', startOfToday)
      .lt('starts_at', startOfTomorrow),
    supabaseAdmin
      .from('bookings')
      .select('customer_email')
      .in('booking_page_id', bookingPageIds),
    options.includeRevenue
      ? supabaseAdmin
          .from('bookings')
          .select('price_pence')
          .in('booking_page_id', bookingPageIds)
          .in('status', ['confirmed', 'completed', 'no_show'])
          .gte('starts_at', startOfMonth)
          .lt('starts_at', startOfNextMonth)
      : Promise.resolve({ data: null, error: null }),
  ])

  if (monthResult.error) {
    throw new Error('Could not count monthly bookings: ' + monthResult.error.message)
  }

  if (todayResult.error) {
    throw new Error(
      "Could not count today's bookings: " + todayResult.error.message
    )
  }

  if (customersResult.error) {
    throw new Error('Could not load customers: ' + customersResult.error.message)
  }

  if (revenueResult.error) {
    throw new Error('Could not calculate revenue: ' + revenueResult.error.message)
  }

  const customerEmails = new Set(
    (customersResult.data ?? [])
      .map((booking) => booking.customer_email.trim().toLowerCase())
      .filter(Boolean)
  )

  return {
    bookingsThisMonth: monthResult.count ?? 0,
    upcomingToday: todayResult.count ?? 0,
    totalCustomers: customerEmails.size,
    revenueThisMonth: options.includeRevenue
      ? (revenueResult.data ?? []).reduce(
          (total, booking) => total + (booking.price_pence ?? 0),
          0
        )
      : null,
  }
}

export async function getRecentBookings(userId: string): Promise<RecentBooking[]> {
  const bookingPageIds = await getBookingPageIds(userId)

  if (bookingPageIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, customer_name, starts_at, status, service:service_id(name)')
    .in('booking_page_id', bookingPageIds)
    .order('starts_at', { ascending: false })
    .limit(5)

  if (error) {
    throw new Error('Could not load recent bookings: ' + error.message)
  }

  return (data ?? []).map((booking) => ({
    ...booking,
    service: Array.isArray(booking.service)
      ? booking.service[0] ?? null
      : booking.service ?? null,
  })) as RecentBooking[]
}
