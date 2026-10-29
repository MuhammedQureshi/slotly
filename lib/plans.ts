import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

export const FREE_MONTHLY_BOOKING_LIMIT = 25
export const FREE_BOOKING_PAGE_LIMIT = 1

export function isProPlan(plan: string | null | undefined) {
  return plan === 'pro'
}

export function getBookingMonthBoundaries(
  value: Date | string,
  timeZone: string
) {
  const yearMonth =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value.slice(0, 7)
      : formatInTimeZone(value, timeZone, 'yyyy-MM')
  const [year, month] = yearMonth.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextMonthYear = month === 12 ? year + 1 : year

  return {
    start: fromZonedTime(`${yearMonth}-01T00:00:00`, timeZone),
    end: fromZonedTime(
      `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00`,
      timeZone
    ),
  }
}
