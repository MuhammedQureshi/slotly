'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { rescheduleBookingByToken } from './actions'

export default function RescheduleClient({ token }: { token: string }) {
  const [message, setMessage] = useState('')
  const router = useRouter()
  return <form onSubmit={async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setMessage('Checking availability…')
    try {
      const result = await rescheduleBookingByToken(token, String(form.get('starts_at') ?? ''))
      setMessage(result.error ?? 'Your appointment has been moved.')
      if (result.success) router.refresh()
    } catch {
      setMessage('Unable to reschedule. Please try again.')
    }
  }} className="mt-6 border-t border-stone-200 pt-6">
    <label htmlFor="new-time" className="block text-sm font-medium text-stone-900">Choose a new time</label>
    <input id="new-time" name="starts_at" type="datetime-local" required className="mt-2 block w-full rounded-lg border border-stone-300 p-2" />
    <button className="mt-3 rounded-lg bg-stone-900 px-4 py-2 text-sm text-white">Request reschedule</button>
    {message && <p role="status" className="mt-3 text-sm text-stone-700">{message}</p>}
  </form>
}
