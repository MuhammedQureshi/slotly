import { supabaseAdmin } from '@/lib/supabase'

export async function getBookingVersion(userId: string) {
  const { data: pages, error: pageError } = await supabaseAdmin.from('booking_pages')
    .select('id').eq('user_id', userId)
  if (pageError) throw pageError
  if (!pages?.length) return '0:'

  const { data, count, error } = await supabaseAdmin.from('bookings')
    .select('created_at', { count: 'exact' })
    .in('booking_page_id', pages.map((page) => page.id))
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) throw error
  return `${count ?? 0}:${data?.[0]?.created_at ?? ''}`
}
