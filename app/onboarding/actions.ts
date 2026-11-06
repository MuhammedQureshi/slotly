'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { createClerkClient } from '@clerk/backend'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'

const businessTypes = new Set(['barber', 'tutor', 'cleaner', 'trainer', 'nail', 'other'])
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

async function owner() {
  const { userId } = await auth()
  if (!userId) return null
  const existing = await supabaseAdmin.from('users').select('id, onboarding_complete').eq('clerk_user_id', userId).maybeSingle()
  if (existing.error) {
    console.error('Onboarding account lookup failed:', existing.error)
    return null
  }
  let data = existing.data
  if (!data) {
    const clerkUser = await currentUser()
    if (!clerkUser) return null
    const primaryEmail = clerkUser?.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)
    const email = primaryEmail?.emailAddress
    if (!email || primaryEmail.verification?.status !== 'verified') return null
    const account = {
      clerk_user_id: userId, email,
      full_name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' '),
    }
    let result = await supabaseAdmin.from('users').upsert(account, { onConflict: 'clerk_user_id' })
      .select('id, onboarding_complete').single()
    if (result.error?.code === '23505') {
      const { data: stale } = await supabaseAdmin.from('users').select('id, clerk_user_id')
        .eq('email', email).maybeSingle()
      if (stale && stale.clerk_user_id !== userId) {
        try {
          const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })
          const previous = await clerk.users.getUser(stale.clerk_user_id)
          const verified = previous.emailAddresses.find((item) => item.id === previous.primaryEmailAddressId)
          if (verified?.verification?.status === 'verified' && verified.emailAddress.toLowerCase() !== email.toLowerCase()) {
            const moved = await supabaseAdmin.from('users').update({ email: verified.emailAddress })
              .eq('id', stale.id).eq('email', email).select('id').maybeSingle()
            if (!moved.error && moved.data) {
              result = await supabaseAdmin.from('users').upsert(account, { onConflict: 'clerk_user_id' })
                .select('id, onboarding_complete').single()
            }
          }
        } catch (error) {
          console.error('Could not verify prior Clerk account during onboarding:', error)
        }
      }
    }
    if (result.error) console.error('Onboarding account sync failed:', result.error)
    data = result.data
  }
  return data
}

async function ownedPage() {
  const user = await owner()
  if (!user) return null
  const { data: page } = await supabaseAdmin.from('booking_pages').select('id, slug, business_type')
    .eq('user_id', user.id).limit(1).maybeSingle()
  return { user, page }
}

export async function createOnboardingPage(input: { name: string; type: string; phone: string }) {
  const account = await ownedPage()
  if (!account) return { error: 'Your account is still syncing. Please try again.' }
  if (account.page) return { slug: account.page.slug, pageId: account.page.id }
  const name = input.name.trim()
  if (!name || name.length > 100 || !businessTypes.has(input.type) || input.phone.length > 40) {
    return { error: 'Enter a business name, type, and valid phone number.' }
  }
  const base = generateSlug(name) || 'booking-page'
  for (let index = 0; index < 20; index++) {
    const slug = index ? `${base}-${index + 1}` : base
    const { data, error } = await supabaseAdmin.from('booking_pages').insert({
      user_id: account.user.id, slug, business_name: name, business_type: input.type,
      phone: input.phone.trim() || null, timezone: 'Europe/London', is_active: true, is_published: true,
    }).select('id, slug').single()
    if (data) {
      const { error: seedError } = await supabaseAdmin.rpc('seed_default_availability', { p_booking_page_id: data.id })
      if (seedError) console.error('Onboarding availability seed failed:', seedError)
      return { slug: data.slug, pageId: data.id }
    }
    if (error?.code !== '23505') return { error: 'Could not create your booking page. Please try again.' }
  }
  return { error: 'Please choose a different business name.' }
}

export async function addOnboardingService(input: { name: string; duration: number; price: string }) {
  const account = await ownedPage()
  if (!account?.page) return { error: 'Create your booking page first.' }
  const name = input.name.trim()
  const price = Number(input.price)
  if (!name || name.length > 100 || !Number.isInteger(input.duration) || input.duration < 5 || input.duration > 480 ||
    !Number.isFinite(price) || price < 0 || price > 10000 || !/^\d+(\.\d{1,2})?$/.test(input.price)) {
    return { error: 'Enter a service name, duration, and valid price.' }
  }
  const { data, error } = await supabaseAdmin.from('services').insert({
    booking_page_id: account.page.id, name, duration_minutes: input.duration,
    price_pence: Math.round(price * 100),
  }).select('id, name').single()
  if (error) return { error: 'Could not save that service.' }
  return { service: data }
}

export async function saveOnboardingHours(days: Array<{ day_of_week: number; is_active: boolean; start_time: string; end_time: string }>) {
  const account = await ownedPage()
  if (!account?.page) return { error: 'Create your booking page first.' }
  if (days.length !== 7 || new Set(days.map((day) => day.day_of_week)).size !== 7 ||
    days.some((day) => day.day_of_week < 0 || day.day_of_week > 6 || !timePattern.test(day.start_time) ||
      !timePattern.test(day.end_time) || (day.is_active && day.start_time >= day.end_time)) ||
    !days.some((day) => day.is_active)) return { error: 'Set valid hours for at least one day.' }
  const { error } = await supabaseAdmin.from('availability_rules').upsert(days.map((day) => ({
    booking_page_id: account.page!.id, ...day, break_start: null, break_end: null,
  })), { onConflict: 'booking_page_id,day_of_week' })
  if (error) return { error: 'Could not save your hours.' }
  return { success: true }
}

export async function completeOnboarding() {
  const account = await ownedPage()
  if (!account?.page) return { error: 'Create your booking page first.' }
  const [{ count: services, error: serviceError }, { count: hours, error: hoursError }] = await Promise.all([
    supabaseAdmin.from('services').select('id', { count: 'exact', head: true }).eq('booking_page_id', account.page.id),
    supabaseAdmin.from('availability_rules').select('day_of_week', { count: 'exact', head: true })
      .eq('booking_page_id', account.page.id).eq('is_active', true),
  ])
  if (serviceError || hoursError || !services || !hours) return { error: 'Add a service and set your hours first.' }
  const { error } = await supabaseAdmin.from('users').update({ onboarding_complete: true }).eq('id', account.user.id)
  if (error) return { error: 'Could not finish setup. Please try again.' }
  revalidatePath('/dashboard')
  return { success: true }
}
