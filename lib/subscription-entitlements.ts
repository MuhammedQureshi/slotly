import type Stripe from 'stripe'

export function chooseProSubscription(subscriptions: Stripe.Subscription[], priceId: string) {
  const matching = subscriptions.filter((subscription) =>
    subscription.items.data.some((item) => item.price.id === priceId)
  )
  const active = matching.find((subscription) =>
    ['active', 'trialing', 'past_due'].includes(subscription.status)
  )
  const unpaid = matching.find((subscription) => subscription.status === 'unpaid')
  return { active, unpaid }
}
