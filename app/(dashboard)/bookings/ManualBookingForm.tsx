'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createManualBooking } from './actions'

type Service = { id: string; name: string }

export default function ManualBookingForm({ services }: { services: Service[] }) {
  const [message, setMessage] = useState('')
  const router = useRouter()
  return <form onSubmit={async (event) => {
    event.preventDefault()
    setMessage('Saving…')
    try {
      const result = await createManualBooking(new FormData(event.currentTarget))
      setMessage(result.error ?? 'Appointment added.')
      if (result.success) router.refresh()
    } catch { setMessage('Unable to save. Please try again.') }
  }} className="mb-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
    <h2 className="sm:col-span-2 font-semibold">Add an appointment</h2>
    <select name="service_id" required className="rounded-lg border border-stone-300 p-2">
      <option value="">Choose service</option>
      {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
    </select>
    <input name="starts_at" type="datetime-local" required aria-label="Appointment time" className="rounded-lg border border-stone-300 p-2" />
    <input name="customer_name" required placeholder="Customer name" className="rounded-lg border border-stone-300 p-2" />
    <input name="customer_email" type="email" required placeholder="Customer email" className="rounded-lg border border-stone-300 p-2" />
    <button className="rounded-lg bg-stone-900 px-4 py-2 text-white">Add booking</button>
    {message && <p role="status" className="self-center text-sm text-stone-700">{message}</p>}
  </form>
}
