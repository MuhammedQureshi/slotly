import assert from 'node:assert/strict'
import test from 'node:test'
import { isOutsideChangeCutoff, latestBookableDate, overlapsWithBuffer } from '../lib/booking-rules'

test('a booking requires buffer space on both sides', () => {
  const minute = 60_000
  const existingStart = 9 * 60 * minute
  const existingEnd = existingStart + 45 * minute
  assert.equal(overlapsWithBuffer(existingEnd, existingEnd + 45 * minute,
    existingStart, existingEnd, 15), true)
  assert.equal(overlapsWithBuffer(existingEnd + 15 * minute, existingEnd + 60 * minute,
    existingStart, existingEnd, 15), false)
  assert.equal(overlapsWithBuffer(existingStart - 60 * minute, existingStart - 15 * minute,
    existingStart, existingEnd, 15), false)
})

test('advance booking date follows calendar days across daylight saving time', () => {
  assert.equal(latestBookableDate('2026-03-28', 3), '2026-03-31')
  assert.equal(latestBookableDate('2026-10-24', 3), '2026-10-27')
})

test('customer changes stop at the configured cutoff', () => {
  const now = Date.parse('2026-11-04T09:00:00Z')
  assert.equal(isOutsideChangeCutoff(now + 13 * 3600_000, now, 12), true)
  assert.equal(isOutsideChangeCutoff(now + 12 * 3600_000, now, 12), false)
})
