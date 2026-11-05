import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarCheck2, Check, ChevronRight, Clock3, MailCheck, Scissors } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FREE_MONTHLY_BOOKING_LIMIT, PRO_MONTHLY_PRICE_GBP } from '@/lib/plans'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Slotly | Your booking page, ready in 60 seconds',
  description: 'A simple booking page for barbers, tutors, cleaners and personal trainers. Share your link and let customers book an open time.',
}

const steps = [
  ['Create your page', 'Add your services, prices and working hours. Your booking page is ready to share.'],
  ['Share your link', 'Put it on Instagram, your website or in a message. Customers book directly with you.'],
  ['Get booked & notified', 'Customers choose an available time. You both get a confirmation email.'],
]

const audiences = [
  ['Barbers', 'Calls interrupt your work.', 'Let clients choose an open slot while you keep cutting.'],
  ['Tutors', 'Lesson times get buried in messages.', 'Share one link for the sessions and times you offer.'],
  ['Cleaners', 'Arranging visits takes too many replies.', 'Show the appointments you can take in one place.'],
  ['Personal Trainers', 'Scheduling eats into coaching time.', 'Let clients book sessions that fit your hours.'],
]

const freeFeatures = [
  `${FREE_MONTHLY_BOOKING_LIMIT} bookings per calendar month`,
  'One booking page and calendar',
  'Services, availability and manual bookings',
  'Confirmation emails and booking links',
]

const proFeatures = [
  'Everything in Free',
  'Unlimited bookings',
  'Your logo and colours, without the Slotly footer',
  'Email reminders, statistics and a booking QR code',
]

const questions = [
  ['Do my customers need an account?', 'No. They choose a service and time, enter their details, and receive a confirmation email.'],
  ['Can I offer more than one service?', 'Yes. Add services with different prices and appointment lengths.'],
  ['What is included in the Free plan?', `One booking page and calendar, core scheduling tools, and up to ${FREE_MONTHLY_BOOKING_LIMIT} bookings per calendar month. No card is needed to start.`],
  ['Can customers cancel or reschedule?', 'Yes. Their confirmation email includes a private link. Online changes follow the cutoff you set.'],
  ['Does Slotly take customer payments?', 'No. Customers pay you directly. Stripe handles only your optional Slotly Pro subscription.'],
]

const amberButton = cn(buttonVariants({ size: 'lg' }), 'h-11 rounded-lg bg-amber-400 px-5 font-semibold text-stone-950 hover:bg-amber-300')

function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" aria-label="Slotly home" className={cn('inline-flex items-center gap-2 text-xl font-bold tracking-tight', light ? 'text-white' : 'text-stone-950')}>
    <span className="grid size-8 place-items-center rounded-lg bg-amber-400 text-stone-950"><CalendarCheck2 aria-hidden="true" className="size-5" /></span>
    Slotly
  </Link>
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="max-w-2xl">
    <p className="text-xs font-bold tracking-[0.16em] text-amber-700 uppercase">{eyebrow}</p>
    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">{title}</h2>
    <p className="mt-3 text-base leading-7 text-stone-600">{description}</p>
  </div>
}

export default function Home() {
  return <main className="bg-white text-stone-950">
    <header className="border-b border-stone-200 bg-white">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-3 px-5 py-4 sm:px-8">
        <Logo />
        <div className="order-3 flex w-full items-center gap-5 text-sm font-medium text-stone-600 sm:order-2 sm:w-auto sm:gap-7">
          <a href="#how-it-works" className="hover:text-stone-950">How it works</a>
          <a href="#pricing" className="hover:text-stone-950">Pricing</a>
          <Link href="/sign-in" className="hover:text-stone-950">Log in</Link>
        </div>
        <Link href="/sign-up" className={cn(amberButton, 'order-2 sm:order-3')}>Get started free</Link>
      </nav>
    </header>

    <section className="relative overflow-hidden bg-stone-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#fef3c7_0%,transparent_42%)]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16 lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
            <Clock3 aria-hidden="true" className="size-3.5" /> Less admin. More appointments.
          </div>
          <h1 className="mt-6 max-w-2xl text-5xl leading-[1.05] font-semibold tracking-[-0.045em] text-stone-950 sm:text-6xl">
            Your booking page. <span className="text-amber-700">Ready in 60 seconds.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
            Give customers one simple place to see your services and book an open time. Slotly keeps your calendar organised and sends the confirmations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up" className={amberButton}>Get started free <ArrowRight aria-hidden="true" className="size-4" /></Link>
            <a href="#how-it-works" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 rounded-lg border-stone-300 bg-white px-5 text-stone-900 hover:bg-stone-100')}>See how it works</a>
          </div>
          <p className="mt-5 text-sm text-stone-600">Free to start · No card required · No booking commissions</p>
        </div>
        <div aria-label="Example Slotly booking page" className="mx-auto w-full max-w-md rounded-2xl border border-stone-200 bg-white p-3 shadow-xl shadow-stone-300/50 sm:p-5">
          <div className="rounded-xl bg-stone-950 px-5 py-5 text-white">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-lg bg-amber-400 text-stone-950"><Scissors aria-hidden="true" className="size-5" /></span>
              <span className="rounded-full border border-white/25 px-3 py-1 text-xs text-stone-200">Booking page</span>
            </div>
            <p className="mt-5 text-xl font-semibold">Your business, ready to book</p>
            <p className="mt-1 text-sm text-stone-300">Choose a service and an available time.</p>
          </div>
          <div className="px-2 py-4 sm:px-3">
            <p className="mb-3 text-sm font-semibold">Select a service</p>
            {[
              ['Haircut', '30 min', '£15'],
              ['Haircut & beard', '45 min', '£25'],
              ['Skin fade', '45 min', '£20'],
            ].map(([service, duration, price]) => <div key={service} className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-stone-200 p-3">
              <div><p className="text-sm font-medium">{service}</p><p className="mt-0.5 text-xs text-stone-500">{duration}</p></div>
              <div className="flex items-center gap-2 text-sm font-semibold">{price}<ChevronRight aria-hidden="true" className="size-4 text-stone-400" /></div>
            </div>)}
            <p className="mt-4 flex items-center gap-2 text-xs text-stone-500"><MailCheck aria-hidden="true" className="size-4 text-amber-700" /> Confirmation emails sent automatically</p>
          </div>
        </div>
      </div>
    </section>

    <section id="how-it-works" className="scroll-mt-8 border-t border-stone-200 px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="How it works" title="From a blank page to booked." description="Set up the essentials, share your link, and let customers book while you get on with your day." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">{steps.map(([title, description], index) => <Card key={title} className="gap-0 py-6"><CardContent>
          <span className="grid size-10 place-items-center rounded-lg bg-amber-100 text-sm font-bold text-amber-900">{index + 1}</span>
          <h3 className="mt-5 text-xl font-semibold">{title}</h3><p className="mt-2 leading-6 text-stone-600">{description}</p>
        </CardContent></Card>)}</div>
      </div>
    </section>

    <section id="who-its-for" className="scroll-mt-8 bg-stone-50 px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Who it’s for" title="Made for people who work by appointment." description="One straightforward booking flow for the services you offer and the hours you work." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{audiences.map(([title, problem, solution]) => <Card key={title} className="gap-0 py-6"><CardContent>
          <h3 className="text-lg font-semibold">{title}</h3><p className="mt-4 text-sm font-medium text-stone-800">{problem}</p><p className="mt-2 text-sm leading-6 text-stone-600">{solution}</p>
        </CardContent></Card>)}</div>
      </div>
    </section>

    <section id="pricing" className="scroll-mt-8 px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Pricing" title="Start free. Upgrade when you need more." description="Simple monthly pricing. No booking commissions or customer acquisition fees." />
        <div className="mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          <Card className="gap-0 py-7"><CardContent className="flex h-full flex-col">
            <h3 className="text-xl font-semibold">Free</h3><p className="mt-4 text-4xl font-semibold">£0</p>
            <p className="mt-2 text-sm text-stone-600">Everything you need to start taking bookings.</p>
            <ul className="my-7 space-y-3 text-sm text-stone-700">{freeFeatures.map(feature => <li key={feature} className="flex gap-2"><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />{feature}</li>)}</ul>
            <Link href="/sign-up" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'mt-auto h-11 w-full')}>Get started free</Link>
          </CardContent></Card>
          <Card className="gap-0 border border-amber-500 py-7 ring-1 ring-amber-500"><CardContent className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3"><h3 className="text-xl font-semibold">Pro</h3><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">More room to grow</span></div>
            <p className="mt-4"><span className="text-4xl font-semibold">£{PRO_MONTHLY_PRICE_GBP}</span><span className="text-stone-500"> / month</span></p>
            <p className="mt-2 text-sm text-stone-600">More bookings and your own look.</p>
            <ul className="my-7 space-y-3 text-sm text-stone-700">{proFeatures.map(feature => <li key={feature} className="flex gap-2"><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-700" />{feature}</li>)}</ul>
            <Link href="/billing" className={cn(amberButton, 'mt-auto w-full')}>Choose Pro</Link>
          </CardContent></Card>
        </div>
      </div>
    </section>

    <section id="faq" className="scroll-mt-8 bg-stone-50 px-5 py-20 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow="FAQ" title="Good to know before you start." description="A few straight answers about bookings, plans and payments." />
        <div className="space-y-3">{questions.map(([question, answer]) => <details key={question} className="group rounded-xl border border-stone-200 bg-white px-5 py-4 open:border-amber-300">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-stone-900 [&::-webkit-details-marker]:hidden">{question}<span className="text-xl font-normal text-stone-500 group-open:rotate-45" aria-hidden="true">+</span></summary>
          <p className="mt-3 pr-8 text-sm leading-6 text-stone-600">{answer}</p>
        </details>)}</div>
      </div>
    </section>

    <section className="bg-stone-950 px-5 py-20 text-white sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-7 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Stop losing bookings to missed calls.</h2><p className="mt-3 max-w-xl text-stone-300">Give customers a link they can use whenever they are ready to book.</p></div>
        <Link href="/sign-up" className={amberButton}>Get started free <ArrowRight aria-hidden="true" className="size-4" /></Link>
      </div>
    </section>

    <footer className="border-t border-stone-800 bg-stone-950 px-5 py-8 text-stone-400 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Logo light />
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href="#how-it-works" className="hover:text-white">How it works</a><a href="#pricing" className="hover:text-white">Pricing</a><a href="#faq" className="hover:text-white">FAQ</a><Link href="/sign-in" className="hover:text-white">Log in</Link>
        </nav>
        <p className="text-xs">© {new Date().getFullYear()} Slotly</p>
      </div>
    </footer>
  </main>
}
