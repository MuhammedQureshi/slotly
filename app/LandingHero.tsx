'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight, BarChart3, Bell, CalendarDays, Check, ChevronDown, Clock3,
  CreditCard, Dumbbell, GraduationCap, LayoutDashboard, Link2,
  MoreHorizontal, Play, Plus, Scissors, Search, Settings, Sparkles,
  SprayCan, Users,
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const fadeUp = (y: number, duration: number, delay = 0) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration, delay, ease: [0.22, 1, 0.36, 1] as const },
})

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
}

const sidebarItems = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Bookings', icon: CalendarDays, badge: '10' },
  { label: 'Customers', icon: Users },
  { label: 'Statistics', icon: BarChart3 },
  { label: 'Services', icon: Scissors },
]

const upcoming = [
  ['09:30', 'Jordan Lee', 'Skin fade'],
  ['11:00', 'Amir Khan', 'Haircut'],
  ['13:30', 'Theo James', 'Haircut & beard'],
]

const recent = [
  ['Today', 'Jordan Lee', '£25.00', 'Confirmed'],
  ['Today', 'Amir Khan', '£18.00', 'Confirmed'],
  ['Tomorrow', 'Theo James', '£32.00', 'Pending'],
  ['Fri, 6 Nov', 'Jamie Cole', '£20.00', 'Confirmed'],
]

const steps = [
  ['01', 'Create your page', 'Add your services, prices, opening hours and the details customers need.'],
  ['02', 'Share your link', 'Put it in your Instagram bio, messages, website or shop window.'],
  ['03', 'Get booked & notified', 'Customers choose a free time and both of you get an email confirmation.'],
]

const audiences = [
  { title: 'Barbers', icon: Scissors, pain: 'Stop answering booking messages while you are with a client.', solution: 'Let customers see your cuts, prices and live availability in one link.' },
  { title: 'Tutors', icon: GraduationCap, pain: 'Avoid long message threads just to agree on a lesson time.', solution: 'Share your available slots and keep every session organised.' },
  { title: 'Cleaners', icon: SprayCan, pain: 'Turn enquiries into confirmed jobs without repeated calls.', solution: 'List each service and give customers a simple way to book.' },
  { title: 'Personal trainers', icon: Dumbbell, pain: 'Spend less time coordinating diaries between sessions.', solution: 'Give clients a clear schedule and a booking link that works anywhere.' },
]

const freeFeatures = [
  'Up to 100 bookings each month', 'Personal booking page',
  'Services, prices and availability', 'Customer and owner confirmations',
  'Customer cancellation links',
]

const proFeatures = [
  'Unlimited monthly bookings', 'Automatic email reminders',
  'Custom logo, colours and branding', 'Customer history and notes',
  'Booking statistics and service value', 'Shareable booking QR code',
]

const faqs = [
  ['Do customers need an account?', 'No. They open your link, choose a service and time, then enter their details to confirm.'],
  ['Can I offer more than one service?', 'Yes. Add services with different prices and appointment lengths, then edit them whenever you need to.'],
  ['What is included in the free plan?', 'Your booking page, services, availability and email confirmations for up to 100 bookings each month.'],
  ['Can customers cancel a booking?', 'Yes. Every confirmation email includes a secure cancellation link, and the cancelled time becomes available again.'],
  ['Does Slotly take customer payments?', 'Not currently. Slotly organises the appointment; customers pay you in the same way they do today.'],
]

function SlotlyDashboard() {
  return (
    <div className="h-[390px] select-none overflow-hidden rounded-xl bg-background text-[11px] text-foreground shadow-sm pointer-events-none md:h-[430px]">
      <div className="flex h-11 items-center border-b border-border bg-background px-3">
        <div className="flex w-40 shrink-0 items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-primary font-display text-sm text-primary-foreground">S</span>
          <span className="font-semibold">Slotly</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </div>
        <div className="hidden h-7 w-56 items-center gap-2 rounded-md bg-secondary px-2.5 text-muted-foreground sm:flex">
          <Search className="size-3" /><span className="flex-1">Search appointments</span>
          <kbd className="rounded bg-background px-1.5 py-0.5 text-[9px]">⌘K</kbd>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="hidden rounded-full bg-primary px-3 py-1.5 font-medium text-primary-foreground sm:inline-flex">New booking</span>
          <Bell className="size-3.5 text-muted-foreground" />
          <span className="grid size-6 place-items-center rounded-full bg-accent text-[9px] font-semibold text-accent-foreground">SL</span>
        </div>
      </div>

      <div className="flex h-[calc(100%_-_2.75rem)]">
        <aside className="hidden w-40 shrink-0 border-r border-border bg-background p-2.5 sm:block">
          <nav className="space-y-0.5">
            {sidebarItems.map(({ label, icon: Icon, active, badge }) => (
              <div key={label} className={cn('flex h-7 items-center gap-2 rounded-md px-2 text-muted-foreground', active && 'bg-secondary font-medium text-foreground')}>
                <Icon className="size-3.5" /><span>{label}</span>
                {badge && <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[8px] text-accent-foreground">{badge}</span>}
              </div>
            ))}
          </nav>
          <p className="mb-1.5 mt-5 px-2 text-[9px] font-medium tracking-wider text-muted-foreground uppercase">Workspace</p>
          <div className="space-y-0.5 text-muted-foreground">
            <div className="flex h-7 items-center gap-2 rounded-md px-2"><Link2 className="size-3.5" />Booking page</div>
            <div className="flex h-7 items-center gap-2 rounded-md px-2"><Clock3 className="size-3.5" />Availability</div>
            <div className="flex h-7 items-center gap-2 rounded-md px-2"><CreditCard className="size-3.5" />Billing</div>
            <div className="flex h-7 items-center gap-2 rounded-md px-2"><Settings className="size-3.5" />Settings</div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 bg-secondary/30 p-3 md:p-4">
          <div className="flex items-start justify-between">
            <div><p className="text-sm font-semibold">Good morning, Sam</p><p className="mt-0.5 text-[10px] text-muted-foreground">Here’s what’s happening at your business.</p></div>
            <span className="text-[9px] text-muted-foreground">Thursday, 5 November</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 overflow-hidden">
            <span className="rounded-full bg-accent px-3 py-1.5 font-medium text-accent-foreground"><Plus className="mr-1 inline size-3" />Add booking</span>
            {['Add service', 'Block time', 'View page'].map((action) => <span key={action} className="hidden rounded-full border border-border bg-background px-3 py-1.5 text-[10px] sm:inline-flex">{action}</span>)}
            <span className="ml-auto hidden text-[9px] text-muted-foreground md:inline">Customise</span>
          </div>
          <div className="mt-3 flex gap-3">
            <div className="min-w-0 flex-1 basis-0 rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground"><span>Bookings this month</span><span className="grid size-3 place-items-center rounded-full bg-accent text-[7px] text-accent-foreground"><Check className="size-2" /></span></div>
              <p className="mt-2 text-xl font-semibold tracking-tight">68 <span className="text-xs font-normal text-muted-foreground">/ 100</span></p>
              <div className="mt-1 flex items-center gap-3 text-[9px]"><span className="text-muted-foreground">Last 30 days</span><span className="text-accent">+14 bookings</span><span className="text-destructive">3 cancelled</span></div>
              <svg aria-hidden="true" className="mt-1 h-16 w-full" viewBox="0 0 320 80" preserveAspectRatio="none">
                <defs><linearGradient id="slotly-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.15" /><stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" /></linearGradient></defs>
                <path d="M0,62 C32,60 45,47 74,50 C108,54 116,36 148,39 C184,42 194,24 224,29 C252,34 278,13 320,16 L320,80 L0,80 Z" fill="url(#slotly-area)" />
                <path d="M0,62 C32,60 45,47 74,50 C108,54 116,36 148,39 C184,42 194,24 224,29 C252,34 278,13 320,16" fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1 basis-0 rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between"><span className="font-medium">Today</span><div className="flex items-center gap-2 text-muted-foreground"><Plus className="size-3" /><MoreHorizontal className="size-3" /></div></div>
              <div className="mt-1">{upcoming.map(([time, customer, service]) => <div key={`${time}-${customer}`} className="flex items-center gap-2 py-2.5"><span className="w-8 text-[9px] text-muted-foreground">{time}</span><span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[8px] font-medium">{customer.split(' ').map((part) => part[0]).join('')}</span><span className="min-w-0"><span className="block truncate text-[10px] font-medium">{customer}</span><span className="block truncate text-[9px] text-muted-foreground">{service}</span></span></div>)}</div>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-border bg-background p-3">
            <div className="flex items-center justify-between"><span className="font-medium">Recent appointments</span><span className="text-[9px] text-accent">View all</span></div>
            <table className="mt-2 w-full table-fixed text-left"><thead className="text-[9px] text-muted-foreground"><tr><th className="w-1/4 pb-1 font-normal">Date</th><th className="w-1/3 pb-1 font-normal">Customer</th><th className="pb-1 font-normal">Amount</th><th className="pb-1 font-normal">Status</th></tr></thead><tbody>{recent.map(([date, customer, amount, status]) => <tr key={`${date}-${customer}`} className="border-t border-border/70"><td className="truncate py-2 text-[9px] text-muted-foreground">{date}</td><td className="truncate py-2 text-[10px] font-medium">{customer}</td><td className="py-2 text-[10px]">{amount}</td><td className="py-2"><span className={cn('rounded-full px-2 py-1 text-[8px]', status === 'Confirmed' ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground')}>{status}</span></td></tr>)}</tbody></table>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description: string }) {
  return <motion.div {...reveal} className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">{eyebrow}</p><h2 className="mt-4 font-display text-4xl leading-none tracking-tight sm:text-5xl">{title}</h2><p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p></motion.div>
}

export function LandingHero() {
  return (
    <main className="overflow-hidden bg-background font-body text-foreground">
      <section className="relative flex min-h-screen flex-col overflow-hidden bg-background">
        <video aria-hidden="true" autoPlay loop muted playsInline preload="metadata" className="absolute inset-0 z-0 size-full object-cover" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4" />
        <div aria-hidden="true" className="absolute inset-0 z-[1] bg-background/72" />
        <nav aria-label="Main navigation" className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12 lg:px-20">
          <Link href="/" className="text-xl font-semibold tracking-tight">✦ Slotly</Link>
          <div className="hidden items-center gap-8 md:flex"><a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How it works</a><a href="#who-its-for" className="text-sm text-muted-foreground hover:text-foreground">Who it’s for</a><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a><a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a><Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground">Log in</Link></div>
          <Button nativeButton={false} render={<Link href="/sign-up" />} className="h-10 rounded-full px-5">Get started free</Button>
        </nav>
        <div className="relative z-10 flex flex-1 flex-col items-center px-4 pt-8 sm:px-6 sm:pt-10">
          <motion.div {...fadeUp(10, 0.5)} className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground shadow-sm"><Sparkles className="size-3.5 text-accent" /> 100 bookings free every month</motion.div>
          <motion.h1 {...fadeUp(16, 0.6, 0.1)} className="max-w-2xl text-center font-display text-5xl leading-[0.95] tracking-tight md:text-6xl lg:text-[5rem]">Your <span className="italic">booking page.</span><br />Ready in 60 seconds.</motion.h1>
          <motion.p {...fadeUp(16, 0.6, 0.2)} className="mt-4 max-w-[650px] text-center text-base leading-relaxed text-muted-foreground md:text-lg">Share one simple link, let customers choose an available time, and keep your day organised without the back-and-forth.</motion.p>
          <motion.div {...fadeUp(16, 0.6, 0.3)} className="mt-5 flex items-center gap-3"><Button nativeButton={false} render={<Link href="/sign-up" />} className="h-11 rounded-full px-6">Get started free</Button><Button nativeButton={false} render={<a href="#how-it-works" aria-label="See how Slotly works" />} variant="ghost" size="icon-lg" className="size-11 rounded-full border-0 bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)]"><Play className="size-4 fill-foreground" /></Button></motion.div>
          <motion.div {...fadeUp(30, 0.8, 0.5)} className="mt-8 w-full max-w-5xl overflow-hidden rounded-2xl p-3 md:p-4" style={{ background: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: 'var(--shadow-dashboard)' }}><SlotlyDashboard /></motion.div>
        </div>
      </section>

      <section id="how-it-works" className="px-6 py-24 sm:py-32"><div className="mx-auto max-w-6xl"><SectionHeading eyebrow="How it works" title={<>From setup to booked in <span className="italic">three steps.</span></>} description="No complicated software to learn. Add the essentials, share one link and let Slotly handle the routine booking work." /><div className="mt-14 grid gap-5 md:grid-cols-3">{steps.map(([number, title, description], index) => <motion.div key={number} {...reveal} transition={{ ...reveal.transition, delay: index * 0.08 }}><Card className="h-full border-0 py-6 shadow-none ring-1 ring-border"><CardHeader className="px-6"><span className="grid size-10 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{number}</span><CardTitle className="mt-6 text-xl">{title}</CardTitle></CardHeader><CardContent className="px-6"><p className="leading-7 text-muted-foreground">{description}</p></CardContent></Card></motion.div>)}</div></div></section>

      <section id="who-its-for" className="bg-secondary/60 px-6 py-24 sm:py-32"><div className="mx-auto max-w-6xl"><SectionHeading eyebrow="Who it’s for" title={<>Built for people whose time is their <span className="italic">business.</span></>} description="Slotly removes repetitive appointment messages, so you can stay focused on the work in front of you." /><div className="mt-14 grid gap-5 sm:grid-cols-2">{audiences.map(({ title, icon: Icon, pain, solution }, index) => <motion.div key={title} {...reveal} transition={{ ...reveal.transition, delay: index * 0.06 }}><Card className="h-full border-0 bg-background py-6 shadow-none ring-1 ring-border"><CardHeader className="px-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent"><Icon className="size-5" /></span><CardTitle className="text-xl">{title}</CardTitle></div></CardHeader><CardContent className="space-y-3 px-6"><p className="font-medium">{pain}</p><p className="leading-7 text-muted-foreground">{solution}</p></CardContent></Card></motion.div>)}</div></div></section>

      <section id="pricing" className="px-6 py-24 sm:py-32"><div className="mx-auto max-w-5xl"><SectionHeading eyebrow="Simple pricing" title={<>Start free. Go Pro when you’re <span className="italic">ready.</span></>} description="Set up your page without a card. Upgrade when unlimited bookings and extra tools start saving you more time." /><div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
        <Card className="border-0 py-7 shadow-none ring-1 ring-border"><CardHeader className="px-7"><CardTitle className="text-2xl">Free</CardTitle><CardDescription>Everything you need to start taking bookings.</CardDescription><p className="mt-5 font-display text-5xl">£0</p><p className="text-sm text-muted-foreground">No card required</p></CardHeader><CardContent className="space-y-3 px-7">{freeFeatures.map((feature) => <p key={feature} className="flex gap-3 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-accent" />{feature}</p>)}<Button nativeButton={false} render={<Link href="/sign-up" />} variant="outline" className="mt-5 h-11 w-full rounded-full">Start free</Button></CardContent></Card>
        <Card className="relative border-0 bg-primary py-7 text-primary-foreground shadow-[var(--shadow-dashboard)] ring-2 ring-accent"><span className="absolute right-5 top-5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Most popular</span><CardHeader className="px-7"><CardTitle className="text-2xl text-primary-foreground">Pro</CardTitle><CardDescription className="text-primary-foreground/65">More automation, insight and control.</CardDescription><p className="mt-5 font-display text-5xl">£9<span className="font-body text-base text-primary-foreground/60"> / month</span></p><p className="text-sm text-primary-foreground/60">Cancel whenever you need to</p></CardHeader><CardContent className="space-y-3 px-7">{proFeatures.map((feature) => <p key={feature} className="flex gap-3 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-accent" />{feature}</p>)}<Button nativeButton={false} render={<Link href="/sign-up" />} className="mt-5 h-11 w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/85">Start with Pro</Button></CardContent></Card>
      </div></div></section>

      <section id="faq" className="bg-secondary/60 px-6 py-24 sm:py-32"><div className="mx-auto max-w-3xl"><SectionHeading eyebrow="FAQ" title={<>Questions, <span className="italic">answered.</span></>} description="The practical details you need before sharing your first booking link." /><div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-background px-6 sm:px-8">{faqs.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium"><span>{question}</span><Plus className="size-4 shrink-0 transition-transform group-open:rotate-45" /></summary><p className="max-w-2xl pt-3 text-sm leading-7 text-muted-foreground">{answer}</p></details>)}</div></div></section>

      <section className="px-6 py-8"><motion.div {...reveal} className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12 sm:py-24"><div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--accent)/0.22),transparent_45%)]" /><div className="relative mx-auto max-w-2xl"><p className="text-xs font-semibold tracking-[0.18em] text-primary-foreground/60 uppercase">Your next booking is waiting</p><h2 className="mt-4 font-display text-4xl leading-none sm:text-6xl">Stop losing bookings to <span className="italic">missed calls.</span></h2><p className="mx-auto mt-5 max-w-xl leading-7 text-primary-foreground/65">Give customers a simple way to book while you stay focused on your work.</p><Button nativeButton={false} render={<Link href="/sign-up" />} className="mt-8 h-11 rounded-full bg-background px-6 text-foreground hover:bg-background/90">Get started free <ArrowRight className="size-4" /></Button></div></motion.div></section>

      <footer className="px-6 py-10"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 border-t border-border pt-8 sm:flex-row"><Link href="/" className="text-xl font-semibold tracking-tight">✦ Slotly</Link><div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"><a href="#how-it-works" className="hover:text-foreground">How it works</a><a href="#pricing" className="hover:text-foreground">Pricing</a><a href="#faq" className="hover:text-foreground">FAQ</a><Link href="/sign-in" className="hover:text-foreground">Log in</Link></div><p className="text-sm text-muted-foreground">© 2026 Slotly</p></div></footer>
    </main>
  )
}
