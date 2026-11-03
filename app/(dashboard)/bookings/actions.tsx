'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { z } from 'zod'
import { getEntitlements } from '@/lib/plans'
import { sendBookingNotifications } from '@/lib/booking-notifications'

const manualSchema = z.object({
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
  const { data: booking, error } = await supabaseAdmin.rpc('create_booking_with_limit', {
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
  if (booking?.cancel_token) {
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
