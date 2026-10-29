'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

import { supabaseAdmin } from '@/lib/supabase'
import { getAppUrl, getStripe } from '@/lib/stripe'

export type BillingActionState = { error: string } | null

type BillingUser = {
  id: string
  clerk_user_id: string
  email: string
  full_name: string | null
  plan: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

async function getBillingUser(clerkUserId: string): Promise<BillingUser> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select(
      'id, clerk_user_id, email, full_name, plan, stripe_customer_id, stripe_subscription_id'
    )
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (error || !user) {
    throw new Error('Unable to load your billing account')
  }

  return user
}

async function createPortalUrl(customerId: string) {
  const configuration = process.env.STRIPE_PORTAL_CONFIGURATION_ID
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    ...(configuration ? { configuration } : {}),
    return_url: `${getAppUrl()}/billing`,
  })

  return session.url
}

export async function startCheckout(
  _previousState: BillingActionState,
  _formData: FormData
): Promise<BillingActionState> {
  void _previousState
  void _formData

  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    redirect('/sign-in')
  }

  let checkoutUrl: string | undefined

  try {
    const stripe = getStripe()
    const appUrl = getAppUrl()
    const priceId = process.env.STRIPE_PRO_PRICE_ID

    if (!priceId) {
      throw new Error('STRIPE_PRO_PRICE_ID is not configured')
    }

    const user = await getBillingUser(clerkUserId)

    if (user.stripe_customer_id && !user.stripe_subscription_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        status: 'all',
        limit: 100,
      })
      const existingSubscription = subscriptions.data.find((subscription) =>
        ['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status)
      )

      if (existingSubscription) {
        const { error: adoptionError } = await supabaseAdmin
          .from('users')
          .update({
            plan: 'pro',
            stripe_subscription_id: existingSubscription.id,
          })
          .eq('id', user.id)

        if (adoptionError) {
          throw new Error('Unable to restore the existing subscription')
        }

        checkoutUrl = await createPortalUrl(user.stripe_customer_id)
      }
    }

    if (!checkoutUrl && user.stripe_customer_id && user.stripe_subscription_id) {
      checkoutUrl = await createPortalUrl(user.stripe_customer_id)
    }

    if (!checkoutUrl) {
      let customerId = user.stripe_customer_id

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.full_name || undefined,
          metadata: {
            clerk_user_id: user.clerk_user_id,
            user_id: user.id,
          },
        })

        customerId = customer.id

        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)

        if (updateError) {
          throw new Error('Unable to save the Stripe customer')
        }
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        client_reference_id: user.id,
        line_items: [{ price: priceId, quantity: 1 }],
        payment_method_types: ['card'],
        success_url: `${appUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/billing?checkout=cancelled`,
        metadata: { user_id: user.id },
        subscription_data: {
          metadata: { user_id: user.id },
        },
      })

      if (!session.url) {
        throw new Error('Stripe did not return a Checkout URL')
      }

      checkoutUrl = session.url
    }
  } catch (error) {
    console.error('Unable to start Stripe Checkout:', error)
    return { error: 'We could not open Stripe Checkout. Please try again.' }
  }

  if (!checkoutUrl) {
    return { error: 'We could not open Stripe Checkout. Please try again.' }
  }

  redirect(checkoutUrl)
}

export async function openCustomerPortal(
  _previousState: BillingActionState,
  _formData: FormData
): Promise<BillingActionState> {
  void _previousState
  void _formData

  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    redirect('/sign-in')
  }

  let portalUrl: string

  try {
    const user = await getBillingUser(clerkUserId)

    if (!user.stripe_customer_id) {
      return { error: 'No Stripe billing account exists yet.' }
    }

    portalUrl = await createPortalUrl(user.stripe_customer_id)
  } catch (error) {
    console.error('Unable to open the Stripe customer portal:', error)
    return { error: 'We could not open the billing portal. Please try again.' }
  }

  redirect(portalUrl)
}
