'use client'

import Image from 'next/image'
import { ChevronRight, Clock, Lock } from 'lucide-react'

export type PagePreviewProps = {
  slug: string
  businessName: string
  businessType: string
  description?: string
  accent: string
  logoUrl?: string | null
  showSlotlyFooter: boolean
  services: {
    id: string
    name: string
    duration_minutes: number
    price_pence: number | null
  }[]
}

export default function PagePreview({
  slug, businessName, businessType, description, accent, logoUrl,
  showSlotlyFooter, services,
}: PagePreviewProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-green-400" />
        </div>
        <div className="mx-auto flex min-w-0 w-full max-w-sm items-center gap-2 rounded-md border bg-background px-3 py-1 text-xs text-muted-foreground">
          <Lock aria-hidden="true" className="size-3 shrink-0" />
          <span className="truncate">/book/{slug}</span>
        </div>
      </div>

      <div className="bg-slate-50 px-5 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-md">
          <div className="border-b border-slate-200 pb-6 text-center">
            {logoUrl && (
              <Image src={logoUrl} alt={`${businessName} logo preview`} width={80} height={80} unoptimized
                className="mx-auto mb-4 size-20 rounded-full border border-slate-200 bg-white object-cover" />
            )}
            <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Book an appointment</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: accent }}>{businessName}</h2>
            {businessType && <p className="mt-1 text-xs capitalize text-slate-500">{businessType}</p>}
            {description && <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">{description}</p>}
          </div>

          <p className="mt-6 text-sm font-semibold text-slate-950">Select a service</p>
          <p className="mt-0.5 text-xs text-slate-500">Choose the appointment you would like to book.</p>
          <div className="mt-3 space-y-2.5">
            {services.length ? services.slice(0, 3).map((service) => (
              <div key={service.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xs">
                <div className="min-w-0">
                  <span className="block truncate font-semibold text-slate-900">{service.name}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="size-3" aria-hidden="true" />{service.duration_minutes} min
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold text-slate-950">{service.price_pence === null ? 'Free' : `£${(service.price_pence / 100).toFixed(2)}`}</span>
                  <ChevronRight aria-hidden="true" className="size-3.5 text-slate-400" />
                </div>
              </div>
            )) : <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">No services added yet.</div>}
          </div>
          {showSlotlyFooter && <p className="mt-8 text-center text-xs text-slate-500">Powered by Slotly</p>}
        </div>
      </div>
    </div>
  )
}
