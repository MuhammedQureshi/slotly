'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { rescheduleBookingByToken } from './actions'
import { Button } from '@/components/ui/button'
import { DateTimeField } from '@/components/ui/date-picker'

export default function RescheduleClient({ token, timezone }: { token: string; timezone: string }) {
  const [message, setMessage] = useState('')
  const router = useRouter()
  return <form onSubmit={async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (!form.get('starts_at')) { setMessage('Choose a date and time.'); return }
    setMessage('Checking availability…')
    try {
      const result = await rescheduleBookingByToken(token, String(form.get('starts_at') ?? ''))
      setMessage(result.error ?? 'Your appointment has been moved.')
      if (result.success) router.refresh()
    } catch {
      setMessage('Unable to reschedule. Please try again.')
    }
  }} className="mt-6 border-t border-stone-200 pt-6">
    <h2 className="mb-3 text-sm font-semibold">Choose a new time</h2>
    <DateTimeField name="starts_at" timezone={timezone} />
    <Button type="submit" className="mt-4 w-full">Request reschedule</Button>
    {message && <p role="status" className="mt-3 text-sm text-stone-700">{message}</p>}
  </form>
}
