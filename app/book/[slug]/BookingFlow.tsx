'use client'

import { useState } from 'react'
import { CalendarCheck2 } from 'lucide-react'

import BookingForm from './BookingForm'
import ServiceSelector from './ServiceSelector'
import SlotPicker from './SlotPicker'

type Service = {
  id: string
  name: string
  duration_minutes: number
  price_pence: number | null
}

type Props = {
  services: Service[]
  pageId: string
  timezone: string
}

type Step = 'service' | 'slot' | 'form' | 'success'

export default function BookingFlow({ services, pageId, timezone }: Props) {
  const hasSingleService = services.length === 1
  const [step, setStep] = useState<Step>(
    hasSingleService ? 'slot' : 'service'
  )
  const [service, setService] = useState<Service | null>(
    hasSingleService ? services[0] : null
  )
  const [selectedSlot, setSelectedSlot] = useState<string>()

  if (step === 'service') {
    return (
      <ServiceSelector
        services={services}
        onSelect={(selectedService) => {
          setService(selectedService)
          setSelectedSlot(undefined)
          setStep('slot')
        }}
      />
    )
  }

  if (step === 'slot' && service) {
    return (
      <SlotPicker
        pageId={pageId}
        duration={service.duration_minutes}
        serviceName={service.name}
        timezone={timezone}
        showBackButton={!hasSingleService}
        onBack={() => setStep('service')}
        onContinue={(slot) => {
          setSelectedSlot(slot)
          setStep('form')
        }}
      />
    )
  }

  if (step === 'form' && service && selectedSlot) {
    return (
      <BookingForm
        bookingPageId={pageId}
        service={service}
        startsAt={selectedSlot}
        timezone={timezone}
        onBack={() => setStep('slot')}
        onSuccess={() => setStep('success')}
      />
    )
  }

  if (step === 'success' && service && selectedSlot) {
    const appointment = new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: timezone,
    }).format(new Date(selectedSlot))

    return (
      <div className="rounded-2xl border border-emerald-200 bg-white px-6 py-10 text-center shadow-sm sm:px-10">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CalendarCheck2 aria-hidden="true" className="size-7" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
          Booking confirmed
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Your {service.name} appointment is booked for {appointment}. Your
          booking has been saved successfully.
        </p>
        <button
          type="button"
          onClick={() => {
            setSelectedSlot(undefined)
            setService(hasSingleService ? services[0] : null)
            setStep(hasSingleService ? 'slot' : 'service')
          }}
          className="mt-6 h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Book another appointment
        </button>
      </div>
    )
  }

  return null
}
