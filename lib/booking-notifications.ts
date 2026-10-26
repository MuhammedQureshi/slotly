import { sendBookingConfirmation, sendOwnerNotification } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase'

type BookingNotification = {
  bookingPageId: string
  cancelToken: string
  customerName: string
  customerEmail: string
  serviceName: string
  startsAt: string
  duration: number
  pricePence: number | null
}

export async function sendBookingNotifications(booking: BookingNotification) {
  const { data: page, error: pageError } = await supabaseAdmin
    .from('booking_pages')
    .select('business_name, timezone, user_id')
    .eq('id', booking.bookingPageId)
    .single()

  if (pageError || !page) throw new Error('Unable to load booking email details')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is not configured')

  const timezone = page.timezone || 'Europe/London'
  const startsAt = new Date(booking.startsAt)
  const details = {
    customerName: booking.customerName,
    businessName: page.business_name,
    serviceName: booking.serviceName,
    date: new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'full', timeZone: timezone,
    }).format(startsAt),
    time: new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: timezone, timeZoneName: 'short',
    }).format(startsAt),
    duration: booking.duration,
    price: booking.pricePence
      ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(booking.pricePence / 100)
      : 'Free',
  }

  // A failed owner lookup or send must not prevent the customer's confirmation.
  await Promise.all([
    sendBookingConfirmation({
      ...details,
      to: booking.customerEmail,
      cancelUrl: new URL('/cancel/' + encodeURIComponent(booking.cancelToken), appUrl).toString(),
    }).catch(console.error),
    (async () => {
      const { data: owner, error } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', page.user_id)
        .single()

      if (error || !owner?.email) throw new Error('Unable to load owner notification email')
      await sendOwnerNotification({
        ...details,
        to: owner.email,
        dashboardUrl: new URL('/bookings', appUrl).toString(),
      })
    })().catch(console.error),
  ])
}
