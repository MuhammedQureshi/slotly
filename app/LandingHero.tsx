'use client'

import { motion } from 'framer-motion'
import {
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Link2,
  MoreHorizontal,
  Play,
  Plus,
  Scissors,
  Search,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const fadeUp = (y: number, duration: number, delay = 0) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration, delay, ease: [0.22, 1, 0.36, 1] as const },
})

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
          <Search className="size-3" />
          <span className="flex-1">Search appointments</span>
          <kbd className="rounded bg-background px-1.5 py-0.5 text-[9px]">⌘K</kbd>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="hidden rounded-full bg-primary px-3 py-1.5 font-medium text-primary-foreground sm:inline-flex">New booking</span>
          <Bell className="size-3.5 text-muted-foreground" />
          <span className="grid size-6 place-items-center rounded-full bg-accent text-[9px] font-semibold text-accent-foreground">MQ</span>
        </div>
      </div>

      <div className="flex h-[calc(100%_-_2.75rem)]">
        <aside className="hidden w-40 shrink-0 border-r border-border bg-background p-2.5 sm:block">
          <nav className="space-y-0.5">
            {sidebarItems.map(({ label, icon: Icon, active, badge }) => (
              <div key={label} className={cn('flex h-7 items-center gap-2 rounded-md px-2 text-muted-foreground', active && 'bg-secondary font-medium text-foreground')}>
                <Icon className="size-3.5" />
                <span>{label}</span>
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
            <div>
              <p className="text-sm font-semibold">Good morning, Muhammed</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Here’s what’s happening at your barbershop.</p>
            </div>
            <span className="text-[9px] text-muted-foreground">Thursday, 5 November</span>
          </div>

          <div className="mt-3 flex items-center gap-1.5 overflow-hidden">
            <span className="rounded-full bg-accent px-3 py-1.5 font-medium text-accent-foreground"><Plus className="mr-1 inline size-3" />Add booking</span>
            {['Add service', 'Block time', 'View page'].map((action) => <span key={action} className="hidden rounded-full border border-border bg-background px-3 py-1.5 text-[10px] sm:inline-flex">{action}</span>)}
            <span className="ml-auto hidden text-[9px] text-muted-foreground md:inline">Customise</span>
          </div>

          <div className="mt-3 flex gap-3">
            <div className="min-w-0 flex-1 basis-0 rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>Bookings this month</span>
                <span className="grid size-3 place-items-center rounded-full bg-accent text-[7px] text-accent-foreground"><Check className="size-2" /></span>
              </div>
              <p className="mt-2 text-xl font-semibold tracking-tight">68 <span className="text-xs font-normal text-muted-foreground">/ 100</span></p>
              <div className="mt-1 flex items-center gap-3 text-[9px]">
                <span className="text-muted-foreground">Last 30 days</span>
                <span className="text-accent">+14 bookings</span>
                <span className="text-destructive">3 cancelled</span>
              </div>
              <svg aria-hidden="true" className="mt-1 h-16 w-full" viewBox="0 0 320 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="slotly-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,62 C32,60 45,47 74,50 C108,54 116,36 148,39 C184,42 194,24 224,29 C252,34 278,13 320,16 L320,80 L0,80 Z" fill="url(#slotly-area)" />
                <path d="M0,62 C32,60 45,47 74,50 C108,54 116,36 148,39 C184,42 194,24 224,29 C252,34 278,13 320,16" fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="min-w-0 flex-1 basis-0 rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Today</span>
                <div className="flex items-center gap-2 text-muted-foreground"><Plus className="size-3" /><MoreHorizontal className="size-3" /></div>
              </div>
              <div className="mt-1">
                {upcoming.map(([time, customer, service]) => (
                  <div key={`${time}-${customer}`} className="flex items-center gap-2 py-2.5">
                    <span className="w-8 text-[9px] text-muted-foreground">{time}</span>
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[8px] font-medium">{customer.split(' ').map((part) => part[0]).join('')}</span>
                    <span className="min-w-0"><span className="block truncate text-[10px] font-medium">{customer}</span><span className="block truncate text-[9px] text-muted-foreground">{service}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-border bg-background p-3">
            <div className="flex items-center justify-between"><span className="font-medium">Recent appointments</span><span className="text-[9px] text-accent">View all</span></div>
            <table className="mt-2 w-full table-fixed text-left">
              <thead className="text-[9px] text-muted-foreground"><tr><th className="w-1/4 pb-1 font-normal">Date</th><th className="w-1/3 pb-1 font-normal">Customer</th><th className="pb-1 font-normal">Amount</th><th className="pb-1 font-normal">Status</th></tr></thead>
              <tbody>{recent.map(([date, customer, amount, status]) => <tr key={`${date}-${customer}`} className="border-t border-border/70">
                <td className="truncate py-2 text-[9px] text-muted-foreground">{date}</td><td className="truncate py-2 text-[10px] font-medium">{customer}</td><td className="py-2 text-[10px]">{amount}</td><td className="py-2"><span className={cn('rounded-full px-2 py-1 text-[8px]', status === 'Confirmed' ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground')}>{status}</span></td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingHero() {
  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-background font-body text-foreground">
      <video
        aria-hidden="true"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 z-0 size-full object-cover"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
      />
      <div aria-hidden="true" className="absolute inset-0 z-[1] bg-background/72" />

      <nav aria-label="Main navigation" className="relative z-10 flex items-center justify-between px-6 py-5 font-body md:px-12 lg:px-20">
        <Link href="/" className="text-xl font-semibold tracking-tight text-foreground">✦ Slotly</Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Home</Link>
          <a href="#preview" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
          <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
          <Link href="/sign-in" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Log in</Link>
        </div>
        <Button nativeButton={false} render={<Link href="/sign-up" />} className="h-10 rounded-full px-5 text-sm font-medium">
          Get started free
        </Button>
      </nav>

      <section className="relative z-10 flex min-h-0 flex-1 flex-col items-center px-4 pt-4 sm:px-6 sm:pt-6">
        <motion.div {...fadeUp(10, 0.5)} className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
          <Sparkles className="size-3.5 text-accent" /> 100 bookings free every month
        </motion.div>

        <motion.h1 {...fadeUp(16, 0.6, 0.1)} className="max-w-2xl text-center font-display text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl lg:text-[5rem]">
          Your <span className="italic">booking page.</span><br />Ready in 60 seconds.
        </motion.h1>

        <motion.p {...fadeUp(16, 0.6, 0.2)} className="mt-4 max-w-[650px] text-center text-base leading-relaxed text-muted-foreground md:text-lg">
          Share one simple link, let customers choose an available time, and keep your day organised without the back-and-forth.
        </motion.p>

        <motion.div {...fadeUp(16, 0.6, 0.3)} className="mt-5 flex items-center gap-3">
          <Button nativeButton={false} render={<Link href="/sign-up" />} className="h-11 rounded-full px-6 text-sm font-medium">Get started free</Button>
          <Button nativeButton={false} render={<a href="#preview" aria-label="See how Slotly works" />} variant="ghost" size="icon-lg" className="size-11 rounded-full border-0 bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:bg-background/80">
            <Play className="size-4 fill-foreground" />
          </Button>
        </motion.div>

        <motion.div id="preview" {...fadeUp(30, 0.8, 0.5)} className="mt-7 w-full max-w-5xl overflow-hidden rounded-2xl p-3 md:p-4" style={{ background: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: 'var(--shadow-dashboard)' }}>
          <SlotlyDashboard />
        </motion.div>
      </section>
    </main>
  )
}
