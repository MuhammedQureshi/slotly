'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CopyBookingLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  return <Button type="button" size="lg" variant="outline" onClick={async () => {
    try {
      await navigator.clipboard.writeText(new URL(`/book/${slug}`, window.location.origin).toString())
      setCopied(true)
    } catch { setCopied(false) }
  }}><Copy aria-hidden="true" className="size-4" />{copied ? 'Link copied' : 'Copy booking link'}</Button>
}
