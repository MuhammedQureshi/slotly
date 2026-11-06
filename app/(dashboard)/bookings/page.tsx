import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import BookingsTable from './BookingsTable'
import ManualBookingForm from './ManualBookingForm'
import { getEntitlements } from '@/lib/plans'
import { buttonVariants } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default async function Bookings({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; new?: string; view?: string }>
}) {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return <div>Please sign in.</div>
  }

  const supabase = supabaseAdmin

  const { data: user } = await supabase
    .from('users')
    .select('id, plan')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (!user) {
    return <div>User not found.</div>
  }

  const { data: bookingPages } = await supabase
  .from('booking_pages')
  .select('id, timezone')
  .eq('user_id', user.id)

  if (!bookingPages || bookingPages.length === 0) {
    return <div>No booking page found.</div>
  }

  const bookingPageIds = bookingPages.map(page => page.id)
  const { data: services } = await supabase.from('services').select('id, name')
    .eq('booking_page_id', bookingPageIds[0]).order('sort_order')

  const { data: bookings } = await supabase
  .from('bookings')
  .select('*, service:service_id(name), booking_page:booking_page_id(business_name)')
  .in('booking_page_id', bookingPageIds)
  .order('starts_at', { ascending: false })

  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q.trim() : ''
  const normalizedQuery = searchQuery.toLowerCase()
  const visibleBookings = normalizedQuery
    ? (bookings ?? []).filter((booking) => {
        const service = Array.isArray(booking.service) ? booking.service[0] : booking.service
        return [booking.customer_name, booking.customer_email, booking.customer_phone, service?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery))
      })
    : bookings ?? []

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <a href="/api/export?kind=appointments" className={buttonVariants({ variant: 'outline' })}><Download aria-hidden="true" /> Appointments CSV</a>
        <a href="/api/export?kind=customers" className={buttonVariants({ variant: 'outline' })}><Download aria-hidden="true" /> Customers CSV</a>
      </div>
      <ManualBookingForm
        key={params.new === 'true' ? 'open' : 'closed'}
        services={services ?? []}
        timezone={bookingPages[0].timezone || 'Europe/London'}
        defaultOpen={params.new === 'true'}
      />
      <BookingsTable
        bookings={visibleBookings}
        canWriteNotes={getEntitlements(user.plan).customerHistoryAndNotes}
        timezone={bookingPages[0].timezone || 'Europe/London'}
        searchQuery={searchQuery}
        initialView={params.view === 'day' ? 'day' : params.view === 'calendar' ? 'calendar' : 'all'}
      />
    </div>
  )
}
