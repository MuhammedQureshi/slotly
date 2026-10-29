import { after, NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { sendBookingNotifications } from '@/lib/booking-notifications'
import {
  FREE_MONTHLY_BOOKING_LIMIT,
  getBookingMonthBoundaries,
  isProPlan,
} from '@/lib/plans'
import { supabaseAdmin } from '@/lib/supabase'


const bookingSchema = z.object({
  booking_page_id: z.string().uuid(),
  service_id: z.string().uuid(),
  customer_name: z.string().trim().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().optional(),
  customer_notes: z.string().optional(),
  starts_at: z.string().datetime({ offset: true }),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const result = bookingSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const data = result.data

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
    .select('user_id, timezone')
    .eq('id', data.booking_page_id)
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

  if (!isProPlan(owner.plan)) {
    const timeZone = bookingPage.timezone || 'Europe/London'
    const month = getBookingMonthBoundaries(startsAt, timeZone)

    const { count, error: countError } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_page_id', data.booking_page_id)
      .neq('status', 'cancelled')
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

  const { data: booking, error: insertError } = await supabaseAdmin.rpc(
    'create_booking',
    {
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

    return NextResponse.json(
      { error: 'Unable to create booking.' },
      { status: 500 }
    )
  }

  const bookingRecord = Array.isArray(booking) ? booking[0] : booking
  const cancelToken = bookingRecord?.cancel_token

  if (typeof cancelToken === 'string' && cancelToken) {
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
  } else {
    console.error('Booking saved, but create_booking did not return cancel_token')
  }
  return NextResponse.json(
    { message: 'Booking created successfully.', booking },
    { status: 201 }
  )
}
