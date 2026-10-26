'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

export async function cancelBookingByToken(token: string) {
  if (!z.string().uuid().safeParse(token).success) {
    return { error: 'Booking not found.' }
  }

  try {
    // Checking status in the update makes repeat/concurrent cancellation safe.
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_by: 'customer',
        cancelled_at: new Date().toISOString(),
      })
      .eq('cancel_token', token)
      .neq('status', 'cancelled')
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Customer cancellation failed:', error.message)
      return { error: 'Unable to cancel your booking. Please try again.' }
    }

    if (!data) return { error: 'Booking not found or already cancelled.' }

    revalidatePath('/bookings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch {
    return { error: 'Unable to cancel your booking. Please try again.' }
  }
}
