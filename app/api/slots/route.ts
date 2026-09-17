import { getAvailableSlots } from '@/lib/slots'
import { supabaseAdmin } from '@/lib/supabase'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return (
    DATE_PATTERN.test(value) &&
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pageId = searchParams.get('page_id')
  const date = searchParams.get('date')
  const duration = Number(searchParams.get('duration'))

  if (!pageId || !date || !isValidDate(date)) {
    return Response.json(
      { error: 'page_id and a valid date in YYYY-MM-DD format are required.' },
      { status: 400 }
    )
  }

  if (!Number.isInteger(duration) || duration <= 0) {
    return Response.json(
      { error: 'duration must be a positive whole number.' },
      { status: 400 }
    )
  }

  const { data: bookingPage, error: pageError } = await supabaseAdmin
    .from('booking_pages')
    .select('id, timezone, buffer_minutes, min_notice_hours')
    .eq('id', pageId)
    .eq('is_published', true)
    .eq('is_active', true)
    .maybeSingle()

  if (pageError) {
    console.error('Error loading booking page for slots:', pageError)
    return Response.json({ error: 'Unable to load available slots.' }, { status: 500 })
  }

  if (!bookingPage) {
    return Response.json({ error: 'Booking page not found.' }, { status: 404 })
  }

  // Only allow durations that belong to an active service on this page.
  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('id')
    .eq('booking_page_id', pageId)
    .eq('duration_minutes', duration)
    .limit(1)
    .maybeSingle()

  if (serviceError) {
    console.error('Error validating service duration:', serviceError)
    return Response.json({ error: 'Unable to load available slots.' }, { status: 500 })
  }

  if (!service) {
    return Response.json({ error: 'Service not found.' }, { status: 400 })
  }

  try {
    const slots = await getAvailableSlots(
      pageId,
      date,
      duration,
      bookingPage.timezone ?? 'Europe/London',
      bookingPage.buffer_minutes ?? 0,
      bookingPage.min_notice_hours ?? 0
    )

    return Response.json(
      { slots },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Error generating available slots:', error)
    return Response.json({ error: 'Unable to load available slots.' }, { status: 500 })
  }
}
