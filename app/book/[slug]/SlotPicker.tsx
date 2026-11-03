'use client'

import { useRef, useState } from 'react'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { ArrowLeft, CalendarDays, LoaderCircle } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  pageId: string
  duration: number
  serviceName: string
  timezone: string
  showBackButton: boolean
  onBack: () => void
  onContinue: (slot: string) => void
}

type SlotsResponse = {
  slots?: string[]
  error?: string
}

export default function SlotPicker({
  pageId,
  duration,
  serviceName,
  timezone,
  showBackButton,
  onBack,
  onContinue,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const requestId = useRef(0)
  const zonedNow = toZonedTime(new Date(), timezone)
  const today = new Date(
    zonedNow.getFullYear(),
    zonedNow.getMonth(),
    zonedNow.getDate()
  )

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedSlot(undefined)
    setSlots([])
    setError(undefined)

    const currentRequest = ++requestId.current
    if (!date) return

    setIsLoading(true)
    const dateValue = formatInTimeZone(date, timezone, 'yyyy-MM-dd')
    const params = new URLSearchParams({
      page_id: pageId,
      duration: duration.toString(),
      date: dateValue,
    })

    try {
      const response = await fetch(`/api/slots?${params.toString()}`, {
        cache: 'no-store',
      })
      const payload = (await response.json()) as SlotsResponse

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to load available times.')
      }

      if (currentRequest === requestId.current) {
        setSlots(payload.slots ?? [])
      }
    } catch (requestError) {
      if (currentRequest === requestId.current) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load available times.'
        )
      }
    } finally {
      if (currentRequest === requestId.current) {
        setIsLoading(false)
      }
    }
  }

  const formatSlotTime = (slot: string) =>
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    }).format(new Date(slot))

  return (
    <div>
      <div className="mb-6 flex items-start gap-3">
        {showBackButton && (
          <Button
            type="button"
            onClick={onBack}
            variant="outline"
            size="icon"
            className="mt-0.5"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            <span className="sr-only">Back to services</span>
          </Button>
        )}
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Choose a date and time
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {serviceName} · {duration} minutes
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
        <Card className="min-w-0">
          <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={{ before: today }}
            timeZone={timezone}
            showOutsideDays={false}
          />
          </CardContent>
        </Card>

        <Card><CardContent>
          {selectedDate ? (
            <>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <CalendarDays aria-hidden="true" className="size-4 text-slate-500" />
                {formatInTimeZone(selectedDate, timezone, 'EEEE, d MMMM')}
              </div>

              <div className="mt-5 min-h-36">
                {isLoading ? (
                  <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-slate-500">
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                    Loading times…
                  </div>
                ) : error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                    {error}
                  </div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot === slot

                      return (
                        <Button
                          key={slot}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedSlot(slot)}
                          variant={isSelected ? 'default' : 'outline'}
                          className="h-10 w-full"
                        >
                          {formatSlotTime(slot)}
                        </Button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 text-center text-sm leading-6 text-slate-500">
                    No available times on this date. Try another day.
                  </div>
                )}
              </div>

              {selectedSlot && (
                <Button
                  type="button"
                  onClick={() => onContinue(selectedSlot)}
                  size="lg"
                  className="mt-5 w-full"
                >
                  Continue
                </Button>
              )}
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500">
                <CalendarDays aria-hidden="true" className="size-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-800">Select a date</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Available appointment times will appear here.
              </p>
            </div>
          )}
        </CardContent></Card>
      </div>
    </div>
  )
}
