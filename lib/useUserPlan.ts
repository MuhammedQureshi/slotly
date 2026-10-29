'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

type UserPlan = 'free' | 'pro'

export function useUserPlan() {
  const { user, isLoaded } = useUser()
  const [plan, setPlan] = useState<UserPlan>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadPlan() {
      if (!isLoaded) return

      if (!user?.id) {
        if (active) {
          setPlan('free')
          setLoading(false)
        }
        return
      }

      setLoading(true)

      const response = await fetch('/api/user/plan', { cache: 'no-store' })
      const data = (await response.json().catch(() => null)) as
        | { plan?: UserPlan }
        | null

      if (!active) return

      if (!response.ok) {
        console.error('Unable to load user plan')
      }

      setPlan(data?.plan === 'pro' ? 'pro' : 'free')
      setLoading(false)
    }

    void loadPlan()

    return () => {
      active = false
    }
  }, [isLoaded, user?.id])

  return {
    plan,
    isPro: plan === 'pro',
    loading,
  }
}
