import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import BookingsTable from './BookingsTable'

export default async function Bookings() {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return <div>Please sign in.</div>
  }

  const supabase = supabaseAdmin

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (!user) {
    return <div>User not found.</div>
  }

  const { data: bookingPages } = await supabase
  .from('booking_pages')
  .select('id')
  .eq('user_id', user.id)

  if (!bookingPages || bookingPages.length === 0) {
    return <div>No booking page found.</div>
  }

  const bookingPageIds = bookingPages.map(page => page.id)

  const { data: bookings } = await supabase
  .from('bookings')
  .select('*, service:service_id(name), booking_page:booking_page_id(business_name)')
  .in('booking_page_id', bookingPageIds)
  .order('starts_at', { ascending: false })

    if (!bookings || bookings.length === 0) {
      return <div>No bookings found.</div>
    }


  return (
    <div className="items-center justify-center">
      <BookingsTable bookings={bookings} />
    </div>
  )
}
