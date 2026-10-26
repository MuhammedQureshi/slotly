import type { Metadata } from 'next'
import { CalendarDays } from 'lucide-react'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import CancelClient from './CancelClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Cancel your booking | Slotly',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function CancelPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const validToken = z.string().uuid().safeParse(token).success
  const { data: booking, error } = validToken
    ? await supabaseAdmin
        .from('bookings')
        .select('booking_page_id, service_id, starts_at, ends_at, price_pence')
        .eq('cancel_token', token)
        .neq('status', 'cancelled')
        .maybeSingle()
    : { data: null, error: null }

  if (error) console.error('Could not load cancellation booking:', error.message)

  if (!booking) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-stone-950">Booking not found</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            This link is invalid or the booking has already been cancelled.
          </p>
        </div>
      </main>
    )
  }

  const [pageResult, serviceResult] = await Promise.all([
    supabaseAdmin.from('booking_pages').select('business_name, timezone').eq('id', booking.booking_page_id).single(),
    supabaseAdmin.from('services').select('name').eq('id', booking.service_id).maybeSingle(),
  ])

  if (pageResult.error || serviceResult.error) {
    return <main className="grid min-h-screen place-items-center bg-stone-50 px-6 text-center text-stone-600">Unable to load your appointment. Please try again.</main>
  }

  const timezone = pageResult.data.timezone || 'Europe/London'
  const date = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: timezone }).format(new Date(booking.starts_at))
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone, timeZoneName: 'short' }).format(new Date(booking.starts_at))
  const price = booking.price_pence ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(booking.price_pence / 100) : 'Free'

  return (
    <main className="grid min-h-screen place-items-center bg-stone-50 px-4 py-12 sm:px-6">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700"><CalendarDays aria-hidden="true" className="size-5" /></span>
        <p className="mt-5 text-xs font-semibold tracking-widest text-amber-700 uppercase">{pageResult.data.business_name}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">Cancel your booking</h1>
        <dl className="mt-6 space-y-4 rounded-xl bg-stone-50 p-4 text-sm">
          <div><dt className="text-stone-500">Service</dt><dd className="mt-1 font-medium text-stone-950">{serviceResult.data?.name || 'Appointment'}</dd></div>
          <div><dt className="text-stone-500">Date</dt><dd className="mt-1 font-medium text-stone-950">{date}</dd></div>
          <div><dt className="text-stone-500">Time</dt><dd className="mt-1 font-medium text-stone-950">{time}</dd></div>
          <div><dt className="text-stone-500">Price</dt><dd className="mt-1 font-medium text-stone-950">{price}</dd></div>
        </dl>
        <CancelClient token={token} />
      </div>
    </main>
  )
}
