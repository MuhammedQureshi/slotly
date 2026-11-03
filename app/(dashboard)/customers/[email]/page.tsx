import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

export default async function CustomerHistory({ params }: { params: Promise<{ email: string }> }) {
  const { userId } = await auth()
  if (!userId) return <p>Please sign in.</p>
  const email = decodeURIComponent((await params).email)
  const { data: user } = await supabaseAdmin.from('users').select('id, plan, ever_pro').eq('clerk_user_id', userId).maybeSingle()
  if (!user) return <p>Account not found.</p>
  if (user.plan !== 'pro' && !user.ever_pro) return <p>Customer appointment history is available on Pro.</p>
  const { data: pages } = await supabaseAdmin.from('booking_pages').select('id').eq('user_id', user.id)
  const ids = (pages ?? []).map((page) => page.id)
  if (!ids.length) return <p>No appointments.</p>
  const { data, error } = await supabaseAdmin.from('bookings')
    .select('id, customer_name, customer_email, starts_at, status, private_notes, service:service_id(name)')
    .in('booking_page_id', ids).ilike('customer_email', email)
    .order('starts_at', { ascending: false }).limit(500)
  if (error || !data?.length) return <p>Customer not found.</p>
  return <div className="space-y-6">
    <Link href="/customers" className="text-sm text-amber-800 underline">Back to customers</Link>
    <header><h1 className="text-3xl font-semibold">{data[0].customer_name}</h1>
      <p className="text-sm text-stone-600">{data[0].customer_email}</p></header>
    <ul className="space-y-3">{data.map((booking) => {
      const service = Array.isArray(booking.service) ? booking.service[0] : booking.service
      return <li key={booking.id} className="rounded-xl border bg-white p-4">
        <p className="font-medium">{service?.name || 'Appointment'} · {booking.status}</p>
        <p className="text-sm text-stone-600">{new Date(booking.starts_at).toLocaleString('en-GB')}</p>
        {booking.private_notes && <p className="mt-2 whitespace-pre-wrap text-sm">Private notes: {booking.private_notes}</p>}
      </li>
    })}</ul>
  </div>
}
