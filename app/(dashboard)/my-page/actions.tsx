'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { generateSlug } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { FREE_BOOKING_PAGE_LIMIT, isProPlan } from '@/lib/plans'
import { z } from 'zod'

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
const availabilitySchema = z
  .array(
    z
      .object({
        day_of_week: z.number().int().min(0).max(6),
        is_active: z.boolean(),
        start_time: z.string().regex(timePattern),
        end_time: z.string().regex(timePattern),
      })
      .refine((day) => !day.is_active || day.start_time < day.end_time, {
        message: 'Closing time must be after opening time.',
      })
  )
  .length(7)
  .refine((days) => new Set(days.map((day) => day.day_of_week)).size === 7, {
    message: 'Availability must include each day exactly once.',
  })

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
    .select('id, plan')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (userError || !user) {
    return { error: 'User account not found. Make sure your Clerk webhook has synced.' }
  }

  if (!isProPlan(user.plan)) {
    const { count, error: countError } = await supabase
      .from('booking_pages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      return { error: 'Unable to check your booking page limit. Please try again.' }
    }

    if ((count ?? 0) >= FREE_BOOKING_PAGE_LIMIT) {
      return {
        error: 'Free plans include one booking page. Upgrade to Pro to create another page.',
      }
    }
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
      is_active:     true,
      is_published:  true,
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

export async function saveAvailability(formData: FormData) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    return { error: 'You must be logged in.' }
  }

  const supabase = getSupabase()

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (userError || !user) {
    return { error: 'User account not found.' }
  }

  const rawDays = formData.get('days')
  const bookingPageId = formData.get('booking_page_id')

  if (typeof rawDays !== 'string' || typeof bookingPageId !== 'string') {
    return { error: 'Invalid availability details.' }
  }

  let parsedDays: unknown
  try {
    parsedDays = JSON.parse(rawDays)
  } catch {
    return { error: 'Invalid availability details.' }
  }

  const result = availabilitySchema.safeParse(parsedDays)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid availability details.' }
  }

  const days = result.data

  const { data: bookingPage, error: bookingPageError } = await supabase
    .from('booking_pages')
    .select('id')
    .eq('id', bookingPageId)
    .eq('user_id', user.id) // ownership check
    .single();

  if (bookingPageError || !bookingPage) {
    return { error: 'Booking page not found or you do not have permission to edit it.' }
  }

  const { error: saveError } = await supabase
    .from('availability_rules')
    .upsert(
      days.map((day) => ({
        booking_page_id: bookingPageId,
        day_of_week: day.day_of_week,
        is_active: day.is_active,
        start_time: day.start_time,
        end_time: day.end_time,
      })),
      { onConflict: 'booking_page_id,day_of_week' }
    )

  if (saveError) {
    console.error('Availability save error:', saveError)
    return { error: 'Error saving availability. Please try again.' }
  }

  // Revalidate the path to ensure the new availability is reflected
  revalidatePath(`/my-page`);

}
