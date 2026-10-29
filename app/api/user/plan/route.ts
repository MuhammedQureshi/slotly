import { auth } from '@clerk/nextjs/server'

import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('plan')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  if (error) {
    console.error('Unable to load user plan:', error)
    return Response.json({ error: 'Unable to load plan' }, { status: 500 })
  }

  return Response.json(
    { plan: user?.plan === 'pro' ? 'pro' : 'free' },
    { headers: { 'Cache-Control': 'private, no-store' } }
  )
}
