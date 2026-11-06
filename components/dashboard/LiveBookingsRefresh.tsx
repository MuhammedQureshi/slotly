'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function LiveBookingsRefresh({ initialVersion }: { initialVersion: string }) {
  const router = useRouter()
  const version = useRef(initialVersion)

  useEffect(() => { version.current = initialVersion }, [initialVersion])

  useEffect(() => {
    let inFlight = false
    let disposed = false
    const controller = new AbortController()

    async function check() {
      if (disposed || inFlight || document.visibilityState !== 'visible') return
      inFlight = true
      try {
        const response = await fetch('/api/bookings/version', { cache: 'no-store', signal: controller.signal })
        if (!response.ok) return
        const result = await response.json() as { version: string }
        if (result.version !== version.current) {
          version.current = result.version
          router.refresh()
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Could not check for new bookings:', error)
        }
      } finally {
        inFlight = false
      }
    }

    const timer = window.setInterval(() => void check(), 10_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      disposed = true
      controller.abort()
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [router])

  return null
}
