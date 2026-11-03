import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import BookingsTable from './BookingsTable'
import ManualBookingForm from './ManualBookingForm'
import { getEntitlements } from '@/lib/plans'
import { buttonVariants } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default async function Bookings() {
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <a href="/api/export?kind=appointments" className={buttonVariants({ variant: 'outline' })}><Download aria-hidden="true" /> Appointments CSV</a>
        <a href="/api/export?kind=customers" className={buttonVariants({ variant: 'outline' })}><Download aria-hidden="true" /> Customers CSV</a>
      </div>
      <ManualBookingForm services={services ?? []} timezone={bookingPages[0].timezone || 'Europe/London'} />
      <BookingsTable bookings={bookings ?? []} canWriteNotes={getEntitlements(user.plan).customerHistoryAndNotes}
        timezone={bookingPages[0].timezone || 'Europe/London'} />
    </div>
  )
}
