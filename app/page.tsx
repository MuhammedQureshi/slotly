import {
  ArrowRight,
  CalendarCheck2,
  Check,
  Clock3,
  Scissors,
  Smartphone,
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const services = [
  ['Skin fade', '45 min', '£25'],
  ['Haircut & beard', '60 min', '£32'],
  ['Kids haircut', '30 min', '£18'],
]

const features = [
  {
    icon: CalendarCheck2,
    title: 'Online booking',
    description: 'Clients book available times without calling or messaging.',
  },
  {
    icon: Clock3,
    title: 'Your working hours',
    description: 'Choose exactly when customers can make an appointment.',
  },
  {
    icon: Smartphone,
    title: 'One simple link',
    description: 'Share your booking page on Instagram, WhatsApp or your website.',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-stone-950 text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Slot<span className="text-amber-400">ly</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm font-medium text-stone-300 transition hover:text-white">Pricing</Link>
          <Link
            href="/sign-in"
            className="hidden text-sm font-medium text-stone-300 transition hover:text-white sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ size: 'lg' }), 'rounded-full bg-amber-400 text-stone-950 hover:bg-amber-300')}
          >
            Start free
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28">
        <div className="absolute -right-40 top-10 size-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative">
          <Badge variant="outline" className="h-auto gap-2 border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-amber-300">
            <Scissors aria-hidden="true" className="size-3.5" />
            Built for barbers
          </Badge>
          <h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            Less time arranging. More time cutting.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-stone-300">
            Let clients book your services online while Slotly keeps your diary,
            availability and customer details organised.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: 'lg' }), 'h-12 bg-amber-400 px-5 text-stone-950 hover:bg-amber-300')}
            >
              Create your booking page
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 border-stone-700 bg-transparent px-5 text-white hover:border-stone-500 hover:bg-stone-900 hover:text-white')}
            >
              Sign in
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-400">
            {['Free to start', 'No card required', 'Set up in minutes'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <Check aria-hidden="true" className="size-4 text-amber-400" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] border border-stone-700/80 bg-stone-900 p-4 shadow-2xl shadow-black/40 sm:p-6">
            <div className="rounded-2xl bg-stone-50 p-5 text-stone-950 sm:p-7">
              <div className="flex items-center gap-3 border-b border-stone-200 pb-5">
                <span className="grid size-11 place-items-center rounded-xl bg-stone-950 text-amber-400">
                  <Scissors aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">Your Barbershop</p>
                  <p className="text-sm text-stone-500">Book an appointment</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {services.map(([name, duration, price]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4"
                  >
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
                        <Clock3 aria-hidden="true" className="size-3.5" />
                        {duration}
                      </p>
                    </div>
                    <span className="font-semibold">{price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-amber-400 px-4 py-3 text-center text-sm font-semibold text-stone-950">
                Choose a service
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-stone-800 bg-stone-900/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold text-white">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-stone-400">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
