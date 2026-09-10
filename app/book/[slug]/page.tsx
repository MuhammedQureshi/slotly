import { Phone } from "lucide-react"

import { supabase } from "@/lib/supabase"
import BookingPageFlow from "./BookingFlow"

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // 'edin-barber'

  const { data, error } = await supabase
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <header className="border-b border-slate-200 pb-8 text-center sm:pb-10">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
            Book an appointment
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
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
        </header>

        <section className="pt-8 sm:pt-10" aria-labelledby="services-heading">
          <BookingPageFlow services={data.services} />
        </section>
      </div>
    </main>
  )
}
