'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Check, Copy, ExternalLink } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { TimePicker } from '@/components/ui/time-picker'
import { addOnboardingService, completeOnboarding, createOnboardingPage, saveOnboardingHours } from './actions'

const types = [
  { value: 'barber', label: 'Barber or hair salon', suggestion: 'Haircut', price: '25' },
  { value: 'tutor', label: 'Tutor', suggestion: 'Tutoring session', price: '30' },
  { value: 'cleaner', label: 'Cleaner', suggestion: 'Home cleaning', price: '40' },
  { value: 'trainer', label: 'Personal trainer', suggestion: 'Training session', price: '35' },
  { value: 'nail', label: 'Nail salon', suggestion: 'Manicure', price: '25' },
  { value: 'other', label: 'Other', suggestion: 'Appointment', price: '20' },
]
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const defaultDays = dayNames.map((_, day_of_week) => ({ day_of_week, is_active: day_of_week > 0 && day_of_week < 6, start_time: '09:00', end_time: '17:00' }))

export default function OnboardingWizard({ initialPage, initialServices, origin }: {
  initialPage: { id: string; slug: string; business_type: string } | null
  initialServices: Array<{ id: string; name: string }>
  origin: string
}) {
  const router = useRouter()
  const [step, setStep] = useState(initialPage ? initialServices.length ? 3 : 2 : 1)
  const [page, setPage] = useState(initialPage)
  const [services, setServices] = useState(initialServices)
  const [name, setName] = useState('')
  const [type, setType] = useState(initialPage?.business_type ?? 'barber')
  const [phone, setPhone] = useState('')
  const suggestion = types.find((item) => item.value === type) ?? types[0]
  const [serviceName, setServiceName] = useState(suggestion.suggestion)
  const [duration, setDuration] = useState(30)
  const [price, setPrice] = useState('25')
  const [days, setDays] = useState(defaultDays)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function run(action: () => Promise<void>) {
    setBusy(true); setError('')
    try { await action() } catch { setError('Something went wrong. Please try again.') }
    finally { setBusy(false) }
  }
  function changeDay(index: number, changes: Partial<(typeof days)[number]>) {
    setDays((current) => current.map((day) => day.day_of_week === index ? { ...day, ...changes } : day))
  }
  const path = page ? `/book/${page.slug}` : ''
  const url = `${origin}${path}`

  return <main className="min-h-dvh bg-secondary/40 px-4 py-10 sm:py-16">
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="text-xl font-semibold tracking-tight">Slotly</Link>
      <div className="mt-8 flex items-end justify-between">
        <div><p className="text-sm font-medium text-accent">Step {step} of 4</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Set up your booking page</h1></div>
        <span className="text-sm text-muted-foreground">{step * 25}%</span>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={step * 25} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress">
        <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${step * 25}%` }} />
      </div>
      <Card className="mt-8">
        {step === 1 && <><CardHeader><CardTitle>Tell us about your business</CardTitle><CardDescription>This appears on your public booking page.</CardDescription></CardHeader><CardContent>
          <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void run(async () => {
            const result = await createOnboardingPage({ name, type, phone })
            if ('error' in result) { setError(result.error ?? 'Could not create your page.'); return }
            setPage({ id: result.pageId!, slug: result.slug!, business_type: type }); setServiceName(suggestion.suggestion); setPrice(suggestion.price); setStep(2)
          }) }}>
            <div className="space-y-2"><Label htmlFor="business-name">Business name</Label><Input id="business-name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Jay’s Barbershop" /></div>
            <div className="space-y-2"><Label htmlFor="business-type">Business type</Label><Select value={type} onValueChange={(value) => setType(value ?? 'other')}><SelectTrigger id="business-type" className="h-10 w-full">{types.find((item) => item.value === type)?.label}</SelectTrigger><SelectContent>{types.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="business-phone">Phone number (optional)</Label><Input id="business-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
            <Button type="submit" disabled={busy}>Continue <ArrowRight className="size-4" /></Button>
          </form>
        </CardContent></>}
        {step === 2 && <><CardHeader><CardTitle>Add a service</CardTitle><CardDescription>Add at least one service customers can book. You can add more now or later.</CardDescription></CardHeader><CardContent className="space-y-5">
          {services.length > 0 && <ul className="space-y-2">{services.map((service) => <li key={service.id} className="flex items-center gap-2 rounded-lg bg-secondary p-3 text-sm"><Check className="size-4 text-accent" />{service.name}</li>)}</ul>}
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void run(async () => {
            const result = await addOnboardingService({ name: serviceName || suggestion.suggestion, duration, price })
            if ('error' in result) { setError(result.error ?? 'Could not save service.'); return }
            if (result.service) setServices((current) => [...current, result.service!]); setServiceName('')
          }) }}>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="service-name">Service name</Label><Input id="service-name" required value={serviceName} onChange={(event) => setServiceName(event.target.value)} placeholder={suggestion.suggestion} /></div>
            <div className="space-y-2"><Label htmlFor="duration">Duration (minutes)</Label><Input id="duration" type="number" min={5} max={480} required value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></div>
            <div className="space-y-2"><Label htmlFor="price">Price (£)</Label><Input id="price" inputMode="decimal" required value={price} onChange={(event) => setPrice(event.target.value)} /></div>
            <Button type="submit" variant="outline" disabled={busy}>Add service</Button>
          </form>
          <Button disabled={busy || services.length === 0} onClick={() => { setError(''); setStep(3) }}>Continue <ArrowRight className="size-4" /></Button>
        </CardContent></>}
        {step === 3 && <><CardHeader><CardTitle>Set your working hours</CardTitle><CardDescription>Monday to Friday, 9am to 5pm is ready to use. Adjust any day below.</CardDescription></CardHeader><CardContent className="space-y-4">
          {days.map((day) => <div key={day.day_of_week} className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-0">
            <Switch aria-label={`${dayNames[day.day_of_week]} available`} checked={day.is_active} onCheckedChange={(value) => changeDay(day.day_of_week, { is_active: value })} />
            <span className="w-24 text-sm font-medium">{dayNames[day.day_of_week]}</span>
            {day.is_active ? <div className="flex flex-1 items-center gap-2"><TimePicker label={`${dayNames[day.day_of_week]} opens`} value={day.start_time} onValueChange={(value) => changeDay(day.day_of_week, { start_time: value })} /><span>–</span><TimePicker label={`${dayNames[day.day_of_week]} closes`} value={day.end_time} onValueChange={(value) => changeDay(day.day_of_week, { end_time: value })} /></div> : <span className="text-sm text-muted-foreground">Closed</span>}
          </div>)}
          <Button disabled={busy} onClick={() => void run(async () => { const result = await saveOnboardingHours(days); if ('error' in result) { setError(result.error ?? 'Could not save hours.'); return } setStep(4) })}>Save hours <ArrowRight className="size-4" /></Button>
        </CardContent></>}
        {step === 4 && <><CardHeader><CardTitle>You’re live!</CardTitle><CardDescription>Your booking page is ready to share with customers.</CardDescription></CardHeader><CardContent className="space-y-5">
          <div className="break-all rounded-lg border bg-secondary p-4 text-sm">{url}</div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}${path}`); setCopied(true) }}><Copy className="size-4" />{copied ? 'Copied' : 'Copy link'}</Button><Link href={path} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}><ExternalLink className="size-4" />View page</Link></div>
          <Button disabled={busy} onClick={() => void run(async () => { const result = await completeOnboarding(); if ('error' in result) { setError(result.error ?? 'Could not finish.'); return } router.replace('/dashboard'); router.refresh() })}>Go to dashboard <ArrowRight className="size-4" /></Button>
        </CardContent></>}
        {error && <p role="alert" className="mx-6 mb-5 text-sm text-destructive">{error}</p>}
      </Card>
    </div>
  </main>
}
