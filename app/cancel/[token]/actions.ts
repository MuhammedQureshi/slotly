'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { getAvailableSlots } from '@/lib/slots'
import { sendBookingConfirmation } from '@/lib/email'

export async function cancelBookingByToken(token: string) {
  if (!z.string().uuid().safeParse(token).success) {
    return { error: 'Booking not found.' }
  }

  try {
    // Checking status in the update makes repeat/concurrent cancellation safe.
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_by: 'customer',
        cancelled_at: new Date().toISOString(),
      })
      .eq('cancel_token', token)
      .eq('status', 'confirmed')
      .gte('starts_at', new Date().toISOString())
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Customer cancellation failed:', error.message)
      return { error: 'Unable to cancel your booking. Please try again.' }
    }

    if (!data) return { error: 'Booking not found or already cancelled.' }

    revalidatePath('/bookings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch {
    return { error: 'Unable to cancel your booking. Please try again.' }
  }
}

export async function rescheduleBookingByToken(token: string, localTime: string) {
  if (!z.string().uuid().safeParse(token).success ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localTime)) {
    return { error: 'Choose a valid appointment time.' }
  }
  const localDate = new Date(`${localTime}:00Z`)
  if (Number.isNaN(localDate.getTime()) || localDate.toISOString().slice(0, 16) !== localTime) {
    return { error: 'Choose a valid appointment time.' }
  }
  const { data: booking } = await supabaseAdmin.from('bookings')
    .select('id, booking_page_id, service_id, customer_name, customer_email, price_pence, starts_at, ends_at, status')
    .eq('cancel_token', token).maybeSingle()
  if (!booking || booking.status !== 'confirmed') return { error: 'Booking not found.' }
  const { data: page } = await supabaseAdmin.from('booking_pages')
    .select('business_name, timezone, buffer_minutes, min_notice_hours')
    .eq('id', booking.booking_page_id).single()
  const { data: service } = await supabaseAdmin.from('services')
    .select('name, duration_minutes').eq('id', booking.service_id).single()
  if (!page || !service) return { error: 'Unable to load availability.' }
  const timezone = page.timezone || 'Europe/London'
  const start = fromZonedTime(`${localTime}:00`, timezone)
  if (formatInTimeZone(start, timezone, "yyyy-MM-dd'T'HH:mm") !== localTime) {
    return { error: 'Choose a valid appointment time.' }
  }
  const slots = await getAvailableSlots(booking.booking_page_id, localTime.slice(0, 10),
    service.duration_minutes, timezone, page.buffer_minutes ?? 0,
    page.min_notice_hours ?? 0, booking.id)
  if (!slots.includes(start.toISOString())) return { error: 'That time is unavailable.' }
  const end = new Date(start.getTime() + service.duration_minutes * 60_000)
  const { error } = await supabaseAdmin.rpc('reschedule_booking_with_limit', {
    p_booking_id: booking.id, p_starts_at: start.toISOString(), p_ends_at: end.toISOString(),
  })
  if (error) return { error: error.message.includes('monthly_booking_limit_reached')
    ? 'Please contact the shop for availability this month.' : 'That time is unavailable.' }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    await sendBookingConfirmation({
      to: booking.customer_email, customerName: booking.customer_name,
      businessName: page.business_name, serviceName: service.name,
      date: new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: timezone }).format(start),
      time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: timezone }).format(start),
      duration: service.duration_minutes,
      price: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format((booking.price_pence ?? 0) / 100),
      cancelUrl: new URL(`/cancel/${token}`, process.env.NEXT_PUBLIC_APP_URL).toString(),
    }).catch((sendError) => console.error('Reschedule email failed:', sendError))
  }
  revalidatePath('/bookings')
  revalidatePath('/dashboard')
  return { success: true }
}
