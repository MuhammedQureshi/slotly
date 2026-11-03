'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ImagePlus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PagePreview, { type PagePreviewProps } from '@/components/dashboard/PagePreview'
import { bookingAccent, isAccessibleBookingAccent } from '@/lib/branding'
import { saveBranding } from './actions'

const colors = [
  { name: 'Charcoal', value: '#0c0a09' },
  { name: 'Navy', value: '#1e3a5f' },
  { name: 'Forest', value: '#14532d' },
  { name: 'Plum', value: '#581c87' },
  { name: 'Copper', value: '#7c2d12' },
]

export default function BrandingForm({ initialColor, initialLogoUrl, preview }: {
  initialColor: string
  initialLogoUrl: string | null
  preview: PagePreviewProps
}) {
  const [color, setColor] = useState(initialColor)
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (filePreview) return () => URL.revokeObjectURL(filePreview)
  }, [filePreview])

  const logoUrl = filePreview ?? (!removeLogo ? initialLogoUrl : null)
  const colorIsValid = isAccessibleBookingAccent(color)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!colorIsValid) return
    setSaving(true)
    setMessage('')
    try {
      const result = await saveBranding(new FormData(event.currentTarget))
      if (result.error) {
        setMessage(result.error)
      } else {
        setMessage('Branding saved. Your live booking page is updated.')
        setFile(null)
        setFilePreview(null)
        setRemoveLogo(false)
        if (fileRef.current) fileRef.current.value = ''
        router.refresh()
      }
    } catch {
      setMessage('Could not save branding. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Custom branding</CardTitle>
            <Badge variant="secondary">Pro</Badge>
          </div>
          <CardDescription>Make your booking page look like your barbershop.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <div>
                <Label htmlFor="brand-logo">Barbershop logo</Label>
                <p className="mt-1 text-xs text-muted-foreground">PNG, JPEG or WebP, up to 2 MB. A square image works best.</p>
              </div>
              <div className="flex items-center gap-4 rounded-lg border border-dashed p-3">
                <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                  {logoUrl
                    ? <Image src={logoUrl} alt="Current logo" width={64} height={64} unoptimized className="size-full object-cover" />
                    : <ImagePlus aria-hidden="true" className="size-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file?.name ?? (logoUrl ? 'Logo on your page' : 'No logo uploaded')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Shown above your shop name.</p>
                </div>
              </div>
              <Input id="brand-logo" ref={fileRef} type="file" name="logo" accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null
                  if (selected && selected.size > 2_097_152) {
                    setMessage('Use a logo under 2 MB.')
                    event.target.value = ''
                    return
                  }
                  setFile(selected)
                  setFilePreview(selected ? URL.createObjectURL(selected) : null)
                  setRemoveLogo(false)
                  setMessage('')
                }} className="h-auto py-1.5" />
              {(logoUrl || file) && (
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground"
                  onClick={() => {
                    setFile(null)
                    setFilePreview(null)
                    setRemoveLogo(true)
                    if (fileRef.current) fileRef.current.value = ''
                  }}>
                  <Trash2 aria-hidden="true" /> Remove logo
                </Button>
              )}
            </div>

            <div className="border-t pt-5">
              <Label htmlFor="brand-color">Brand colour</Label>
              <p className="mt-1 text-xs text-muted-foreground">Used for your shop name and booking buttons. Choose a dark colour for readability.</p>
              <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested brand colours">
                {colors.map((choice) => (
                  <button key={choice.value} type="button" title={choice.name} aria-label={choice.name}
                    aria-pressed={color.toLowerCase() === choice.value}
                    onClick={() => setColor(choice.value)}
                    className="grid size-9 place-items-center rounded-full border-2 border-white text-white shadow-sm ring-offset-2 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:ring-2 aria-pressed:ring-foreground"
                    style={{ backgroundColor: choice.value }}>
                    {color.toLowerCase() === choice.value && <Check aria-hidden="true" className="size-4" />}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Input id="brand-color-picker" type="color" aria-label="Pick a custom colour" value={colorIsValid ? color : '#0c0a09'}
                  onChange={(event) => setColor(event.target.value)} className="h-9 w-12 cursor-pointer p-1" />
                <Input id="brand-color" name="accent_color" value={color} onChange={(event) => setColor(event.target.value)}
                  spellCheck={false} maxLength={7} className="max-w-36 font-mono" aria-invalid={!colorIsValid} />
              </div>
              {!colorIsValid && <p className="mt-2 text-xs text-destructive">Choose a valid, darker colour so text stays readable.</p>}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
              <div>
                <p className="text-sm font-medium">Slotly footer</p>
                <p className="mt-1 text-xs text-muted-foreground">Automatically removed from Pro booking pages.</p>
              </div>
              <Badge variant="outline">Hidden</Badge>
            </div>

            <input type="hidden" name="remove_logo" value={String(removeLogo)} />
            <div className="space-y-2">
              <Button type="submit" disabled={saving || !colorIsValid} className="w-full">
                {saving ? 'Saving…' : 'Save branding'}
              </Button>
              {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Live preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">Changes appear here before you save.</p>
        </div>
        <PagePreview {...preview} accent={bookingAccent(color, true)} logoUrl={logoUrl} showSlotlyFooter={false} />
      </div>
    </div>
  )
}
