'use client'

import { formatInTimeZone } from 'date-fns-tz'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Booking } from './BookingsTable'

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function BookingsCalendar({ bookings, timezone, selectedDate, onSelectDate, month, onMonthChange }: {
  bookings: Booking[]
  timezone: string
  selectedDate: string
  onSelectDate: (date: string) => void
  month: string
  onMonthChange: (month: string) => void
}) {
  const first = new Date(`${month}-01T12:00:00Z`)
  const start = new Date(first)
  start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7))
  const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')
  const byDate = new Map<string, Booking[]>()
  for (const booking of bookings) {
    const date = formatInTimeZone(new Date(booking.starts_at), timezone, 'yyyy-MM-dd')
    byDate.set(date, [...(byDate.get(date) ?? []), booking])
  }
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    return date.toISOString().slice(0, 10)
  })

  function moveMonth(offset: number) {
    const next = new Date(first)
    next.setUTCMonth(next.getUTCMonth() + offset)
    onMonthChange(next.toISOString().slice(0, 7))
  }

  return <Card className="mb-5 gap-0 overflow-hidden py-0 shadow-sm">
    <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
      <div>
        <h2 className="text-lg font-semibold">{new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first)}</h2>
        <p className="text-xs text-muted-foreground">Select a date to see its appointments</p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft className="size-4" /></Button>
        <Button variant="outline" size="icon" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight className="size-4" /></Button>
      </div>
    </div>
    <div className="grid grid-cols-7 border-b bg-secondary/40 text-center text-xs font-medium text-muted-foreground">
      {weekdays.map((day) => <div key={day} className="py-3">{day}</div>)}
    </div>
    <div className="grid grid-cols-7">
      {days.map((date) => {
        const appointments = byDate.get(date)?.filter((booking) => booking.status !== 'cancelled') ?? []
        const isCurrentMonth = date.startsWith(month)
        return <button
          key={date}
          type="button"
          onClick={() => onSelectDate(date)}
          aria-label={`${new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))}: ${appointments.length} appointment${appointments.length === 1 ? '' : 's'}`}
          className={`min-h-16 border-b border-r p-2 text-left transition-colors hover:bg-secondary/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:min-h-24 ${isCurrentMonth ? 'text-foreground' : 'bg-secondary/20 text-muted-foreground'} ${date === selectedDate ? 'bg-accent/10' : ''}`}
        >
          <span className={`inline-flex size-7 items-center justify-center rounded-full text-sm ${date === today ? 'bg-primary font-semibold text-primary-foreground' : ''}`}>
            {Number(date.slice(-2))}
          </span>
          {appointments.length > 0 && <span className="mt-1 flex items-center gap-1 text-xs font-medium text-accent"><span className="size-1.5 rounded-full bg-accent" />{appointments.length}<span className="hidden sm:inline"> booked</span></span>}
        </button>
      })}
    </div>
  </Card>
}
