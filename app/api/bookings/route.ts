import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { sendBookingConfirmation } from '@/lib/email'
import { sendOwnerNotification } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase'


const bookingSchema = z.object({
  booking_page_id: z.string(),
  service_id: z.string(),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().optional(),
  customer_notes: z.string().optional(),
  starts_at: z.string(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = bookingSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const data = result.data

  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('name, duration_minutes, price_pence')
    .eq('id', data.service_id)
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

    const { data: bookingPage, error: bookingPageError } = await supabaseAdmin
    .from('booking_pages')
    .select(`
      business_name, 
      timezone,
      user:user_id (
        email
      )
    `)
    .eq('id', data.booking_page_id)
    .maybeSingle()


  if (bookingPageError || !bookingPage) {
    console.error(
      'Booking created, but confirmation details could not be loaded:',
      bookingPageError
    )
  } else {
    const timezone = bookingPage.timezone ?? 'Europe/London'
    const formattedDate = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: timezone,
    }).format(startsAt)
    const formattedTime = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    }).format(startsAt)
    const formattedPrice =
      service.price_pence === null || service.price_pence === 0
        ? 'Free'
        : `£${(service.price_pence / 100).toFixed(2)}`
    const bookingRecord = Array.isArray(booking) ? booking[0] : booking
    const bookingId =
      bookingRecord &&
      typeof bookingRecord === 'object' &&
      'id' in bookingRecord &&
      typeof bookingRecord.id === 'string'
        ? bookingRecord.id
        : ''
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
    const ownerEmail = (bookingPage.user as unknown as { email: string } | null)?.email
    
    sendBookingConfirmation({
      to: data.customer_email,
      customerName: data.customer_name,
      businessName: bookingPage.business_name,
      serviceName: service.name,
      date: formattedDate,
      time: formattedTime,
      duration: service.duration_minutes,
      price: formattedPrice,
      cancelUrl: bookingId ? `${appUrl}/cancel/${bookingId}` : appUrl,
    }).catch(console.error)

    console.log('bookingPage.user:', bookingPage.user)

    if (ownerEmail) {

    sendOwnerNotification({
      to: ownerEmail,
      customerName: data.customer_name,
      businessName: bookingPage.business_name,
      serviceName: service.name,
      date: formattedDate,
      time: formattedTime,
      duration: service.duration_minutes,
      price: formattedPrice,
    }).catch(console.error)
  }
  }

  return NextResponse.json(
    { message: 'Booking created successfully.', booking },
    { status: 201 }
  )
}
