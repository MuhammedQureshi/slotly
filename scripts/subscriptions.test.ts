import assert from 'node:assert/strict'
import test from 'node:test'
import type Stripe from 'stripe'
import { chooseProSubscription } from '../lib/subscription-entitlements'

function sub(id: string, status: Stripe.Subscription.Status, price: string): Stripe.Subscription {
  return { id, status, items: { data: [{ price: { id: price } }] } } as Stripe.Subscription
}

test('active paid subscription wins over old deletion and unrelated products', () => {
  const selected = chooseProSubscription([
    sub('old', 'canceled', 'price_pro'),
    sub('other', 'active', 'price_other'),
    sub('current', 'active', 'price_pro'),
  ], 'price_pro')
  assert.equal(selected.active?.id, 'current')
})

test('payment retries retain access, unpaid renewal does not', () => {
  assert.equal(chooseProSubscription([sub('retry', 'past_due', 'price_pro')], 'price_pro').active?.id, 'retry')
  const unpaid = chooseProSubscription([sub('unpaid', 'unpaid', 'price_pro')], 'price_pro')
  assert.equal(unpaid.active, undefined)
  assert.equal(unpaid.unpaid?.id, 'unpaid')
})
