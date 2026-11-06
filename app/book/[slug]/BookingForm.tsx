'use client'

import { useState } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  LoaderCircle,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const bookingSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(1, 'Enter your name.')
    .max(100, 'Name must be 100 characters or fewer.'),
  customer_email: z
    .string()
    .trim()
    .email('Enter a valid email address.'),
  customer_phone: z
    .string()
    .trim()
    .max(30, 'Phone number must be 30 characters or fewer.')
    .optional(),
  customer_notes: z
    .string()
    .trim()
    .max(1000, 'Notes must be 1,000 characters or fewer.')
    .optional(),
})

type FormValues = z.infer<typeof bookingSchema>

type Props = {
  bookingPageId: string
  service: {
    id: string
    name: string
    price_pence: number | null
  }
  startsAt: string
  timezone: string
  onBack: () => void
  onSuccess: () => void
}

type BookingResponse = {
  error?: unknown
}

export default function BookingForm({
  bookingPageId,
  service,
  startsAt,
  timezone,
  onBack,
  onSuccess,
}: Props) {
  const [serverError, setServerError] = useState<string>()
  const [requestKey] = useState(() => crypto.randomUUID())
  const [website, setWebsite] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      customer_notes: '',
    },
  })

  const selectedDate = new Date(startsAt)
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone,
  }).format(selectedDate)
  const formattedTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(selectedDate)
  const price =
    service.price_pence === null || service.price_pence === 0
      ? 'Free'
      : `£${(service.price_pence / 100).toFixed(2)}`

  const onSubmit = async (values: FormValues) => {
    setServerError(undefined)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_key: requestKey,
          website,
          booking_page_id: bookingPageId,
          service_id: service.id,
          starts_at: startsAt,
          ...values,
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as BookingResponse

      if (!response.ok) {
        const fallback =
          response.status === 409
            ? 'This time was just booked by someone else. Please choose another.'
            : 'We could not complete your booking. Please try again.'

        setServerError(
          typeof payload.error === 'string' ? payload.error : fallback
        )
        return
      }

      onSuccess()
    } catch {
      setServerError(
        'We could not connect to the booking service. Please try again.'
      )
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start gap-3">
        <Button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          variant="outline"
          size="icon"
          className="mt-0.5"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          <span className="sr-only">Back to date and time</span>
        </Button>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Your details
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Review your appointment and complete the booking.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card className="h-fit bg-amber-50/70"><CardContent>
          <p className="text-xs font-semibold tracking-[0.14em] text-amber-800 uppercase">
            Booking summary
          </p>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">
            {service.name}
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex gap-3 text-slate-700">
              <CalendarDays
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-amber-700"
              />
              <div>
                <dt className="sr-only">Date</dt>
                <dd>{formattedDate}</dd>
              </div>
            </div>
            <div className="flex gap-3 text-slate-700">
              <Clock
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-amber-700"
              />
              <div>
                <dt className="sr-only">Time</dt>
                <dd>{formattedTime}</dd>
              </div>
            </div>
          </dl>
          <div className="mt-5 flex items-center justify-between border-t border-amber-200 pt-4">
            <span className="text-sm text-slate-600">Total</span>
            <span className="font-semibold tabular-nums text-slate-950">
              {price}
            </span>
          </div>
          {service.price_pence !== null && service.price_pence > 0 &&
            <p className="mt-3 text-xs leading-5 text-slate-600">Payment is made directly to the barber at your appointment. Slotly does not collect it.</p>}
        </CardContent></Card>

        <Card><CardContent>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div className="absolute -left-[10000px]" aria-hidden="true">
            <Label htmlFor="booking-website">Leave this field empty</Label>
            <Input id="booking-website" name="website" autoComplete="off" tabIndex={-1}
              value={website} onChange={(event) => setWebsite(event.target.value)} />
          </div>
          <div className="space-y-5">
            <div>
              <Label
                htmlFor="customer_name"
              >
                Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="customer_name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.customer_name)}
                aria-describedby={
                  errors.customer_name ? 'customer_name-error' : undefined
                }
                className="mt-2 h-10"
                {...register('customer_name')}
              />
              {errors.customer_name ? (
                <p
                  id="customer_name-error"
                  className="mt-1.5 text-sm text-red-600"
                >
                  {errors.customer_name.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label
                htmlFor="customer_email"
              >
                Email <span className="text-red-600">*</span>
              </Label>
              <Input
                id="customer_email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.customer_email)}
                aria-describedby={
                  errors.customer_email ? 'customer_email-error' : undefined
                }
                className="mt-2 h-10"
                {...register('customer_email')}
              />
              {errors.customer_email ? (
                <p
                  id="customer_email-error"
                  className="mt-1.5 text-sm text-red-600"
                >
                  {errors.customer_email.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label
                htmlFor="customer_phone"
              >
                Phone{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </Label>
              <Input
                id="customer_phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Your phone number"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.customer_phone)}
                aria-describedby={
                  errors.customer_phone ? 'customer_phone-error' : undefined
                }
                className="mt-2 h-10"
                {...register('customer_phone')}
              />
              {errors.customer_phone ? (
                <p
                  id="customer_phone-error"
                  className="mt-1.5 text-sm text-red-600"
                >
                  {errors.customer_phone.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label
                htmlFor="customer_notes"
              >
                Notes{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </Label>
              <Textarea
                id="customer_notes"
                rows={4}
                placeholder="Anything we should know before your appointment?"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.customer_notes)}
                aria-describedby={
                  errors.customer_notes ? 'customer_notes-error' : undefined
                }
                className="mt-2 min-h-28 resize-y"
                {...register('customer_notes')}
              />
              {errors.customer_notes ? (
                <p
                  id="customer_notes-error"
                  className="mt-1.5 text-sm text-red-600"
                >
                  {errors.customer_notes.message}
                </p>
              ) : null}
            </div>
          </div>

          {serverError ? (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm leading-6 text-red-700"
            >
              {serverError}
              <Button
                type="button"
                variant="link"
                onClick={onBack}
                className="ml-1 px-1 text-red-700"
              >
                Choose another time
              </Button>
            </div>
          ) : null}

          <p className="text-xs leading-5 text-slate-600">
            Your details are shared with the business you book with so they can manage your appointment. See Slotly&apos;s{' '}
            <Link href="/privacy" target="_blank" className="font-medium underline underline-offset-2">Privacy Policy</Link>.
          </p>
          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="mt-6 w-full"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                Confirming…
              </>
            ) : (
              'Confirm booking'
            )}
          </Button>
        </form>
        </CardContent></Card>
      </div>
    </div>
  )
}
