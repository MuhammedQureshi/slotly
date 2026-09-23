import { fromZonedTime, toZonedTime } from 'date-fns-tz'

import { supabase } from './supabase'

type ExistingBooking = {
  starts_at: string
  ends_at: string
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function assertValidInputs(
  date: string,
  duration: number,
  timezone: string,
  buffer: number,
  minNoticeHours: number
) {
  const parsedDate = new Date(`${date}T00:00:00.000Z`)
  const isValidDate =
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date

  if (!isValidDate) {
    throw new Error('date must be a valid calendar date in YYYY-MM-DD format')
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('duration must be greater than zero')
  }

  if (!Number.isFinite(buffer) || buffer < 0) {
    throw new Error('buffer must be zero or greater')
  }

  if (!Number.isFinite(minNoticeHours) || minNoticeHours < 0) {
    throw new Error('minNoticeHours must be zero or greater')
  }

  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: timezone }).format()
  } catch {
    throw new Error(`Invalid timezone: ${timezone}`)
  }
}

function nextCalendarDate(date: string): string {
  const nextDate = new Date(`${date}T00:00:00.000Z`)
  nextDate.setUTCDate(nextDate.getUTCDate() + 1)
  return nextDate.toISOString().slice(0, 10)
}

function slotOverlapsBooking(
  slotStart: Date,
  duration: number,
  booking: ExistingBooking
): boolean {
  const slotEnd = new Date(slotStart.getTime() + duration * 60_000)
  const bookingStart = new Date(booking.starts_at)
  const bookingEnd = new Date(booking.ends_at)

  return slotStart < bookingEnd && slotEnd > bookingStart
}

export async function getAvailableSlots(
  bookingPageId: string,
  date: string,
  duration: number,
  timezone: string,
  buffer: number,
  minNoticeHours: number
): Promise<string[]> {
  assertValidInputs(date, duration, timezone, buffer, minNoticeHours)

  // Use a local noon in the owner's timezone so the calendar day remains stable
  // across positive/negative UTC offsets and daylight-saving transitions.
  const targetInstant = fromZonedTime(`${date}T12:00:00`, timezone)
  const dayOfWeek = toZonedTime(targetInstant, timezone).getDay()

  const { data: rule, error: ruleError } = await supabase
    .from('availability_rules')
    .select('is_active, start_time, end_time')
    .eq('booking_page_id', bookingPageId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle()

  if (ruleError) {
    throw new Error(`Could not load availability: ${ruleError.message}`)
  }

  if (!rule || !rule.is_active) return []

  const { data: blocked, error: blockedError } = await supabase
    .from('blocked_dates')
    .select('id')
    .eq('booking_page_id', bookingPageId)
    .eq('blocked_date', date)
    .maybeSingle()

  if (blockedError) {
    throw new Error(`Could not check blocked dates: ${blockedError.message}`)
  }

  if (blocked) return []

  const slots: string[] = []
  const start = timeToMinutes(rule.start_time)
  const end = timeToMinutes(rule.end_time)

  for (let current = start; current + duration <= end; current += duration + buffer) {
    const hours = Math.floor(current / 60).toString().padStart(2, '0')
    const minutes = (current % 60).toString().padStart(2, '0')
    const slotStart = fromZonedTime(`${date}T${hours}:${minutes}:00`, timezone)
    slots.push(slotStart.toISOString())
  }

  if (slots.length === 0) return []

  const dayStart = fromZonedTime(`${date}T00:00:00`, timezone)
  const dayEnd = fromZonedTime(`${nextCalendarDate(date)}T00:00:00`, timezone)

  // Include bookings that cross midnight into the target date.
  const { data: existingBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('starts_at, ends_at')
    .eq('booking_page_id', bookingPageId)
    .eq('status', 'confirmed')
    .lt('starts_at', dayEnd.toISOString())
    .gt('ends_at', dayStart.toISOString())

  if (bookingsError) {
    throw new Error(`Could not load existing bookings: ${bookingsError.message}`)
  }

  const bookings = (existingBookings ?? []) as ExistingBooking[]
  const earliestAllowedStart = Date.now() + minNoticeHours * 60 * 60 * 1000

  return slots.filter((slot) => {
    const slotStart = new Date(slot)
    const isFarEnoughAhead = slotStart.getTime() >= earliestAllowedStart
    const overlapsBooking = bookings.some((booking) =>
      slotOverlapsBooking(slotStart, duration, booking)
    )

    return isFarEnoughAhead && !overlapsBooking
  })
}