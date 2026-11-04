'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveShopDetails } from '@/app/(dashboard)/my-page/actions'

export default function ShopDetailsForm({ pageId, name, description, phone, email }: {
  pageId: string
  name: string
  description: string
  phone: string
  email: string
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  return <Card>
    <CardHeader className="border-b"><CardTitle>Shop details</CardTitle>
      <CardDescription>Shown on your public booking page. Your booking link stays the same when you edit these details.</CardDescription></CardHeader>
    <CardContent><form className="grid gap-4 sm:grid-cols-2" onSubmit={async (event) => {
      event.preventDefault()
      setSaving(true)
      setMessage('')
      try {
        const result = await saveShopDetails(pageId, new FormData(event.currentTarget))
        setMessage(result.error ?? 'Shop details saved.')
        if (result.success) router.refresh()
      } catch { setMessage('Could not save your shop details.') }
      finally { setSaving(false) }
    }}>
      <div className="space-y-2 sm:col-span-2"><Label htmlFor="shop-name">Shop name</Label>
        <Input id="shop-name" name="business_name" defaultValue={name} required maxLength={100} /></div>
      <div className="space-y-2"><Label htmlFor="shop-phone">Phone</Label>
        <Input id="shop-phone" name="phone" type="tel" defaultValue={phone} maxLength={30} /></div>
      <div className="space-y-2"><Label htmlFor="shop-email">Contact email</Label>
        <Input id="shop-email" name="email" type="email" defaultValue={email} maxLength={254} /></div>
      <div className="space-y-2 sm:col-span-2"><Label htmlFor="shop-description">Description</Label>
        <Textarea id="shop-description" name="description" defaultValue={description} maxLength={200} rows={3} /></div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button disabled={saving}>{saving ? 'Saving…' : 'Save shop details'}</Button>
        {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </form></CardContent>
  </Card>
}
