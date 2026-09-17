import { getAvailableSlots } from '../lib/slots'

const [
  bookingPageId,
  date,
  durationValue = '30',
  timezone = 'Europe/London',
  bufferValue = '0',
  minNoticeValue = '0',
] = process.argv.slice(2)

if (!bookingPageId || !date) {
  console.error(
    'Usage: npm run test:slots -- <booking-page-id> <YYYY-MM-DD> [duration] [timezone] [buffer] [min-notice-hours]'
  )
  process.exit(1)
}

async function main() {
  const slots = await getAvailableSlots(
    bookingPageId,
    date,
    Number(durationValue),
    timezone,
    Number(bufferValue),
    Number(minNoticeValue)
  )

  console.log(JSON.stringify(slots, null, 2))
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
