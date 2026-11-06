import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getBookingVersion } from '@/lib/booking-version'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user, error } = await supabaseAdmin.from('users').select('id')
    .eq('clerk_user_id', userId).maybeSingle()
  if (error || !user) return NextResponse.json({ error: 'Account unavailable' }, { status: 404 })

  try {
    const version = await getBookingVersion(user.id)
    return NextResponse.json({ version }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Booking version check failed:', error)
    return NextResponse.json({ error: 'Unable to check bookings' }, { status: 500 })
  }
}
