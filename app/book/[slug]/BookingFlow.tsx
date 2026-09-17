"use client"

import { useState } from "react"
import ServiceSelector from "./ServiceSelector"
import SlotPicker from "./SlotPicker"

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

export default function BookingFlow({ services, pageId, timezone }: Props) {

    const [step, setStep] = useState<'service' | 'slot' | 'form' | 'success'>(
    services.length === 1 ? 'slot' : 'service'
    )
    const [service, setService] = useState<Service | null>(
      services.length === 1 ? services[0] : null
    )
    const [selectedSlot, setSelectedSlot] = useState<string>()

    if (step === 'service') return (
    <ServiceSelector
        services={services}
        onSelect={(selectedService) => {
        setService(selectedService)
        setStep('slot')
        }}
    />
    )
    if (step === 'slot' && service) return (
      <SlotPicker
        pageId={pageId}
        duration={service.duration_minutes}
        serviceName={service.name}
        timezone={timezone}
        showBackButton={services.length > 1}
        onBack={() => setStep('service')}
        onContinue={(slot) => {
          setSelectedSlot(slot)
          setStep('form')
        }}
      />
    )
    if (step === 'form') return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Complete your booking</h2>
        <p className="mt-2 text-sm text-slate-600">
          Booking form coming soon for {selectedSlot ? new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: timezone,
          }).format(new Date(selectedSlot)) : 'your selected time'}.
        </p>
      </div>
    )
    if (step === 'success') return <div>Booked!</div> 

}
