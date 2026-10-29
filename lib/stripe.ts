import Stripe from 'stripe'

let stripeClient: Stripe | undefined

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  stripeClient ??= new Stripe(secretKey)
  return stripeClient
}

export function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured')
  }

  return appUrl.replace(/\/$/, '')
}
