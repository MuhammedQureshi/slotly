'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  Clock3,
  Mail,
  MessageSquareText,
  Phone,
  ReceiptText,
  UserRound,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DateTimeField } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { cancelBooking, markBookingOutcome, rescheduleBookingAsOwner, savePrivateNotes } from './actions'
import type { Booking } from './BookingsTable'

type Props = {
  booking: Booking | null
  onClose: () => void
  canWriteNotes: boolean
  timezone: string
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

export default function BookingSheet({ booking, onClose, canWriteNotes, timezone }: Props) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string>()
  const [noteMessage, setNoteMessage] = useState('')
  const [rescheduleMessage, setRescheduleMessage] = useState('')
  const [outcomeMessage, setOutcomeMessage] = useState('')

  const closeSheet = () => {
    setConfirmOpen(false)
    setError(undefined)
    onClose()
  }

  const handleCancel = async () => {
    if (!booking) return

    setIsCancelling(true)
    setError(undefined)

    try {
      const result = await cancelBooking(booking.id)

      if (result?.error) {
        setError(result.error)
        return
      }

      setConfirmOpen(false)
      onClose()
    } catch {
      setError('Unable to cancel this booking. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <>
      <Sheet
        open={booking !== null}
        onOpenChange={(open) => {
          if (!open) closeSheet()
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

          {booking ? (
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-600">Service</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {booking.service?.name ?? 'Service unavailable'}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-4 text-amber-700"
                  />
                  {formatDate(booking.starts_at, timezone)}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <Clock3
                    aria-hidden="true"
                    className="size-4 text-amber-700"
                  />
                  {formatTime(booking.starts_at, timezone)}–{formatTime(booking.ends_at, timezone)}
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
                      {booking.customer_name}
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
                        href={`mailto:${booking.customer_email}`}
                        className="hover:text-slate-950 hover:underline"
                      >
                        {booking.customer_email}
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
                      {booking.customer_phone ? (
                        <a
                          href={`tel:${booking.customer_phone.replace(/\s/g, '')}`}
                          className="hover:text-slate-950 hover:underline"
                        >
                          {booking.customer_phone}
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
                      {formatPrice(booking.price_pence)}
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
                      {booking.customer_notes || (
                        <span className="text-slate-400">No notes provided</span>
                      )}
                    </dd>
                  </div>
                </div>
              </dl>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="text-sm font-semibold">Private barber notes</p>
                {canWriteNotes ? <form key={booking.id} onSubmit={async (event) => {
                  event.preventDefault()
                  const notes = String(new FormData(event.currentTarget).get('private_notes') ?? '')
                  const result = await savePrivateNotes(booking.id, notes)
                  setNoteMessage(result.error ?? 'Notes saved.')
                }}>
                  <Textarea name="private_notes" defaultValue={booking.private_notes ?? ''} maxLength={2000}
                    className="mt-2 min-h-24" />
                  <Button type="submit" className="mt-2">Save notes</Button>
                  {noteMessage && <p role="status" className="mt-2 text-xs">{noteMessage}</p>}
                </form> : <p className="mt-2 whitespace-pre-wrap text-sm text-stone-600">
                  {booking.private_notes || 'Upgrade to Pro to add private notes.'}
                </p>}
              </div>

              {booking.status.toLowerCase() === 'confirmed' ? (
                <div className="mt-8 border-t border-slate-200 pt-6">
                  <form onSubmit={async (event) => {
                    event.preventDefault()
                    const value = String(new FormData(event.currentTarget).get('starts_at') ?? '')
                    if (!value) { setRescheduleMessage('Choose a date and time.'); return }
                    const result = await rescheduleBookingAsOwner(booking.id, value)
                    setRescheduleMessage(result.error ?? 'Appointment moved.')
                    if (result.success) { closeSheet(); router.refresh() }
                  }} className="mb-5">
                    <p className="mb-3 text-sm font-medium">Move appointment</p>
                    <DateTimeField name="starts_at" timezone={timezone} />
                    <Button type="submit" className="mt-3">Save new time</Button>
                    {rescheduleMessage && <p role="status" className="mt-2 text-sm text-muted-foreground">{rescheduleMessage}</p>}
                  </form>
                  {new Date(booking.starts_at) <= new Date() && <div className="mb-5 space-y-2">
                    <p className="text-sm font-medium">Appointment outcome</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={async () => {
                        const result = await markBookingOutcome(booking.id, 'completed')
                        setOutcomeMessage(result.error ?? 'Marked completed.')
                        if (result.success) { closeSheet(); router.refresh() }
                      }}>Mark completed</Button>
                      <Button variant="outline" onClick={async () => {
                        const result = await markBookingOutcome(booking.id, 'no_show')
                        setOutcomeMessage(result.error ?? 'Marked no-show.')
                        if (result.success) { closeSheet(); router.refresh() }
                      }}>Mark no-show</Button>
                    </div>
                    {outcomeMessage && <p role="status" className="text-sm text-muted-foreground">{outcomeMessage}</p>}
                  </div>}
                  <Button
                    variant="destructive"
                    className="h-10 w-full"
                    onClick={() => {
                      setError(undefined)
                      setConfirmOpen(true)
                    }}
                  >
                    Cancel booking
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isCancelling) {
            setConfirmOpen(open)
            if (!open) setError(undefined)
          }
        }}
      >
        <DialogContent className="p-5 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-950">
              Cancel this booking?
            </DialogTitle>
            <DialogDescription className="leading-6">
              This will cancel the appointment for {booking?.customer_name}.
              The time slot will become available to book again.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter className="-mx-5 -mb-5 mt-1 px-5 py-4">
            <Button
              variant="outline"
              disabled={isCancelling}
              onClick={() => {
                setConfirmOpen(false)
                setError(undefined)
              }}
            >
              Keep booking
            </Button>
            <Button
              variant="destructive"
              disabled={isCancelling}
              onClick={handleCancel}
            >
              {isCancelling ? 'Cancelling…' : 'Cancel booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
