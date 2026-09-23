import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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
  // TODO: parse the JSON body
  const body = await request.json()
  // TODO: validate it with bookingSchema.safeParse()
  const result = bookingSchema.safeParse(body)
  // TODO: if invalid, return NextResponse.json({ error: ... }, { status: 400 })
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const data = result.data;

  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('duration_minutes, price_pence')
    .eq('id', data.service_id)
    .maybeSingle()

  if (serviceError) {
    console.error('Error loading service for booking:', serviceError)
    return NextResponse.json({ error: 'Unable to load service details.' }, { status: 500 })
  }

  if (!service) {
    return NextResponse.json({ error: 'Service not found.' }, { status: 404 })
  }

  const startsAt = new Date(data.starts_at)
  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60000)

  const {data: booking, error: insertError } = await supabaseAdmin.rpc('create_booking', {
    p_booking_page_id: data.booking_page_id,
    p_service_id: data.service_id,
    p_customer_name: data.customer_name,
    p_customer_email: data.customer_email,
    p_customer_phone: data.customer_phone || null,
    p_customer_notes: data.customer_notes || null,
    p_price_pence: service.price_pence,
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
  })

  if (insertError) {
  console.error('Error creating booking:', insertError)
  
  if (insertError.message.includes('slot_already_booked')) {
    return NextResponse.json({ error: 'This slot has just been booked. Please choose another.' }, { status: 409 })
  }
  
  return NextResponse.json({ error: 'Unable to create booking.' }, { status: 500 })
}

return NextResponse.json({ message: 'Booking created successfully.', booking }, { status: 201 })

}