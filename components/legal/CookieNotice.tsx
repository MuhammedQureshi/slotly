'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const NOTICE_KEY = 'slotly-cookie-notice-v1'
const NOTICE_EVENT = 'slotly-cookie-choice'

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(NOTICE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(NOTICE_EVENT, onChange)
  }
}

function needsAcknowledgement() {
  try {
    return localStorage.getItem(NOTICE_KEY) !== 'accepted'
  } catch {
    return true
  }
}

export function CookieNotice() {
  const visible = useSyncExternalStore(subscribe, needsAcknowledgement, () => false)
  const [dismissed, setDismissed] = useState(false)

  if (!visible || dismissed) return null

  function accept() {
    try {
      localStorage.setItem(NOTICE_KEY, 'accepted')
      window.dispatchEvent(new Event(NOTICE_EVENT))
    } catch {
      // The notice can still be dismissed when browser storage is unavailable.
    }
    setDismissed(true)
  }

  return (
    <aside
      aria-label="Cookie notice"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-border bg-background p-5 shadow-[0_16px_50px_rgba(0,0,0,0.14)] sm:bottom-6 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">Cookies on Slotly</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            We use essential cookies for sign-in and security, and save your acknowledgement on this device. We do not currently use advertising or optional analytics cookies. Read our{' '}
            <Link href="/cookies" className="font-medium text-foreground underline underline-offset-2">Cookie Policy</Link> and{' '}
            <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>
        <Button onClick={accept} className="h-10 shrink-0 rounded-full px-5">Accept &amp; continue</Button>
      </div>
    </aside>
  )
}
