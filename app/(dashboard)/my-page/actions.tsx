'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { generateSlug } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { BOOKING_PAGE_LIMIT } from '@/lib/plans'
import { getEntitlements } from '@/lib/plans'
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
        break_start: z.string().regex(timePattern).nullable().optional(),
        break_end: z.string().regex(timePattern).nullable().optional(),
      })
      .refine((day) => !day.is_active || day.start_time < day.end_time, {
        message: 'Closing time must be after opening time.',
      })
      .refine((day) => (!day.break_start && !day.break_end) ||
        (!!day.break_start && !!day.break_end && day.break_start < day.break_end &&
          day.break_start >= day.start_time && day.break_end <= day.end_time), {
        message: 'Break must fall within working hours.',
      })
  )
  .length(7)
  .refine((days) => new Set(days.map((day) => day.day_of_week)).size === 7, {
    message: 'Availability must include each day exactly once.',
  })

export async function saveBranding(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: 'Please sign in.' }
  const supabase = getSupabase()
  const { data: owner } = await supabase.from('users').select('id, plan')
    .eq('clerk_user_id', userId).maybeSingle()
  if (!owner || !getEntitlements(owner.plan).customBranding) {
    return { error: 'Custom branding is available on Pro.' }
  }
  const { data: page } = await supabase.from('booking_pages').select('id')
    .eq('user_id', owner.id).limit(1).maybeSingle()
  if (!page) return { error: 'Create your booking page first.' }
  const color = String(formData.get('accent_color') ?? '')
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: 'Choose a valid colour.' }
  const channels = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255)
  const luminance = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  if (luminance[0] * 0.2126 + luminance[1] * 0.7152 + luminance[2] * 0.0722 > 0.16) {
    return { error: 'Choose a darker colour so white text remains readable.' }
  }
  const file = formData.get('logo')
  let logoPath: string | undefined
  if (file instanceof File && file.size > 0) {
    if (file.size > 2_097_152 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      return { error: 'Use a PNG, JPEG or WebP logo under 2 MB.' }
    }
    const bytes = new Uint8Array(await file.arrayBuffer())
    const png = file.type === 'image/png' && bytes.slice(0, 4).join(',') === '137,80,78,71'
    const jpeg = file.type === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8
    const webp = file.type === 'image/webp' && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    if (!png && !jpeg && !webp) return { error: 'The logo file is invalid.' }
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : 'webp'
    logoPath = `${owner.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('booking-logos')
      .upload(logoPath, bytes, { contentType: file.type, upsert: false })
    if (uploadError) return { error: 'Could not upload the logo.' }
  }
  const { error } = await supabase.from('booking_pages').update({
    accent_color: color,
    ...(logoPath ? { logo_path: logoPath } : {}),
  }).eq('id', page.id).eq('user_id', owner.id)
  if (error) return { error: 'Could not save branding.' }
  revalidatePath('/my-page')
  return { success: true }
}

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

  {
    const { count, error: countError } = await supabase
      .from('booking_pages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      return { error: 'Unable to check your booking page limit. Please try again.' }
    }

    if ((count ?? 0) >= BOOKING_PAGE_LIMIT) {
      return {
        error: 'Each Slotly account includes one booking page.',
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
        break_start: day.break_start || null,
        break_end: day.break_end || null,
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
