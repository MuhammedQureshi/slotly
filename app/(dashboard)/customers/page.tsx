import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

export default async function CustomersPage() {
  const { userId } = await auth()
  if (!userId) return <p>Please sign in.</p>
  const { data: user } = await supabaseAdmin.from('users').select('id, plan, ever_pro')
    .eq('clerk_user_id', userId).maybeSingle()
  if (!user) return <p>Account not found.</p>
  const { data: pages } = await supabaseAdmin.from('booking_pages').select('id').eq('user_id', user.id)
  const ids = (pages ?? []).map((page) => page.id)
  const people = new Map<string, { name: string; email: string; phone: string; count: number; last: string }>()
  if (ids.length) {
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabaseAdmin.from('bookings')
        .select('customer_name, customer_email, customer_phone, starts_at')
        .in('booking_page_id', ids).order('starts_at', { ascending: false }).range(offset, offset + 499)
      if (error) return <p>Unable to load customers.</p>
      for (const row of data ?? []) {
        const key = row.customer_email.trim().toLowerCase()
        const person = people.get(key) ?? {
          name: row.customer_name, email: row.customer_email, phone: row.customer_phone || '',
          count: 0, last: row.starts_at,
        }
        person.count++
        people.set(key, person)
      }
      if ((data ?? []).length < 500) break
    }
  }
  return <div className="space-y-6">
    <header><h1 className="text-3xl font-semibold">Customers</h1>
      <p className="mt-2 text-sm text-stone-600">People who have booked your shop.</p></header>
    <a href="/api/export?kind=customers" className="inline-block text-sm font-medium text-amber-800 underline">Download customers CSV</a>
    <ul className="divide-y rounded-xl border bg-white">
      {[...people.values()].map((person) => <li key={person.email} className="flex flex-wrap justify-between gap-3 p-4 text-sm">
        <div>{user.plan === 'pro' || user.ever_pro
          ? <Link href={`/customers/${encodeURIComponent(person.email)}`} className="font-medium text-amber-800 underline">{person.name}</Link>
          : <p className="font-medium">{person.name}</p>}
          <p className="text-stone-600">{person.email}</p>
          {person.phone && <p className="text-stone-500">{person.phone}</p>}</div>
        <p className="text-stone-600">{person.count} {person.count === 1 ? 'appointment' : 'appointments'}</p>
      </li>)}
      {!people.size && <li className="p-4 text-sm text-stone-600">No customers yet.</li>}
    </ul>
    {user.plan !== 'pro' && !user.ever_pro && <p className="text-sm text-stone-600">Appointment history and private notes are available on Pro. <Link href="/billing" className="text-amber-800 underline">View plans</Link></p>}
  </div>
}
