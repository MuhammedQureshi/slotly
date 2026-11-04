import { Mail, Phone } from "lucide-react"
import Image from 'next/image'

import { supabaseAdmin } from "@/lib/supabase"
import { getEntitlements } from '@/lib/plans'
import { bookingAccent } from '@/lib/branding'
import BookingPageFlow from "./BookingFlow"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // 'edin-barber'

  const { data, error } = await supabaseAdmin
    .from ('booking_pages')    
    .select('*, services(*)')
    .eq('slug', slug)
    .eq('is_published', true)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching booking:', error)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
        <p className="text-sm text-slate-600">Error loading booking page.</p>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
        <p className="text-sm text-slate-600">No booking page found for {slug}.</p>
      </main>
    )
  }

  const { data: owner } = await supabaseAdmin.from('users').select('plan')
    .eq('id', data.user_id).maybeSingle()
  const { data: weeklyHours } = await supabaseAdmin.from('availability_rules')
    .select('day_of_week, is_active, start_time, end_time')
    .eq('booking_page_id', data.id).order('day_of_week')
  const customBranding = getEntitlements(owner?.plan).customBranding
  const accent = bookingAccent(data.accent_color, customBranding)
  const logo = customBranding
    ? data.logo_path
      ? supabaseAdmin.storage.from('booking-logos').getPublicUrl(data.logo_path).data.publicUrl
      : typeof data.logo_url === 'string' && data.logo_url.startsWith('https://')
        ? data.logo_url : null
    : null

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <header className="border-b border-slate-200 pb-8 text-center sm:pb-10">
          {logo && <Image src={logo} alt={`${data.business_name} logo`} width={80} height={80} unoptimized className="mx-auto mb-4 size-20 rounded-full object-cover" />}
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Book an appointment
          </p>
          <h1 style={{ color: accent }} className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {data.business_name}
          </h1>
          {data.description && (
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
              {data.description}
            </p>
          )}
          {data.phone && (
            <a
              href={`tel:${data.phone.replace(/\s/g, '')}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950 focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
            >
              <Phone aria-hidden="true" className="size-4 text-slate-500" />
              {data.phone}
            </a>
          )}
          {data.email && <a href={`mailto:${data.email}`} className="mt-2 block text-sm text-slate-600 hover:underline">
            <Mail aria-hidden="true" className="mr-1 inline size-4" />{data.email}</a>}
        </header>

        <section className="pt-8 sm:pt-10">
          <BookingPageFlow
            services={(data.services ?? []).filter((service: { is_active: boolean }) => service.is_active)}
            pageId={data.id}
            timezone={data.timezone ?? 'Europe/London'}
          />
        </section>
        {weeklyHours && weeklyHours.length > 0 && <Card className="mt-8">
          <CardHeader><CardTitle className="text-base">Opening hours</CardTitle></CardHeader>
          <CardContent><dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">{weeklyHours.map((rule) => <div key={rule.day_of_week} className="flex justify-between gap-3">
            <dt className="text-slate-600">{WEEKDAYS[rule.day_of_week]}</dt>
            <dd className="font-medium">{rule.is_active ? `${rule.start_time.slice(0,5)}–${rule.end_time.slice(0,5)}` : 'Closed'}</dd>
          </div>)}</dl></CardContent>
        </Card>}
        {!customBranding && <footer className="mt-10 text-center text-xs text-slate-500">Powered by Slotly</footer>}
      </div>
    </main>
  )
}
