import assert from 'node:assert/strict'
import test from 'node:test'
import { FREE_MONTHLY_BOOKING_LIMIT, getBookingMonthBoundaries, getEntitlements } from '../lib/plans'

test('Free has one calendar and a 20-booking allowance; Pro has no commercial limit', () => {
  assert.equal(FREE_MONTHLY_BOOKING_LIMIT, 20)
  assert.equal(getEntitlements('free').calendars, 1)
  assert.equal(getEntitlements('free').monthlyBookings, 20)
  assert.equal(getEntitlements('pro').calendars, 1)
  assert.equal(getEntitlements('pro').monthlyBookings, null)
  assert.equal(getEntitlements('free').reminders, false)
  assert.equal(getEntitlements('pro').reminders, true)
})

test('London month boundaries follow local daylight saving time', () => {
  const march = getBookingMonthBoundaries('2026-03-31', 'Europe/London')
  assert.equal(march.start.toISOString(), '2026-03-01T00:00:00.000Z')
  assert.equal(march.end.toISOString(), '2026-03-31T23:00:00.000Z')
  const october = getBookingMonthBoundaries('2026-10-31', 'Europe/London')
  assert.equal(october.start.toISOString(), '2026-09-30T23:00:00.000Z')
  assert.equal(october.end.toISOString(), '2026-11-01T00:00:00.000Z')
})

test('a UTC timestamp at the month boundary belongs to the shop-local month', () => {
  const october = getBookingMonthBoundaries(new Date('2026-09-30T23:30:00Z'), 'Europe/London')
  assert.equal(october.start.toISOString(), '2026-09-30T23:00:00.000Z')
})
