import assert from 'node:assert/strict'
import test from 'node:test'
import { bookingAccent, DEFAULT_BOOKING_ACCENT, isAccessibleBookingAccent } from '../lib/branding'

test('light or malformed legacy accents fall back to readable text colour', () => {
  assert.equal(isAccessibleBookingAccent('#f59e0b'), false)
  assert.equal(bookingAccent('#f59e0b', true), DEFAULT_BOOKING_ACCENT)
  assert.equal(bookingAccent('red', true), DEFAULT_BOOKING_ACCENT)
})

test('dark Pro accents stay in use; Free always uses the Slotly accent', () => {
  assert.equal(isAccessibleBookingAccent('#123456'), true)
  assert.equal(bookingAccent('#123456', true), '#123456')
  assert.equal(bookingAccent('#123456', false), DEFAULT_BOOKING_ACCENT)
})
