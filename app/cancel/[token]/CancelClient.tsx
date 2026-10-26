'use client'

import { useState } from 'react'
import { CheckCircle2, LoaderCircle } from 'lucide-react'
import { cancelBookingByToken } from './actions'

export default function CancelClient({ token }: { token: string }) {
  const [isCancelling, setIsCancelling] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [error, setError] = useState<string>()

  async function handleCancel() {
    if (isCancelling) return
    setIsCancelling(true)
    setError(undefined)

    try {
      const result = await cancelBookingByToken(token)
      if (result.error) {
        setError(result.error)
      } else {
        setIsCancelled(true)
      }
    } catch {
      setError('Unable to cancel your booking. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isCancelled) {
    return (
      <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <CheckCircle2 aria-hidden="true" className="mx-auto size-7 text-emerald-700" />
        <h2 className="mt-3 font-semibold text-emerald-950">Booking cancelled</h2>
        <p className="mt-1 text-sm leading-6 text-emerald-800">
          Your appointment has been cancelled. The time is now available for others to book.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 border-t border-stone-200 pt-6">
      <p className="text-sm leading-6 text-stone-600">
        Are you sure you want to cancel this appointment? This cannot be undone.
      </p>
      {error ? <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={isCancelling}
        onClick={handleCancel}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCancelling ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
        {isCancelling ? 'Cancelling…' : 'Yes, cancel my booking'}
      </button>
    </div>
  )
}
