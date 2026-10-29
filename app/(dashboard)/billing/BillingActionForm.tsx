'use client'

import { LoaderCircle } from 'lucide-react'
import { useActionState } from 'react'

import { Button } from '@/components/ui/button'

import {
  openCustomerPortal,
  startCheckout,
  type BillingActionState,
} from './actions'

type BillingActionFormProps = {
  kind: 'checkout' | 'portal'
}

const initialState: BillingActionState = null

export function BillingActionForm({ kind }: BillingActionFormProps) {
  const action = kind === 'checkout' ? startCheckout : openCustomerPortal
  const [state, formAction, isPending] = useActionState(action, initialState)
  const label = kind === 'checkout' ? 'Upgrade to Pro' : 'Manage subscription'
  const pendingLabel = kind === 'checkout' ? 'Opening Checkout…' : 'Opening portal…'

  return (
    <form action={formAction} className="space-y-3">
      <Button
        type="submit"
        size="lg"
        variant={kind === 'checkout' ? 'default' : 'outline'}
        disabled={isPending}
        className={kind === 'checkout' ? 'w-full bg-amber-600 text-white hover:bg-amber-700' : 'w-full'}
      >
        {isPending && <LoaderCircle aria-hidden="true" className="animate-spin" />}
        {isPending ? pendingLabel : label}
      </Button>
      {state?.error && (
        <p role="alert" aria-live="polite" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  )
}
