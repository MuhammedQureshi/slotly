import type Stripe from 'stripe'

// Stripe Price IDs are public identifiers. This maps the previous test price to
// the current £9 test price until the Vercel variable is updated. A configured
// live-mode price continues to win unchanged.
const LEGACY_TEST_PRO_PRICE_ID = 'price_1UVxOTLPAmCB9yvZJlarLaTK'
const CURRENT_TEST_PRO_PRICE_ID = 'price_1UYVdiLPAmCB9yvZgMnZcrBq'

export function currentProPriceId(configuredPriceId: string | undefined): string {
  if (!configuredPriceId || configuredPriceId === LEGACY_TEST_PRO_PRICE_ID) {
    return CURRENT_TEST_PRO_PRICE_ID
  }
  return configuredPriceId
}

export function recognizedProPriceIds(currentPriceId: string): string[] {
  return [currentPriceId, LEGACY_TEST_PRO_PRICE_ID].filter(Boolean)
}

export function chooseProSubscription(subscriptions: Stripe.Subscription[], priceIds: string | readonly string[]) {
  const acceptedPriceIds = Array.isArray(priceIds) ? priceIds : [priceIds]
  const matching = subscriptions.filter((subscription) =>
    subscription.items.data.some((item) => acceptedPriceIds.includes(item.price.id))
  )
  const active = matching.find((subscription) =>
    ['active', 'trialing', 'past_due'].includes(subscription.status)
  )
  const unpaid = matching.find((subscription) => subscription.status === 'unpaid')
  return { active, unpaid }
}
