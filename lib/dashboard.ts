import { supabaseAdmin } from '@/lib/supabase'

export type DashboardMetrics = {
  bookingsThisMonth: number
  upcomingToday: number
  totalCustomers: number
}

export type RecentBooking = {
  id: string
  customer_name: string
  starts_at: string
  status: string
  service: { name: string } | null
}

function getPeriodBoundaries(now = new Date()) {
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
  const startOfTomorrow = new Date(startOfToday)
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  return {
    startOfToday: startOfToday.toISOString(),
    startOfTomorrow: startOfTomorrow.toISOString(),
    startOfMonth: startOfMonth.toISOString(),
    startOfNextMonth: startOfNextMonth.toISOString(),
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
  userId: string
): Promise<DashboardMetrics> {
  const bookingPageIds = await getBookingPageIds(userId)

  if (bookingPageIds.length === 0) {
    return {
      bookingsThisMonth: 0,
      upcomingToday: 0,
      totalCustomers: 0,
    }
  }

  const {
    startOfToday,
    startOfTomorrow,
    startOfMonth,
    startOfNextMonth,
  } = getPeriodBoundaries()

  const [monthResult, todayResult, customersResult] = await Promise.all([
    supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('booking_page_id', bookingPageIds)
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

  const customerEmails = new Set(
    (customersResult.data ?? [])
      .map((booking) => booking.customer_email.trim().toLowerCase())
      .filter(Boolean)
  )

  return {
    bookingsThisMonth: monthResult.count ?? 0,
    upcomingToday: todayResult.count ?? 0,
    totalCustomers: customerEmails.size,
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
