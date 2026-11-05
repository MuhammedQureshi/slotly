'use client'

import { useState } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { CalendarDays, Clock3, Eye } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import BookingSheet from './BookingSheet'

export type Booking = {
  id: string
  cancel_token: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_notes: string | null
  private_notes?: string | null
  starts_at: string
  ends_at: string
  status: string
  price_pence: number | null
  service: { name: string } | null
}

function formatDate(date: string, timezone: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: timezone,
  }).format(new Date(date))
}

function formatTime(date: string, timezone: string) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone,
  }).format(new Date(date))
}

function getStatusClassName(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'cancelled':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'completed':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'no_show':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600'
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={`capitalize ${getStatusClassName(status)}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {status.replaceAll('_', ' ')}
    </Badge>
  )
}

export default function BookingsTable({
  bookings,
  canWriteNotes,
  timezone,
  searchQuery = '',
  initialView = 'all',
}: {
  bookings: Booking[]
  canWriteNotes: boolean
  timezone: string
  searchQuery?: string
  initialView?: 'all' | 'day' | 'week'
}) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [view, setView] = useState<'all' | 'day' | 'week'>(initialView)
  const [selectedDate, setSelectedDate] = useState(() => formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd'))
  const day = new Date(`${selectedDate}T12:00:00Z`)
  const weekStart = new Date(day)
  weekStart.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7)
  const visibleBookings = bookings.filter((booking) => {
    if (view === 'all') return true
    const localDate = formatInTimeZone(new Date(booking.starts_at), timezone, 'yyyy-MM-dd')
    return view === 'day' ? localDate === selectedDate :
      localDate >= weekStart.toISOString().slice(0, 10) && localDate < weekEnd.toISOString().slice(0, 10)
  })

  return (
    <>
      <section aria-labelledby="bookings-heading">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-amber-700">Appointments</p>
            <h1
              id="bookings-heading"
              className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
            >
              Bookings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery ? `Results matching “${searchQuery}”.` : 'View customer details and upcoming appointments.'}
            </p>
          </div>
          <Badge variant="secondary">
            {visibleBookings.length} {visibleBookings.length === 1 ? 'booking' : 'bookings'}
          </Badge>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Tabs value={view} onValueChange={(value) => setView(value as 'all' | 'day' | 'week')}>
            <TabsList aria-label="Calendar view">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          {view !== 'all' && <div className="w-48"><DatePicker label="View date" value={selectedDate} onValueChange={setSelectedDate} timezone={timezone} /></div>}
        </div>

        {visibleBookings.length === 0 && <Card className="mb-4"><CardContent className="text-sm text-muted-foreground">No appointments in this view.</CardContent></Card>}

        {visibleBookings.length > 0 && <Card className="hidden py-0 md:block">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="h-12 px-5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Customer
                </TableHead>
                <TableHead className="h-12 px-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Service
                </TableHead>
                <TableHead className="h-12 px-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Date & time
                </TableHead>
                <TableHead className="h-12 px-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Status
                </TableHead>
                <TableHead className="h-12 px-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleBookings.map((booking) => (
                <TableRow
                  key={booking.id}
                  className="border-slate-100 hover:bg-slate-50/70"
                >
                  <TableCell className="px-5 py-4">
                    <div className="font-semibold text-slate-900">
                      {booking.customer_name}
                    </div>
                    <div className="mt-1 max-w-52 truncate text-sm text-slate-500">
                      {booking.customer_email}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <span className="font-medium text-slate-700">
                      {booking.service?.name ?? 'Service unavailable'}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="font-medium text-slate-800">
                      {formatDate(booking.starts_at, timezone)}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {formatTime(booking.starts_at, timezone)}–{formatTime(booking.ends_at, timezone)}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <StatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 bg-white text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <Eye aria-hidden="true" data-icon="inline-start" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>}

        <div className="space-y-3 md:hidden">
          {visibleBookings.map((booking) => (
            <Card
              key={booking.id}
            >
              <CardContent>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-950">
                    {booking.customer_name}
                  </h2>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {booking.service?.name ?? 'Service unavailable'}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-4 shrink-0 text-slate-400"
                  />
                  <span>{formatDate(booking.starts_at, timezone)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock3
                    aria-hidden="true"
                    className="size-4 shrink-0 text-slate-400"
                  />
                  <span>{formatTime(booking.starts_at, timezone)}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="mt-4 h-10 w-full border-slate-200 bg-white text-slate-700"
                onClick={() => setSelectedBooking(booking)}
              >
                <Eye aria-hidden="true" data-icon="inline-start" />
                View booking
              </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <BookingSheet
        key={selectedBooking?.id ?? 'none'}
        booking={selectedBooking}
        canWriteNotes={canWriteNotes}
        timezone={timezone}
        onClose={() => setSelectedBooking(null)}
      />
    </>
  )
}
