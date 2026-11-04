export function overlapsWithBuffer(
  startMs: number,
  endMs: number,
  existingStartMs: number,
  existingEndMs: number,
  bufferMinutes: number
) {
  const bufferMs = bufferMinutes * 60_000
  return startMs < existingEndMs + bufferMs && endMs + bufferMs > existingStartMs
}

export function latestBookableDate(localToday: string, maxDaysAhead: number) {
  const latest = new Date(`${localToday}T12:00:00.000Z`)
  latest.setUTCDate(latest.getUTCDate() + maxDaysAhead)
  return latest.toISOString().slice(0, 10)
}

export function isOutsideChangeCutoff(startsAtMs: number, nowMs: number, cutoffHours: number) {
  return startsAtMs > nowMs + cutoffHours * 3600_000
}
