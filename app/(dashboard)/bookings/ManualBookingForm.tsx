'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DateTimeField } from '@/components/ui/date-picker'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createManualBooking } from './actions'

type Service = { id: string; name: string }

export default function ManualBookingForm({ services, timezone, defaultOpen = false }: { services: Service[]; timezone: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [serviceId, setServiceId] = useState('')
  const [resetKey, setResetKey] = useState(0)
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID())
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  return <Dialog open={open} onOpenChange={setOpen}>
    <div className="mb-6 flex justify-end">
      <DialogTrigger render={<Button />}><CalendarPlus aria-hidden="true" /> Add appointment</DialogTrigger>
    </div>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg"><CalendarPlus aria-hidden="true" className="size-4" /> Add an appointment</DialogTitle>
        <DialogDescription>For customers who book by phone or in person.</DialogDescription>
      </DialogHeader>
      <form onSubmit={async (event) => {
        event.preventDefault()
        if (!serviceId) { setMessage('Choose a service.'); return }
        const form = event.currentTarget
        const formData = new FormData(form)
        if (!formData.get('starts_at')) { setMessage('Choose a date and time.'); return }
        setSaving(true)
        setMessage('')
        try {
          const result = await createManualBooking(formData)
          if (result.error) setMessage(result.error)
          else {
            setMessage('Appointment added.')
            setServiceId('')
            setResetKey((current) => current + 1)
            setRequestKey(crypto.randomUUID())
            form.reset()
            setOpen(false)
            router.refresh()
          }
        } catch { setMessage('Unable to save. Please try again.') }
        finally { setSaving(false) }
      }} className="grid gap-5">
        <input type="hidden" name="request_key" value={requestKey} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="manual-service">Service</Label>
            <Select value={serviceId} onValueChange={(value) => setServiceId(value ?? '')}>
              <SelectTrigger id="manual-service" className="w-full"><SelectValue placeholder="Choose a service" /></SelectTrigger>
              <SelectContent>{services.map((service) => <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>)}</SelectContent>
            </Select>
            <input type="hidden" name="service_id" value={serviceId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-name">Customer name</Label>
            <Input id="manual-name" name="customer_name" required autoComplete="name" placeholder="Customer name" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="manual-email">Customer email</Label>
            <Input id="manual-email" name="customer_email" type="email" required autoComplete="email" placeholder="customer@example.com" />
          </div>
        </div>
        <DateTimeField key={resetKey} name="starts_at" timezone={timezone} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving || !services.length}>{saving ? 'Adding…' : 'Add appointment'}</Button>
          {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
        </div>
      </form>
    </DialogContent>
  </Dialog>
}
