import { after, NextRequest, NextResponse } from 'next/server'
import { formatInTimeZone } from 'date-fns-tz'
import { z } from 'zod'
import { createHash } from 'node:crypto'

import { sendBookingNotifications } from '@/lib/booking-notifications'
import {
  FREE_MONTHLY_BOOKING_LIMIT,
  getBookingMonthBoundaries,
  isProPlan,
} from '@/lib/plans'
import { supabaseAdmin } from '@/lib/supabase'
import { getAvailableSlots } from '@/lib/slots'


const bookingSchema = z.object({
  website: z.string().optional(),
  request_key: z.string().uuid(),
  booking_page_id: z.string().uuid(),
  service_id: z.string().uuid(),
  customer_name: z.string().trim().min(1).max(100),
  customer_email: z.string().trim().email().max(254),
  customer_phone: z.string().trim().max(30).optional(),
  customer_notes: z.string().trim().max(1000).optional(),
  starts_at: z.string().datetime({ offset: true }),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const result = bookingSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const data = result.data
  if (data.website) {
    return NextResponse.json({ error: 'Unable to create booking.' }, { status: 400 })
  }

  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('name, duration_minutes, price_pence')
    .eq('id', data.service_id)
    .eq('booking_page_id', data.booking_page_id)
    .maybeSingle()

  if (serviceError) {
    console.error('Error loading service for booking:', serviceError)
    return NextResponse.json(
      { error: 'Unable to load service details.' },
      { status: 500 }
    )
  }

  if (!service) {
    return NextResponse.json({ error: 'Service not found.' }, { status: 404 })
  }

  const startsAt = new Date(data.starts_at)
  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60000)

  const { data: bookingPage, error: pageError } = await supabaseAdmin
    .from('booking_pages')
    .select('user_id, timezone, buffer_minutes, min_notice_hours, max_days_ahead')
    .eq('id', data.booking_page_id)
    .eq('is_published', true)
    .eq('is_active', true)
    .maybeSingle()

  if (pageError || !bookingPage) {
    return NextResponse.json({ error: 'Booking page not found.' }, { status: 404 })
  }

  const { data: owner, error: ownerError } = await supabaseAdmin
    .from('users')
    .select('plan')
    .eq('id', bookingPage.user_id)
    .maybeSingle()

  if (ownerError || !owner) {
    return NextResponse.json(
      { error: 'Unable to verify booking availability.' },
      { status: 500 }
    )
  }

  const { data: existingRequest, error: replayError } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('booking_page_id', data.booking_page_id)
    .eq('request_key', data.request_key)
    .maybeSingle()
  if (replayError) {
    return NextResponse.json({ error: 'Unable to verify this booking request.' }, { status: 500 })
  }

  if (!existingRequest) {
    const ip = request.headers.get('x-vercel-forwarded-for') ||
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    if (ip) {
      const fingerprint = createHash('sha256')
        .update(`${data.booking_page_id}:${ip.split(',')[0].trim()}`).digest('hex')
      const { data: allowed, error: rateError } = await supabaseAdmin.rpc('consume_booking_attempt', {
        p_fingerprint: fingerprint,
      })
      if (rateError) return NextResponse.json({ error: 'Unable to verify this booking request.' }, { status: 500 })
      if (!allowed) return NextResponse.json({ error: 'Too many booking attempts. Please try again shortly.' }, { status: 429 })
    }
  }

  if (!existingRequest && !isProPlan(owner.plan)) {
    const timeZone = bookingPage.timezone || 'Europe/London'
    const month = getBookingMonthBoundaries(startsAt, timeZone)

    const { count, error: countError } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_page_id', data.booking_page_id)
      .in('status', ['confirmed', 'completed', 'no_show'])
      .gte('starts_at', month.start.toISOString())
      .lt('starts_at', month.end.toISOString())

    if (countError) {
      return NextResponse.json(
        { error: 'Unable to verify booking availability.' },
        { status: 500 }
      )
    }

    if ((count ?? 0) >= FREE_MONTHLY_BOOKING_LIMIT) {
      return NextResponse.json(
        {
          error:
            'Online bookings are full for this month. Please contact the business directly.',
          code: 'monthly_booking_limit_reached',
        },
        { status: 409 }
      )
    }
  }

  const timeZone = bookingPage.timezone || 'Europe/London'
  const bookingDate = formatInTimeZone(startsAt, timeZone, 'yyyy-MM-dd')

  if (!existingRequest) {
    let availableSlots: string[]
    try {
      availableSlots = await getAvailableSlots(
        data.booking_page_id,
        bookingDate,
        service.duration_minutes,
        timeZone,
        bookingPage.buffer_minutes ?? 0,
        bookingPage.min_notice_hours ?? 0,
        undefined,
        bookingPage.max_days_ahead ?? undefined
      )
    } catch (error) {
      console.error('Unable to validate requested booking slot:', error)
      return NextResponse.json(
        { error: 'Unable to verify this appointment time.' },
        { status: 500 }
      )
    }

    if (!availableSlots.includes(startsAt.toISOString())) {
      const { data: completedReplay } = await supabaseAdmin
        .from('bookings').select('id')
        .eq('booking_page_id', data.booking_page_id)
        .eq('request_key', data.request_key)
        .maybeSingle()
      if (!completedReplay) {
        return NextResponse.json(
          { error: 'This appointment time is no longer available.' },
          { status: 409 }
        )
      }
    }
  }

  const { data: booking, error: insertError } = await supabaseAdmin.rpc(
    'create_booking_idempotent',
    {
      p_request_key: data.request_key,
      p_booking_page_id: data.booking_page_id,
      p_service_id: data.service_id,
      p_customer_name: data.customer_name,
      p_customer_email: data.customer_email,
      p_customer_phone: data.customer_phone || null,
      p_customer_notes: data.customer_notes || null,
      p_price_pence: service.price_pence,
      p_starts_at: startsAt.toISOString(),
      p_ends_at: endsAt.toISOString(),
    }
  )

  if (insertError) {
    console.error('Error creating booking:', insertError)

    if (insertError.message.includes('slot_already_booked')) {
      return NextResponse.json(
        { error: 'This slot has just been booked. Please choose another.' },
        { status: 409 }
      )
    }

    if (insertError.message.includes('request_key_reused')) {
      return NextResponse.json({ error: 'This booking request was already used. Please try again.' }, { status: 409 })
    }
    if (insertError.message.includes('outside_working_hours') ||
        insertError.message.includes('date_unavailable') ||
        insertError.message.includes('break_unavailable') ||
        insertError.message.includes('service_details_changed')) {
      return NextResponse.json({ error: 'This time is no longer available. Please choose another.' }, { status: 409 })
    }

    if (insertError.message.includes('monthly_booking_limit_reached')) {
      return NextResponse.json(
        { error: 'Please contact the shop for availability this month.', code: 'monthly_booking_limit_reached' },
        { status: 409 }
      )
    }
    if (insertError.message.includes('daily_booking_limit_reached')) {
      return NextResponse.json({ error: 'Please contact the shop for availability.' }, { status: 429 })
    }

    return NextResponse.json(
      { error: 'Unable to create booking.' },
      { status: 500 }
    )
  }

  const bookingRecord = Array.isArray(booking) ? booking[0] : booking
  const cancelToken = bookingRecord?.cancel_token

  if (!bookingRecord?.idempotency_replayed && typeof cancelToken === 'string' && cancelToken) {
    after(() => sendBookingNotifications({
      bookingPageId: data.booking_page_id,
      cancelToken,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      serviceName: service.name,
      startsAt: startsAt.toISOString(),
      duration: service.duration_minutes,
      pricePence: service.price_pence,
    }).catch(console.error))
  } else if (!bookingRecord?.idempotency_replayed) {
    console.error('Booking saved, but create_booking did not return cancel_token')
  }
  return NextResponse.json(
    { message: 'Booking created successfully.', booking: {
      id: bookingRecord?.id, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(),
    } },
    { status: bookingRecord?.idempotency_replayed ? 200 : 201 }
  )
}
