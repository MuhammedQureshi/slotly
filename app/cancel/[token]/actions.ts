'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { getAvailableSlots } from '@/lib/slots'
import { sendBookingConfirmation } from '@/lib/email'
import { isOutsideChangeCutoff } from '@/lib/booking-rules'

export async function cancelBookingByToken(token: string) {
  if (!z.string().uuid().safeParse(token).success) {
    return { error: 'Booking not found.' }
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('cancel_booking_by_token', {
      p_token: token,
    })

    if (error) {
      console.error('Customer cancellation failed:', error.message)
      return { error: 'Unable to cancel your booking. Please try again.' }
    }

    if (!data) return { error: 'This booking can no longer be cancelled online. Please contact the shop.' }

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
  if (!booking || booking.status !== 'confirmed' || new Date(booking.starts_at) <= new Date()) {
    return { error: 'This appointment can no longer be changed online.' }
  }
  const { data: page } = await supabaseAdmin.from('booking_pages')
    .select('business_name, timezone, buffer_minutes, min_notice_hours, change_cutoff_hours')
    .eq('id', booking.booking_page_id).single()
  const { data: service } = await supabaseAdmin.from('services')
    .select('name').eq('id', booking.service_id).single()
  if (!page || !service) return { error: 'Unable to load availability.' }
  if (!isOutsideChangeCutoff(new Date(booking.starts_at).getTime(), Date.now(), page.change_cutoff_hours ?? 12)) {
    return { error: 'This booking can no longer be changed online. Please contact the shop.' }
  }
  const durationMinutes = (new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60_000
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return { error: 'Unable to load this appointment.' }
  }
  const timezone = page.timezone || 'Europe/London'
  const start = fromZonedTime(`${localTime}:00`, timezone)
  if (formatInTimeZone(start, timezone, "yyyy-MM-dd'T'HH:mm") !== localTime) {
    return { error: 'Choose a valid appointment time.' }
  }
  let slots: string[]
  try {
    slots = await getAvailableSlots(booking.booking_page_id, localTime.slice(0, 10),
      durationMinutes, timezone, page.buffer_minutes ?? 0,
      page.min_notice_hours ?? 0, booking.id)
  } catch (slotError) {
    console.error('Reschedule availability check failed:', slotError)
    return { error: 'Unable to check that time. Please try again.' }
  }
  if (!slots.includes(start.toISOString())) return { error: 'That time is unavailable.' }
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  const { error } = await supabaseAdmin.rpc('reschedule_booking_by_token', {
    p_token: token, p_starts_at: start.toISOString(), p_ends_at: end.toISOString(),
  })
  if (error) return { error: error.message.includes('monthly_booking_limit_reached')
    ? 'Please contact the shop for availability this month.'
    : error.message.includes('change_cutoff_passed')
      ? 'This booking can no longer be changed online. Please contact the shop.'
      : 'That time is unavailable.' }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    await sendBookingConfirmation({
      to: booking.customer_email, customerName: booking.customer_name,
      businessName: page.business_name, serviceName: service.name,
      date: new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: timezone }).format(start),
      time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: timezone }).format(start),
      duration: durationMinutes,
      price: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format((booking.price_pence ?? 0) / 100),
      cancelUrl: new URL(`/cancel/${token}`, process.env.NEXT_PUBLIC_APP_URL).toString(),
    }).catch((sendError) => console.error('Reschedule email failed:', sendError))
  }
  revalidatePath('/bookings')
  revalidatePath('/dashboard')
  return { success: true }
}
