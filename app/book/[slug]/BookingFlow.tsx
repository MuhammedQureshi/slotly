"use client"

import { useState } from "react"
import ServiceSelector from "./ServiceSelector"

type Service = {
  id: string
  name: string
  duration_minutes: number
  price_pence: number | null
}

type Props = {
  services: Service[]
}

export default function BookingFlow({ services }: Props) {

    const [step, setStep] = useState<'service' | 'slot' | 'form' | 'success'>(
    services.length === 1 ? 'slot' : 'service'
    )

    if (step === 'service') return (
    <ServiceSelector
        services={services}
        onSelect={() => {
        setStep('slot')
        }}
    />
    )
    if (step === 'slot') return <div>Slot picker coming soon</div>
    if (step === 'form') return <div>Form coming soon</div>
    if (step === 'success') return <div>Booked!</div> 

}
