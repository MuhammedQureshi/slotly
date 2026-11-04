import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  if (!process.env.RESEND_API_KEY) return new Response('Email is not configured', { status: 503 })
  await supabaseAdmin.from('booking_rate_limits').delete()
    .lt('minute', new Date(Date.now() - 2 * 86_400_000).toISOString())
  const now = Date.now()
  const { data, error } = await supabaseAdmin.from('bookings')
    .select('id, booking_page_id, customer_email, customer_name, starts_at, reminder_reference_at, service:service_id(name)')
    .eq('status', 'confirmed').is('reminder_sent_at', null)
    // The first hourly run in this window sends about 24 hours ahead. A wider
    // lower bound lets a delayed scheduler catch up without sending twice.
    .gt('starts_at', new Date(now + 18 * 3600_000).toISOString())
    .lte('starts_at', new Date(now + 25 * 3600_000).toISOString())
    .limit(200)
  if (error) return new Response('Unable to load reminders', { status: 500 })
  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  for (const booking of data ?? []) {
    const { data: claimed, error: claimError } = await supabaseAdmin.rpc('claim_booking_reminder', {
      p_booking_id: booking.id,
    })
    if (claimError || !claimed) continue
    try {
      const { data: page } = await supabaseAdmin.from('booking_pages')
        .select('business_name, timezone').eq('id', booking.booking_page_id).single()
      if (!page) throw new Error('Booking page missing')
      const date = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short',
        timeZone: page.timezone || 'Europe/London' }).format(new Date(booking.starts_at))
      const service = Array.isArray(booking.service) ? booking.service[0] : booking.service
      const { data: sentEmail, error: emailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Slotly <onboarding@resend.dev>',
        to: booking.customer_email,
        subject: `Reminder: ${page.business_name} appointment tomorrow`,
        text: `Hello ${booking.customer_name}, your ${service?.name || 'appointment'} at ${page.business_name} is on ${date}.`,
      }, {
        idempotencyKey: `reminder-${booking.id}-${new Date(booking.reminder_reference_at || booking.starts_at).getTime()}`,
      })
      if (emailError) throw emailError
      await supabaseAdmin.from('reminder_attempts').insert({
        booking_id: booking.id, result: 'sent', provider_id: sentEmail?.id ?? null,
      })
      sent++
    } catch (sendError) {
      console.error('Reminder delivery failed for booking ID:', booking.id,
        sendError instanceof Error ? sendError.name : 'provider error')
      await supabaseAdmin.from('reminder_attempts').insert({
        booking_id: booking.id, result: 'failed', error_code: 'delivery_failed',
      })
      await supabaseAdmin.from('bookings').update({ reminder_sent_at: null }).eq('id', booking.id)
    }
  }
  return Response.json({ sent })
}
