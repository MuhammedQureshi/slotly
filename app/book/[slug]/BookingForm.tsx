'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  LoaderCircle,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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

const inputClassName =
  'mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-50'

export default function BookingForm({
  bookingPageId,
  service,
  startsAt,
  timezone,
  onBack,
  onSuccess,
}: Props) {
  const [serverError, setServerError] = useState<string>()
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
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          <span className="sr-only">Back to date and time</span>
        </button>
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
        <aside className="h-fit rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
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
        </aside>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="customer_name"
                className="text-sm font-medium text-slate-800"
              >
                Name <span className="text-red-600">*</span>
              </label>
              <input
                id="customer_name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.customer_name)}
                aria-describedby={
                  errors.customer_name ? 'customer_name-error' : undefined
                }
                className={inputClassName}
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
              <label
                htmlFor="customer_email"
                className="text-sm font-medium text-slate-800"
              >
                Email <span className="text-red-600">*</span>
              </label>
              <input
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
                className={inputClassName}
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
              <label
                htmlFor="customer_phone"
                className="text-sm font-medium text-slate-800"
              >
                Phone{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
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
                className={inputClassName}
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
              <label
                htmlFor="customer_notes"
                className="text-sm font-medium text-slate-800"
              >
                Notes{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="customer_notes"
                rows={4}
                placeholder="Anything we should know before your appointment?"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.customer_notes)}
                aria-describedby={
                  errors.customer_notes ? 'customer_notes-error' : undefined
                }
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-50"
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
              <button
                type="button"
                onClick={onBack}
                className="ml-1 font-semibold underline underline-offset-2 hover:text-red-900"
              >
                Choose another time
              </button>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                Confirming…
              </>
            ) : (
              'Confirm booking'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
