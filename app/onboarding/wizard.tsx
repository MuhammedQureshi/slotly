'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Copy, ExternalLink, Link2, Plus, Scissors, Sparkles, Store } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { cn } from '@/lib/utils'
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
const dayOrder = [1, 2, 3, 4, 5, 6, 0]
type Day = { day_of_week: number; is_active: boolean; start_time: string; end_time: string }
const defaultDays: Day[] = dayNames.map((_, day_of_week) => ({ day_of_week, is_active: day_of_week > 0 && day_of_week < 6, start_time: '09:00', end_time: '17:00' }))
const steps = [
  { label: 'Your business', icon: Store },
  { label: 'Services', icon: Scissors },
  { label: 'Working hours', icon: CalendarDays },
  { label: 'Ready to share', icon: Link2 },
]
const fieldClass = 'h-11 rounded-xl bg-background px-3.5 text-sm shadow-none'

export default function OnboardingWizard({ initialPage, initialServices, initialHours, origin }: {
  initialPage: { id: string; slug: string; business_type: string } | null
  initialServices: Array<{ id: string; name: string }>
  initialHours: Day[]
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
  const [price, setPrice] = useState(suggestion.price)
  const [days, setDays] = useState<Day[]>(() => defaultDays.map((fallback) => {
    const saved = initialHours.find((day) => day.day_of_week === fallback.day_of_week)
    return saved ? { ...saved, start_time: saved.start_time?.slice(0, 5) || fallback.start_time, end_time: saved.end_time?.slice(0, 5) || fallback.end_time } : fallback
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showTimeErrors, setShowTimeErrors] = useState(false)
  const activeDays = days.filter((day) => day.is_active).length

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    try { await action() } catch { setError('Something went wrong. Please try again.') }
    finally { setBusy(false) }
  }
  function changeDay(index: number, changes: Partial<Day>) {
    setDays((current) => current.map((day) => day.day_of_week === index ? { ...day, ...changes } : day))
  }
  function goBack() {
    setError('')
    setStep((current) => Math.max(2, current - 1))
  }
  const path = page ? `/book/${page.slug}` : ''
  const url = `${origin}${path}`
  const headings = [
    { title: 'Let’s get you set up.', description: 'A few details now, and your booking page will be ready to share.' },
    { title: 'What do you offer?', description: 'Start with one service. You can always add more later.' },
    { title: 'Set your working hours.', description: 'Choose when customers can book. You can change this any time.' },
    { title: 'Your page is ready.', description: 'Share your link and start taking bookings.' },
  ]
  const heading = headings[step - 1]

  return <main className="min-h-dvh bg-muted/40 px-4 pb-12 pt-6 font-body text-foreground sm:px-6 sm:pt-9">
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">S</span>Slotly</Link>
        <span className="text-xs font-medium text-muted-foreground sm:text-sm">Getting started</span>
      </div>

      <div className="mt-10 sm:mt-14">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold sm:text-sm"><span className="text-accent">STEP {step} OF 4</span><span className="font-normal text-muted-foreground">{step * 25}% complete</span></div>
        <div className="mt-3 grid grid-cols-4 gap-1.5" role="progressbar" aria-valuenow={step * 25} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress">
          {steps.map((item, index) => <span key={item.label} className={cn('h-1.5 rounded-full transition-colors duration-300', index < step ? 'bg-accent' : 'bg-border')} />)}
        </div>
        <div className="mt-4 hidden grid-cols-4 gap-2 sm:grid">{steps.map((item, index) => <div key={item.label} className={cn('flex items-center gap-1.5 text-xs', index === step - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
          {index < step - 1 ? <Check className="size-3.5 text-accent" aria-hidden="true" /> : <span className="tabular-nums">0{index + 1}</span>}{item.label}
        </div>)}</div>
      </div>

      <header className="mb-7 mt-10 sm:mt-12">
        <div className="mb-4 inline-flex size-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">{(() => { const Icon = steps[step - 1].icon; return <Icon className="size-5" aria-hidden="true" /> })()}</div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{heading.title}</h1>
        <p className="mt-2.5 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{heading.description}</p>
      </header>

      <Card className="gap-0 rounded-2xl py-0 shadow-[0_12px_40px_-22px_rgba(27,34,45,0.16)] ring-border">
        {step === 1 && <CardContent className="p-5 sm:p-8">
          <div className="mb-7"><h2 className="text-lg font-semibold">Your business details</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">This is how customers will recognise your page.</p></div>
          <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void run(async () => {
            const result = await createOnboardingPage({ name, type, phone })
            if ('error' in result) { setError(result.error ?? 'Could not create your page.'); return }
            setPage({ id: result.pageId!, slug: result.slug!, business_type: type }); setServiceName(suggestion.suggestion); setPrice(suggestion.price); setStep(2)
          }) }}>
            <div className="space-y-2"><Label htmlFor="business-name">Business name</Label><Input id="business-name" className={fieldClass} required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Jay’s Barbershop" /></div>
            <div className="space-y-2"><Label htmlFor="business-type">Business type</Label><Select value={type} onValueChange={(value) => setType(value ?? 'other')}><SelectTrigger id="business-type" className={cn(fieldClass, 'w-full')}>{types.find((item) => item.value === type)?.label}</SelectTrigger><SelectContent>{types.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="business-phone">Phone number <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="business-phone" type="tel" className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Your business phone number" /></div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="border-t pt-5"><Button type="submit" disabled={busy} className="h-11 w-full rounded-xl px-5 sm:w-auto">{busy ? 'Saving…' : 'Continue'} <ArrowRight className="size-4" /></Button></div>
          </form>
        </CardContent>}

        {step === 2 && <CardContent className="p-5 sm:p-8">
          <div className="mb-6"><h2 className="text-lg font-semibold">Add your first service</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Include a name, duration and price for your customers.</p></div>
          {services.length > 0 && <ul className="mb-6 space-y-2">{services.map((service) => <li key={service.id} className="flex items-center gap-3 rounded-xl border bg-secondary/40 px-4 py-3 text-sm font-medium"><CheckCircle2 className="size-4 shrink-0 text-accent" />{service.name}</li>)}</ul>}
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void run(async () => {
            const result = await addOnboardingService({ name: serviceName || suggestion.suggestion, duration, price })
            if ('error' in result) { setError(result.error ?? 'Could not save service.'); return }
            if (result.service) setServices((current) => [...current, result.service!]); setServiceName('')
          }) }}>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="service-name">Service name</Label><Input id="service-name" className={fieldClass} required value={serviceName} onChange={(event) => setServiceName(event.target.value)} placeholder={suggestion.suggestion} /></div>
            <div className="space-y-2"><Label htmlFor="duration">Duration <span className="font-normal text-muted-foreground">(minutes)</span></Label><Input id="duration" className={fieldClass} type="number" min={5} max={480} required value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></div>
            <div className="space-y-2"><Label htmlFor="price">Price <span className="font-normal text-muted-foreground">(£)</span></Label><Input id="price" className={fieldClass} inputMode="decimal" required value={price} onChange={(event) => setPrice(event.target.value)} /></div>
            <div className="sm:col-span-2"><Button type="submit" variant="outline" disabled={busy} className="h-10 rounded-xl px-4"><Plus className="size-4" /> Add service</Button></div>
          </form>
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5"><p className="text-xs text-muted-foreground">{services.length === 0 ? 'Add at least one service to continue.' : `${services.length} ${services.length === 1 ? 'service' : 'services'} added`}</p><Button disabled={busy || services.length === 0} className="h-11 w-full rounded-xl px-5 sm:w-auto" onClick={() => { setError(''); setStep(3) }}>Continue <ArrowRight className="size-4" /></Button></div>
        </CardContent>}

        {step === 3 && <CardContent className="p-0">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-6 sm:px-8"><div><h2 className="text-lg font-semibold">Weekly availability</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Set your usual hours for each day of the week.</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground/70"><Clock3 className="size-3.5" /> {activeDays} {activeDays === 1 ? 'day' : 'days'} open</span></div>
          <div className="px-5 sm:px-8">
            <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-4 border-b py-3 text-xs font-medium text-muted-foreground sm:grid"><span>Day</span><div className="grid grid-cols-2 gap-3"><span>Opens</span><span>Closes</span></div></div>
            {dayOrder.map((number) => {
              const day = days.find((item) => item.day_of_week === number)!
              const invalid = showTimeErrors && day.is_active && (!day.start_time || !day.end_time || day.start_time >= day.end_time)
              return <div key={number} className="border-b py-3.5 last:border-b-0">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] sm:items-center sm:gap-4">
                  <div className="flex min-w-0 items-center gap-3"><Switch aria-label={`${dayNames[number]} available`} checked={day.is_active} onCheckedChange={(value) => changeDay(number, { is_active: value })} className="data-checked:bg-accent" /><span className="text-sm font-medium">{dayNames[number]}</span>{!day.is_active && <span className="ml-auto rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground sm:hidden">Closed</span>}</div>
                  {day.is_active ? <div className="grid grid-cols-2 gap-3 pl-11 sm:pl-0">
                    <div><Label htmlFor={`open-${number}`} className="mb-1.5 text-xs text-muted-foreground sm:sr-only">Opens</Label><Input id={`open-${number}`} aria-label={`${dayNames[number]} opens`} aria-invalid={invalid} type="time" required value={day.start_time} onChange={(event) => changeDay(number, { start_time: event.target.value })} className="h-10 min-w-0 rounded-xl bg-background px-2.5 text-sm sm:px-3" /></div>
                    <div><Label htmlFor={`close-${number}`} className="mb-1.5 text-xs text-muted-foreground sm:sr-only">Closes</Label><Input id={`close-${number}`} aria-label={`${dayNames[number]} closes`} aria-invalid={invalid} type="time" required value={day.end_time} onChange={(event) => changeDay(number, { end_time: event.target.value })} className="h-10 min-w-0 rounded-xl bg-background px-2.5 text-sm sm:px-3" /></div>
                  </div> : <span className="hidden text-sm text-muted-foreground sm:block">Closed</span>}
                </div>
                {invalid && <p className="mt-2 pl-11 text-xs text-destructive" role="alert">Enter a closing time after the opening time.</p>}
              </div>
            })}
          </div>
          <div className="border-t bg-secondary/25 px-5 py-5 sm:px-8">
            <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" /><span>You can add breaks and time off after setup.</span></div>
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><Button variant="ghost" disabled={busy} onClick={goBack} className="h-11 justify-center rounded-xl px-3 sm:justify-start"><ArrowLeft className="size-4" /> Back to services</Button><Button disabled={busy} className="h-11 rounded-xl px-5" onClick={() => { setShowTimeErrors(true); if (!activeDays || days.some((day) => day.is_active && (!day.start_time || !day.end_time || day.start_time >= day.end_time))) { setError(!activeDays ? 'Open at least one day to continue.' : 'Check the highlighted working hours.'); return } void run(async () => { const result = await saveOnboardingHours(days); if ('error' in result) { setError(result.error ?? 'Could not save hours.'); return } setStep(4) }) }}>{busy ? 'Saving…' : 'Save and continue'} <ArrowRight className="size-4" /></Button></div>
          </div>
        </CardContent>}

        {step === 4 && <CardContent className="p-5 sm:p-8">
          <div className="rounded-2xl border bg-secondary/30 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your booking link</p><p className="mt-2 break-all text-sm font-medium sm:text-base">{url}</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" className="h-10 rounded-xl" onClick={() => void run(async () => { await navigator.clipboard.writeText(`${window.location.origin}${path}`); setCopied(true) })}><Copy className="size-4" />{copied ? 'Copied' : 'Copy link'}</Button><Link href={path} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline', className: 'h-10 rounded-xl px-3' })}><ExternalLink className="size-4" /> View page</Link></div></div>
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-between"><Button variant="ghost" disabled={busy} onClick={goBack} className="h-11 rounded-xl"><ArrowLeft className="size-4" /> Back to hours</Button><Button disabled={busy} className="h-11 rounded-xl px-5" onClick={() => void run(async () => { const result = await completeOnboarding(); if ('error' in result) { setError(result.error ?? 'Could not finish.'); return } router.replace('/dashboard'); router.refresh() })}>{busy ? 'Finishing…' : 'Go to dashboard'} <ArrowRight className="size-4" /></Button></div>
        </CardContent>}
      </Card>
      <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">You can update these details later in your dashboard.</p>
    </div>
  </main>
}
