import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

function cell(value: unknown) {
  const raw = String(value ?? '')
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
  return `"${safe.replaceAll('"', '""')}"`
}

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })
  const kind = new URL(request.url).searchParams.get('kind')
  if (kind !== 'appointments' && kind !== 'customers') return new Response('Invalid export', { status: 400 })
  const { data: user } = await supabaseAdmin.from('users').select('id')
    .eq('clerk_user_id', userId).maybeSingle()
  if (!user) return new Response('Account not found', { status: 404 })
  const { data: pages } = await supabaseAdmin.from('booking_pages').select('id').eq('user_id', user.id)
  const ids = (pages ?? []).map((page) => page.id)
  const rows: string[][] = []
  if (ids.length) {
    // Page through Supabase's default 1,000-row response cap.
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabaseAdmin.from('bookings')
        .select('id, customer_name, customer_email, customer_phone, starts_at, ends_at, status, price_pence, private_notes')
        .in('booking_page_id', ids).order('starts_at', { ascending: false }).range(offset, offset + 499)
      if (error) return new Response('Export unavailable', { status: 500 })
      for (const booking of data ?? []) rows.push([
        booking.id, booking.customer_name, booking.customer_email, booking.customer_phone ?? '',
        booking.starts_at, booking.ends_at, booking.status, String(booking.price_pence ?? ''),
        booking.private_notes ?? '',
      ])
      if ((data ?? []).length < 500) break
    }
  }
  let headers = ['id','name','email','phone','starts_at','ends_at','status','price_pence','private_notes']
  let output = rows
  if (kind === 'customers') {
    const people = new Map<string, { name: string; email: string; phone: string; count: number }>()
    for (const row of rows) {
      const key = row[2].trim().toLowerCase()
      const person = people.get(key) ?? { name: row[1], email: row[2], phone: row[3], count: 0 }
      person.count++
      people.set(key, person)
    }
    headers = ['name','email','phone','appointments']
    output = [...people.values()].map((person) => [person.name, person.email, person.phone, String(person.count)])
  }
  const csv = [headers, ...output].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n'
  return new Response('\ufeff' + csv, { headers: {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="slotly-${kind}.csv"`,
    'Cache-Control': 'private, no-store',
  } })
}
