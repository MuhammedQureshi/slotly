import { auth } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() ?? ''
  if (query.length < 2) return Response.json({ results: [] })

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()
  if (!user) return Response.json({ results: [] })

  const { data: pages, error: pagesError } = await supabaseAdmin
    .from('booking_pages')
    .select('id')
    .eq('user_id', user.id)
  if (pagesError) return Response.json({ error: 'Search unavailable' }, { status: 500 })

  const pageIds = (pages ?? []).map((page) => page.id)
  if (pageIds.length === 0) return Response.json({ results: [] })

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('id, customer_name, customer_email, starts_at, status, service:service_id(name)')
    .in('booking_page_id', pageIds)
    .order('starts_at', { ascending: false })
    .limit(200)

  if (error) return Response.json({ error: 'Search unavailable' }, { status: 500 })

  const results = (data ?? []).flatMap((booking) => {
    const service = Array.isArray(booking.service) ? booking.service[0] : booking.service
    const haystack = [booking.customer_name, booking.customer_email, service?.name]
      .filter(Boolean).join(' ').toLowerCase()
    if (!haystack.includes(query)) return []
    return [{ ...booking, service: service ?? null }]
  }).slice(0, 8)

  return Response.json(
    { results },
    { headers: { 'Cache-Control': 'private, no-store' } }
  )
}
