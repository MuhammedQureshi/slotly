import type Stripe from 'stripe'

import { activateProFromCheckout } from '@/lib/billing'
import { supabaseAdmin } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

function objectId(value: string | { id: string } | null) {
  return typeof value === 'string' ? value : value?.id ?? null
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = objectId(subscription.customer)

  if (!customerId) {
    throw new Error(`Subscription ${subscription.id} is missing its customer`)
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      plan: 'free',
      stripe_subscription_id: null,
    })
    .eq('stripe_customer_id', customerId)
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    throw new Error(`Unable to downgrade user: ${error.message}`)
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return new Response('Missing Stripe webhook configuration', { status: 400 })
  }

  const payload = await request.text()
  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error)
    return new Response('Invalid signature', { status: 400 })
  }

  const { error: insertError } = await supabaseAdmin.from('stripe_events').insert({
    id: event.id,
    type: event.type,
    payload: event,
  })

  if (insertError?.code === '23505') {
    return Response.json({ received: true, duplicate: true })
  }

  if (insertError) {
    console.error('Unable to record Stripe event:', insertError)
    return new Response('Unable to record event', { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await activateProFromCheckout(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
    }

    const { error: processedError } = await supabaseAdmin
      .from('stripe_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', event.id)

    if (processedError) {
      throw new Error(`Unable to mark event as processed: ${processedError.message}`)
    }
  } catch (error) {
    console.error(`Unable to process Stripe event ${event.id}:`, error)

    // Let Stripe retry the event. Removing the claim makes the retry processable.
    const { error: deleteError } = await supabaseAdmin
      .from('stripe_events')
      .delete()
      .eq('id', event.id)

    if (deleteError) {
      console.error(`Unable to release failed Stripe event ${event.id}:`, deleteError)
    }

    return new Response('Webhook processing failed', { status: 500 })
  }

  return Response.json({ received: true })
}
