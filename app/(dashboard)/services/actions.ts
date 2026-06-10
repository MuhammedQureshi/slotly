/* eslint-disable @typescript-eslint/no-unused-vars */
'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// TODO: getSupabase() helper (same as yesterday)

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}


export async function createService(formData: FormData) {
  // TODO: get clerkUserId, look up user UUID (same pattern as yesterday)
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error : 'You must be logged in.' }
    }

    const supabase = getSupabase();

  // TODO: get bookingPageId from formData — verify it belongs to this user
  //       (never trust the client — always confirm ownership server-side)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (userError || !user) {
    return { error: 'User account not found. Make sure your Clerk webhook has synced.' }
  }

  const bookingPageId = formData.get('booking_page_id') as string;
    const { data: bookingPage, error: bookingPageError } = await supabase
    .from('booking_pages')
    .select('id')
    .eq('id', bookingPageId)
    .eq('user_id', user.id) // ownership check
    .single();
    
    if (bookingPageError || !bookingPage) {
        return { error: 'Booking page not found.'}
    }

  // TODO: get name, duration_minutes, price, description from formData
    const name = formData.get('name') as string;
    const durationMinutes = formData.get('duration_minutes') as string;
    const price = formData.get('price') as string;
    const description = formData.get('description') as string;

  // TODO: convert price to pence
  //       price comes in as a string like '20' or '20.50' or ''
  //       if empty, store null. Otherwise: Math.round(parseFloat(price) * 100)\
    const pricePence = price ? Math.round(parseFloat(price) * 100) : null

  // TODO: insert into services table

  // TODO: revalidatePath('/services') — this refreshes the server component
}

export async function updateService(formData: FormData) {
  // TODO: same auth pattern

  // TODO: get the service id from formData

  // TODO: verify this service belongs to the current user before updating
  //       (join through booking_pages to check user ownership)

  // TODO: update the row

  // TODO: revalidatePath('/services')
}

export async function deleteService(formData: FormData) {
  // TODO: same auth + ownership check pattern

  // TODO: delete the row

  // TODO: revalidatePath('/services')
}