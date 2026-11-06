import { supabaseAdmin } from '@/lib/supabase'

export async function getBookingVersion(userId: string) {
  const { data: pages, error: pageError } = await supabaseAdmin.from('booking_pages')
    .select('id').eq('user_id', userId)
  if (pageError) throw pageError
  if (!pages?.length) return '0::0:'

  const pageIds = pages.map((page) => page.id)
  const [created, cancelled] = await Promise.all([
    supabaseAdmin.from('bookings')
      .select('created_at', { count: 'exact' })
      .in('booking_page_id', pageIds)
      .order('created_at', { ascending: false })
      .limit(1),
    supabaseAdmin.from('bookings')
      .select('cancelled_at', { count: 'exact' })
      .in('booking_page_id', pageIds)
      .not('cancelled_at', 'is', null)
      .order('cancelled_at', { ascending: false })
      .limit(1),
  ])
  if (created.error) throw created.error
  if (cancelled.error) throw cancelled.error
  return `${created.count ?? 0}:${created.data?.[0]?.created_at ?? ''}:${cancelled.count ?? 0}:${cancelled.data?.[0]?.cancelled_at ?? ''}`
}
