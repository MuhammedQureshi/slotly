'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { z } from 'zod'
import { getEntitlements } from '@/lib/plans'
import { sendBookingNotifications } from '@/lib/booking-notifications'
import { sendBookingConfirmation } from '@/lib/email'
import { getAvailableSlots } from '@/lib/slots'

const manualSchema = z.object({
  request_key: z.string().uuid(),
  service_id: z.string().uuid(),
  customer_name: z.string().trim().min(1).max(120),
  customer_email: z.string().email(),
  starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
})

export async function createManualBooking(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: 'Please sign in.' }
  const parsed = manualSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Check the appointment details.' }
  const localDate = new Date(`${parsed.data.starts_at}:00Z`)
  if (Number.isNaN(localDate.getTime()) ||
    localDate.toISOString().slice(0, 16) !== parsed.data.starts_at) {
    return { error: 'Choose a valid date and time.' }
  }
  const { data: user } = await supabaseAdmin.from('users').select('id')
    .eq('clerk_user_id', userId).maybeSingle()
  if (!user) return { error: 'Account not found.' }
  const { data: page } = await supabaseAdmin.from('booking_pages')
    .select('id, timezone').eq('user_id', user.id).limit(1).maybeSingle()
  if (!page) return { error: 'Create your booking page first.' }
  const { data: service } = await supabaseAdmin.from('services')
    .select('name, duration_minutes, price_pence').eq('id', parsed.data.service_id)
    .eq('booking_page_id', page.id).maybeSingle()
  if (!service) return { error: 'Choose a service on your page.' }
  const timezone = page.timezone || 'Europe/London'
  const start = fromZonedTime(`${parsed.data.starts_at}:00`, timezone)
  if (formatInTimeZone(start, timezone, "yyyy-MM-dd'T'HH:mm") !== parsed.data.starts_at) {
    return { error: 'Choose a valid local time.' }
  }
  const end = new Date(start.getTime() + service.duration_minutes * 60_000)
  const { data: booking, error } = await supabaseAdmin.rpc('create_booking_idempotent', {
    p_request_key: parsed.data.request_key,
    p_booking_page_id: page.id, p_service_id: parsed.data.service_id,
    p_customer_name: parsed.data.customer_name,
    p_customer_email: parsed.data.customer_email,
    p_customer_phone: null, p_customer_notes: null,
    p_price_pence: service.price_pence,
    p_starts_at: start.toISOString(), p_ends_at: end.toISOString(),
  })
  if (error) return { error: error.message.includes('monthly_booking_limit_reached')
    ? 'This month is full on Free. Upgrade for unlimited bookings.'
    : 'That time is unavailable. Choose another.' }
  if (booking?.cancel_token && !booking.idempotency_replayed) {
    await sendBookingNotifications({
      bookingPageId: page.id, cancelToken: booking.cancel_token,
      customerName: parsed.data.customer_name, customerEmail: parsed.data.customer_email,
      serviceName: service.name, startsAt: start.toISOString(),
      duration: service.duration_minutes, pricePence: service.price_pence,
    }).catch((sendError) => console.error('Manual booking email failed:', sendError))
  }
  revalidatePath('/bookings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function savePrivateNotes(bookingId: string, notes: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Please sign in.' }
  if (!z.string().uuid().safeParse(bookingId).success || notes.length > 2000) {
    return { error: 'Notes must be under 2,000 characters.' }
  }
  const { data: user } = await supabaseAdmin.from('users').select('id, plan')
    .eq('clerk_user_id', userId).maybeSingle()
  if (!user || !getEntitlements(user.plan).customerHistoryAndNotes) {
    return { error: 'Writing private notes is available on Pro.' }
  }
  const { data: pages } = await supabaseAdmin.from('booking_pages').select('id').eq('user_id', user.id)
  const pageIds = (pages ?? []).map((page) => page.id)
  if (!pageIds.length) return { error: 'Booking not found.' }
  const { data, error } = await supabaseAdmin.from('bookings')
    .update({ private_notes: notes }).eq('id', bookingId)
    .in('booking_page_id', pageIds).select('id').maybeSingle()
  if (error || !data) return { error: 'Booking not found.' }
  revalidatePath('/bookings')
  return { success: true }
}


export async function cancelBooking(bookingId: string) {
  if (!z.string().uuid().safeParse(bookingId).success) return { error: 'Booking not found.' }
  const { userId } = await auth()
  if (!userId) return { error: 'Please sign in.' }
  const { data: owner } = await supabaseAdmin.from('users').select('id')
    .eq('clerk_user_id', userId).maybeSingle()
  if (!owner) return { error: 'Account not found.' }
  const { data: pages } = await supabaseAdmin.from('booking_pages').select('id')
    .eq('user_id', owner.id)
  const pageIds = (pages ?? []).map((page) => page.id)
  if (!pageIds.length) return { error: 'Booking not found.' }
  const { data: cancelled, error } = await supabaseAdmin.from('bookings')
    .update({ status: 'cancelled', cancelled_by: 'owner', cancelled_at: new Date().toISOString() })
    .eq('id', bookingId).in('booking_page_id', pageIds)
    .eq('status', 'confirmed').gte('starts_at', new Date().toISOString())
    .select('id').maybeSingle()
  if (error || !cancelled) return { error: 'Only upcoming confirmed bookings can be cancelled.' }
  revalidatePath('/bookings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function rescheduleBookingAsOwner(bookingId: string, localTime: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Please sign in.' }
  if (!z.string().uuid().safeParse(bookingId).success ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localTime)) {
    return { error: 'Choose a valid date and time.' }
  }
  const parsed = new Date(`${localTime}:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 16) !== localTime) {
    return { error: 'Choose a valid date and time.' }
  }
  const { data: user } = await supabaseAdmin.from('users').select('id')
    .eq('clerk_user_id', userId).maybeSingle()
  if (!user) return { error: 'Account not found.' }
  const { data: pages } = await supabaseAdmin.from('booking_pages')
    .select('id, business_name, timezone, buffer_minutes')
    .eq('user_id', user.id)
  const page = pages?.[0]
  if (!page) return { error: 'Booking page not found.' }
  const { data: booking } = await supabaseAdmin.from('bookings')
    .select('id, booking_page_id, service_id, customer_name, customer_email, starts_at, ends_at, status, price_pence, cancel_token')
    .eq('id', bookingId).eq('booking_page_id', page.id).maybeSingle()
  if (!booking || booking.status !== 'confirmed') return { error: 'Only confirmed bookings can be moved.' }
  const { data: service } = await supabaseAdmin.from('services')
    .select('name').eq('id', booking.service_id).eq('booking_page_id', page.id).maybeSingle()
  if (!service) return { error: 'Service not found.' }
  const timezone = page.timezone || 'Europe/London'
  const start = fromZonedTime(`${localTime}:00`, timezone)
  if (formatInTimeZone(start, timezone, "yyyy-MM-dd'T'HH:mm") !== localTime) {
    return { error: 'Choose a valid local time.' }
  }
  const duration = (new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60_000
  const end = new Date(start.getTime() + duration * 60_000)
  let slots: string[]
  try {
    slots = await getAvailableSlots(page.id, localTime.slice(0, 10), duration,
      timezone, page.buffer_minutes ?? 0, 0, booking.id)
  } catch (error) {
    console.error('Owner reschedule availability failed:', error)
    return { error: 'Unable to check that time.' }
  }
  if (!slots.includes(start.toISOString())) return { error: 'That time is unavailable.' }
  const { error } = await supabaseAdmin.rpc('reschedule_booking_with_limit', {
    p_booking_id: booking.id, p_starts_at: start.toISOString(), p_ends_at: end.toISOString(),
  })
  if (error) return { error: error.message.includes('monthly_booking_limit_reached')
    ? 'This month is full on Free. Upgrade for unlimited bookings.' : 'That time is unavailable.' }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    await sendBookingConfirmation({
      to: booking.customer_email, customerName: booking.customer_name,
      businessName: page.business_name, serviceName: service.name,
      date: new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: timezone }).format(start),
      time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: timezone }).format(start),
      duration,
      price: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format((booking.price_pence ?? 0) / 100),
      cancelUrl: new URL(`/cancel/${booking.cancel_token}`, process.env.NEXT_PUBLIC_APP_URL).toString(),
    }).catch((sendError) => console.error('Owner reschedule email failed:', sendError))
  }
  revalidatePath('/bookings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function markBookingOutcome(bookingId: string, outcome: 'completed' | 'no_show') {
  const { userId } = await auth()
  if (!userId) return { error: 'Please sign in.' }
  if (!z.string().uuid().safeParse(bookingId).success ||
      !z.enum(['completed', 'no_show']).safeParse(outcome).success) {
    return { error: 'Invalid booking.' }
  }
  const { data: user } = await supabaseAdmin.from('users').select('id')
    .eq('clerk_user_id', userId).maybeSingle()
  if (!user) return { error: 'Account not found.' }
  const { data: pages } = await supabaseAdmin.from('booking_pages').select('id').eq('user_id', user.id)
  const ids = (pages ?? []).map((page) => page.id)
  if (!ids.length) return { error: 'Booking not found.' }
  const { data, error } = await supabaseAdmin.from('bookings')
    .update({ status: outcome }).eq('id', bookingId).in('booking_page_id', ids)
    .eq('status', 'confirmed').lte('starts_at', new Date().toISOString())
    .select('id').maybeSingle()
  if (error || !data) return { error: 'Only started confirmed appointments can be updated.' }
  revalidatePath('/bookings')
  revalidatePath('/dashboard')
  return { success: true }
}
