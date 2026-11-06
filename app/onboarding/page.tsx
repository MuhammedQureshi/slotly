import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import OnboardingWizard from './wizard'

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const { data: user } = await supabaseAdmin.from('users').select('id, onboarding_complete')
    .eq('clerk_user_id', userId).maybeSingle()
  if (user?.onboarding_complete) redirect('/dashboard')
  const { data: page } = user ? await supabaseAdmin.from('booking_pages')
    .select('id, slug, business_type').eq('user_id', user.id).limit(1).maybeSingle() : { data: null }
  const { data: services } = page ? await supabaseAdmin.from('services').select('id, name')
    .eq('booking_page_id', page.id).order('sort_order') : { data: null }
  const requestHeaders = await headers()
  const host = requestHeaders.get('host') ?? 'slotly-kohl.vercel.app'
  const origin = `${host.startsWith('localhost') ? 'http' : 'https'}://${host}`
  return <OnboardingWizard initialPage={page} initialServices={services ?? []} origin={origin} />
}
