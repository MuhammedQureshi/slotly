'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveBranding } from './actions'

export default function BrandingForm({ color }: { color: string }) {
  const [message, setMessage] = useState('')
  const router = useRouter()
  return <form onSubmit={async (event) => {
    event.preventDefault()
    setMessage('Saving…')
    try {
      const result = await saveBranding(new FormData(event.currentTarget))
      setMessage(result.error ?? 'Branding saved.')
      if (result.success) router.refresh()
    } catch { setMessage('Unable to save branding.') }
  }} className="rounded-2xl border border-stone-200 bg-white p-5">
    <h2 className="font-semibold">Pro booking page branding</h2>
    <p className="mt-1 text-sm text-stone-600">Choose a dark colour and upload a shop logo.</p>
    <div className="mt-4 flex flex-wrap items-center gap-4">
      <label className="text-sm">Accent colour <input type="color" name="accent_color" defaultValue={color} className="ml-2" /></label>
      <label className="text-sm">Shop logo <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" className="ml-2 text-xs" /></label>
      <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white">Save branding</button>
    </div>
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </form>
}
