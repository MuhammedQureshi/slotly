'use client'

import { useState } from 'react'
import {
  CalendarDays,
  Clock3,
  Eye,
  Mail,
  MessageSquareText,
  Phone,
  ReceiptText,
  UserRound,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Booking = {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_notes: string | null
  starts_at: string
  ends_at: string
  status: string
  price_pence: number | null
  service: { name: string } | null
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function formatDate(date: string) {
  return dateFormatter.format(new Date(date))
}

function formatTime(date: string) {
  return timeFormatter.format(new Date(date))
}

function formatPrice(pricePence: number | null) {
  if (pricePence === null || pricePence === 0) return 'Free'
  return `£${(pricePence / 100).toFixed(2)}`
}

function getStatusClassName(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'cancelled':
      return 'border-red-200 bg-red-50 text-red-700'
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
      {status}
    </Badge>
  )
}

export default function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

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
              View customer details and upcoming appointments.
            </p>
          </div>
          <div className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
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
              {bookings.map((booking) => (
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
                      {formatDate(booking.starts_at)}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {formatTime(booking.starts_at)}–{formatTime(booking.ends_at)}
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
        </div>

        <div className="space-y-3 md:hidden">
          {bookings.map((booking) => (
            <article
              key={booking.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
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
                  <span>{formatDate(booking.starts_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock3
                    aria-hidden="true"
                    className="size-4 shrink-0 text-slate-400"
                  />
                  <span>{formatTime(booking.starts_at)}</span>
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
            </article>
          ))}
        </div>
      </section>

      <Sheet
        open={selectedBooking !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(null)
        }}
      >
        <SheetContent className="w-full gap-0 bg-white p-0 sm:max-w-md">
          <SheetHeader className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-amber-700 uppercase">
              Appointment
            </p>
            <SheetTitle className="mt-1 text-xl font-semibold text-slate-950">
              Booking details
            </SheetTitle>
            <SheetDescription>
              Customer and appointment information.
            </SheetDescription>
          </SheetHeader>

          {selectedBooking ? (
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-600">Service</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {selectedBooking.service?.name ?? 'Service unavailable'}
                    </p>
                  </div>
                  <StatusBadge status={selectedBooking.status} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-4 text-amber-700"
                  />
                  {formatDate(selectedBooking.starts_at)}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <Clock3
                    aria-hidden="true"
                    className="size-4 text-amber-700"
                  />
                  {formatTime(selectedBooking.starts_at)}–
                  {formatTime(selectedBooking.ends_at)}
                </div>
              </div>

              <dl className="mt-7 space-y-5">
                <div className="flex gap-3">
                  <UserRound
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-slate-400"
                  />
                  <div className="min-w-0">
                    <dt className="text-xs font-medium text-slate-500">Customer</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {selectedBooking.customer_name}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Mail
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-slate-400"
                  />
                  <div className="min-w-0">
                    <dt className="text-xs font-medium text-slate-500">Email</dt>
                    <dd className="mt-1 break-words text-slate-800">
                      <a
                        href={`mailto:${selectedBooking.customer_email}`}
                        className="hover:text-slate-950 hover:underline"
                      >
                        {selectedBooking.customer_email}
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-slate-400"
                  />
                  <div className="min-w-0">
                    <dt className="text-xs font-medium text-slate-500">Phone</dt>
                    <dd className="mt-1 text-slate-800">
                      {selectedBooking.customer_phone ? (
                        <a
                          href={`tel:${selectedBooking.customer_phone.replace(/\s/g, '')}`}
                          className="hover:text-slate-950 hover:underline"
                        >
                          {selectedBooking.customer_phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">Not provided</span>
                      )}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ReceiptText
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-slate-400"
                  />
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Price</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {formatPrice(selectedBooking.price_pence)}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3 border-t border-slate-100 pt-5">
                  <MessageSquareText
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-slate-400"
                  />
                  <div className="min-w-0">
                    <dt className="text-xs font-medium text-slate-500">Notes</dt>
                    <dd className="mt-1 whitespace-pre-wrap leading-6 text-slate-800">
                      {selectedBooking.customer_notes || (
                        <span className="text-slate-400">No notes provided</span>
                      )}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
