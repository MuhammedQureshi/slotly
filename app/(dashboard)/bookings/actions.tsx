'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

export async function cancelBooking(bookingId: string) {
  // TODO: get clerkUserId from auth(), return { error } if missing
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return { error: 'User not authenticated' };
  }

  // TODO: look up the user's UUID from the users table
    const supabase = supabaseAdmin;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

  if (userError || !userData) {
    return { error: 'User not found' };
  }

  const userId = userData.id;

  // TODO: fetch the booking (select id, booking_page_id) by bookingId
  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .select('id, booking_page_id')
    .eq('id', bookingId)
    .single();

  if (bookingError || !bookingData) {
    return { error: 'Booking not found' };
  }

  const bookingPageId = bookingData.booking_page_id;

  // TODO: ownership check: confirm that booking_page_id belongs to this user
  //       (query booking_pages with .eq('id', ...) and .eq('user_id', user.id))
    const { data: bookingPageData, error: bookingPageError } = await supabase
      .from('booking_pages')
      .select('id')
      .eq('id', bookingPageId)
      .eq('user_id', userId)
      .single();

  if (bookingPageError || !bookingPageData) {
    return { error: 'Booking page not found or not owned by user' };
  }

  // TODO: update the booking: status = 'cancelled', cancelled_by = 'owner', cancelled_at = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_by: 'owner',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', bookingId);

  if (updateError) {
    return { error: 'Failed to cancel booking' };
  }

  // TODO: revalidatePath('/bookings')
  revalidatePath('/bookings');
  return { success: true }
}