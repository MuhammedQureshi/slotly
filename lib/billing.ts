import type Stripe from 'stripe'

import { supabaseAdmin } from '@/lib/supabase'

function stripeId(value: string | { id: string } | null) {
  return typeof value === 'string' ? value : value?.id ?? null
}

export async function activateProFromCheckout(
  session: Stripe.Checkout.Session,
  expectedUserId?: string
) {
  if (session.mode !== 'subscription' || session.payment_status !== 'paid') {
    return false
  }

  const userId = session.client_reference_id || session.metadata?.user_id
  const customerId = stripeId(session.customer)
  const subscriptionId = stripeId(session.subscription)

  if (!userId || !customerId || !subscriptionId) {
    throw new Error(`Checkout Session ${session.id} is missing billing identifiers`)
  }

  if (expectedUserId && userId !== expectedUserId) {
    throw new Error(`Checkout Session ${session.id} belongs to another user`)
  }

  const { data: updatedUser, error } = await supabaseAdmin
    .from('users')
    .update({
      plan: 'pro',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    })
    .eq('id', userId)
    .select('id')
    .maybeSingle()

  if (error || !updatedUser) {
    throw new Error(`Unable to upgrade user: ${error?.message ?? 'user not found'}`)
  }

  return true
}
