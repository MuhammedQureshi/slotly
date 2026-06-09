'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { generateSlug } from '@/lib/utils'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function saveBookingPage(formData: FormData) {
  // 1. Get Clerk user ID
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    return { error: 'You must be logged in.' }
  }

  const supabase = getSupabase()

  // 2. Look up the UUID from your users table using the Clerk ID.
  //    Your users table stores clerk_user_id (text) and id (UUID).
  //    booking_pages.user_id is a UUID foreign key to users.id.
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (userError || !user) {
    return { error: 'User account not found. Make sure your Clerk webhook has synced.' }
  }

  const businessName = formData.get('business_name') as string
  const businessType = formData.get('business_type') as string
  const phone        = formData.get('phone') as string
  const description  = formData.get('description') as string
  const timezone     = formData.get('timezone') as string

  // 3. Generate a unique slug
  let slug = generateSlug(businessName)
  let slugIsUnique = false
  let attempt = 0

  while (!slugIsUnique) {
    const candidateSlug = attempt === 0 ? slug : `${slug}-${attempt + 1}`
    const { data: existing } = await supabase
      .from('booking_pages')
      .select('id')
      .eq('slug', candidateSlug)
      .maybeSingle()

    if (!existing) {
      slug = candidateSlug
      slugIsUnique = true
    }
    attempt++
    if (attempt > 20) return { error: 'Could not generate a unique slug. Try a different name.' }
  }

  // 4. Insert the booking page
  const { data: bookingPage, error: insertError } = await supabase
    .from('booking_pages')
    .insert({
      user_id:       user.id,           // UUID from users table
      slug,
      business_name: businessName,
      business_type: businessType,      // must match CHECK constraint values below
      phone:         phone || null,
      description:   description || null,
      timezone:      timezone || 'Europe/London',
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Insert error:', insertError)
    return { error: 'Failed to save. Please try again.' }
  }

  // 5. Seed availability using your SQL function (already defined in Supabase)
  //    seed_default_availability() inserts Mon–Fri active, Sat–Sun inactive
  const { error: seedError } = await supabase.rpc('seed_default_availability', {
    p_booking_page_id: bookingPage.id,
  })

  if (seedError) {
    // Non-fatal — log but don't block the user
    console.error('Availability seed error:', seedError)
  }

  redirect('/services')
}