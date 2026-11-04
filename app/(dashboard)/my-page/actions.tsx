'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { generateSlug } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { BOOKING_PAGE_LIMIT } from '@/lib/plans'
import { getEntitlements } from '@/lib/plans'
import { isAccessibleBookingAccent } from '@/lib/branding'
import { z } from 'zod'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

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
  const { data: page } = await supabase.from('booking_pages').select('id, logo_path')
    .eq('user_id', owner.id).limit(1).maybeSingle()
  if (!page) return { error: 'Create your booking page first.' }
  const color = String(formData.get('accent_color') ?? '')
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: 'Choose a valid colour.' }
  if (!isAccessibleBookingAccent(color)) {
    return { error: 'Choose a darker colour so white text remains readable.' }
  }
  const file = formData.get('logo')
  const removeLogo = formData.get('remove_logo') === 'true'
  let logoPath: string | undefined
  if (!removeLogo && file instanceof File && file.size > 0) {
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
    ...(removeLogo ? { logo_path: null, logo_url: null } : {}),
    ...(logoPath ? { logo_path: logoPath, logo_url: null } : {}),
  }).eq('id', page.id).eq('user_id', owner.id)
  if (error) {
    if (logoPath) await supabase.storage.from('booking-logos').remove([logoPath])
    return { error: 'Could not save branding.' }
  }
  if ((removeLogo || logoPath) && page.logo_path?.startsWith(`${owner.id}/`)) {
    await supabase.storage.from('booking-logos').remove([page.logo_path])
  }
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
    .select('id, timezone')
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

  const { data: upcoming } = await supabase.from('bookings')
    .select('starts_at, ends_at').eq('booking_page_id', bookingPageId)
    .eq('status', 'confirmed').gte('starts_at', new Date().toISOString())
    .order('starts_at').limit(500)
  const timezone = bookingPage.timezone || 'Europe/London'
  const conflicts = (upcoming ?? []).filter((booking) => {
    const start = new Date(booking.starts_at)
    const end = new Date(booking.ends_at)
    const day = new Date(`${formatInTimeZone(start, timezone, 'yyyy-MM-dd')}T12:00:00Z`).getUTCDay()
    const rule = days.find((item) => item.day_of_week === day)
    if (!rule || !rule.is_active) return true
    const localStart = formatInTimeZone(start, timezone, 'HH:mm')
    const localEnd = formatInTimeZone(end, timezone, 'HH:mm')
    return localStart < rule.start_time || localEnd > rule.end_time ||
      Boolean(rule.break_start && rule.break_end && localStart < rule.break_end && localEnd > rule.break_start)
  }).length
  return { success: true, conflicts }

}

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

async function getOwnedAvailabilityPage(pageId: string) {
  const { userId } = await auth()
  if (!userId || !z.string().uuid().safeParse(pageId).success) return null
  const supabase = getSupabase()
  const { data: user } = await supabase.from('users').select('id')
    .eq('clerk_user_id', userId).maybeSingle()
  if (!user) return null
  const { data: page } = await supabase.from('booking_pages')
    .select('id, slug, timezone').eq('id', pageId).eq('user_id', user.id).maybeSingle()
  return page
}

function revalidateAvailability(slug: string) {
  revalidatePath('/my-page')
  revalidatePath(`/book/${slug}`)
}

export async function saveChangeCutoff(pageId: string, hours: number) {
  const page = await getOwnedAvailabilityPage(pageId)
  if (!page) return { error: 'Booking page not found.' }
  if (!Number.isInteger(hours) || hours < 0 || hours > 168) {
    return { error: 'Choose a cutoff from 0 to 168 hours.' }
  }
  const { error } = await getSupabase().from('booking_pages')
    .update({ change_cutoff_hours: hours }).eq('id', page.id)
  if (error) return { error: 'Could not save the change cutoff.' }
  revalidateAvailability(page.slug)
  return { success: true }
}

export async function saveShopDetails(pageId: string, formData: FormData) {
  const page = await getOwnedAvailabilityPage(pageId)
  if (!page) return { error: 'Booking page not found.' }
  const details = z.object({
    business_name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(200),
    phone: z.string().trim().max(30),
    email: z.union([z.literal(''), z.string().trim().email().max(254)]),
  }).safeParse(Object.fromEntries(formData))
  if (!details.success) return { error: 'Check your shop name and contact details.' }
  const { error } = await getSupabase().from('booking_pages').update({
    business_name: details.data.business_name,
    description: details.data.description || null,
    phone: details.data.phone || null,
    email: details.data.email || null,
  }).eq('id', page.id)
  if (error) return { error: 'Could not save your shop details.' }
  revalidateAvailability(page.slug)
  return { success: true }
}

export async function saveBlockedDateRange(pageId: string, startDate: string, endDate: string, reason: string) {
  const page = await getOwnedAvailabilityPage(pageId)
  if (!page) return { error: 'Booking page not found.' }
  if (!isCalendarDate(startDate) || !isCalendarDate(endDate) || startDate > endDate || reason.length > 200) {
    return { error: 'Choose a valid date range and a reason under 200 characters.' }
  }
  const start = new Date(`${startDate}T12:00:00Z`)
  const end = new Date(`${endDate}T12:00:00Z`)
  const dayCount = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  if (dayCount > 90) return { error: 'Block up to 90 days at a time.' }
  const rows = Array.from({ length: dayCount }, (_, offset) => {
    const date = new Date(start)
    date.setUTCDate(date.getUTCDate() + offset)
    return { booking_page_id: page.id, blocked_date: date.toISOString().slice(0, 10), reason: reason.trim() || null }
  })
  const { error } = await getSupabase().from('blocked_dates')
    .upsert(rows, { onConflict: 'booking_page_id,blocked_date' })
  if (error) return { error: 'Could not block these dates.' }
  const timezone = page.timezone || 'Europe/London'
  const afterEnd = new Date(end)
  afterEnd.setUTCDate(afterEnd.getUTCDate() + 1)
  const { count } = await getSupabase().from('bookings')
    .select('id', { count: 'exact', head: true }).eq('booking_page_id', page.id)
    .eq('status', 'confirmed')
    .gte('starts_at', fromZonedTime(`${startDate}T00:00:00`, timezone).toISOString())
    .lt('starts_at', fromZonedTime(`${afterEnd.toISOString().slice(0, 10)}T00:00:00`, timezone).toISOString())
  revalidateAvailability(page.slug)
  return { success: true, conflicts: count ?? 0 }
}

export async function removeBlockedDate(pageId: string, date: string) {
  const page = await getOwnedAvailabilityPage(pageId)
  if (!page || !isCalendarDate(date)) return { error: 'Blocked date not found.' }
  const { error } = await getSupabase().from('blocked_dates').delete()
    .eq('booking_page_id', page.id).eq('blocked_date', date)
  if (error) return { error: 'Could not remove this blocked date.' }
  revalidateAvailability(page.slug)
  return { success: true }
}

const overrideSchema = z.object({
  date: z.string().refine(isCalendarDate),
  is_active: z.boolean(),
  start_time: z.string().regex(timePattern),
  end_time: z.string().regex(timePattern),
  break_start: z.string().regex(timePattern).nullable(),
  break_end: z.string().regex(timePattern).nullable(),
}).refine((value) => !value.is_active || value.start_time < value.end_time, {
  message: 'Closing time must be after opening time.',
}).refine((value) => (!value.break_start && !value.break_end) ||
  (!!value.break_start && !!value.break_end && value.break_start < value.break_end &&
    value.break_start >= value.start_time && value.break_end <= value.end_time), {
  message: 'Break must fall within opening hours.',
})

export async function saveAvailabilityOverride(pageId: string, input: z.infer<typeof overrideSchema>) {
  const page = await getOwnedAvailabilityPage(pageId)
  if (!page) return { error: 'Booking page not found.' }
  const parsed = overrideSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid hours.' }
  const { error } = await getSupabase().from('availability_overrides')
    .upsert({ booking_page_id: page.id, ...parsed.data }, { onConflict: 'booking_page_id,date' })
  if (error) return { error: 'Could not save these hours.' }
  const timezone = page.timezone || 'Europe/London'
  const next = new Date(`${parsed.data.date}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  const { data: bookings } = await getSupabase().from('bookings')
    .select('starts_at, ends_at').eq('booking_page_id', page.id).eq('status', 'confirmed')
    .gte('starts_at', fromZonedTime(`${parsed.data.date}T00:00:00`, timezone).toISOString())
    .lt('starts_at', fromZonedTime(`${next.toISOString().slice(0, 10)}T00:00:00`, timezone).toISOString())
  const conflicts = (bookings ?? []).filter((booking) => {
    if (!parsed.data.is_active) return true
    const localStart = formatInTimeZone(new Date(booking.starts_at), timezone, 'HH:mm')
    const localEnd = formatInTimeZone(new Date(booking.ends_at), timezone, 'HH:mm')
    return localStart < parsed.data.start_time || localEnd > parsed.data.end_time ||
      Boolean(parsed.data.break_start && parsed.data.break_end &&
        localStart < parsed.data.break_end && localEnd > parsed.data.break_start)
  }).length
  revalidateAvailability(page.slug)
  return { success: true, conflicts }
}

export async function removeAvailabilityOverride(pageId: string, date: string) {
  const page = await getOwnedAvailabilityPage(pageId)
  if (!page || !isCalendarDate(date)) return { error: 'Date not found.' }
  const { error } = await getSupabase().from('availability_overrides').delete()
    .eq('booking_page_id', page.id).eq('date', date)
  if (error) return { error: 'Could not remove these hours.' }
  revalidateAvailability(page.slug)
  return { success: true }
}
