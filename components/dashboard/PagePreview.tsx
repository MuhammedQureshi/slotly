'use client'
import { ChevronRight, Clock, Lock } from 'lucide-react'
type Props = {
  slug: string
  initials: string
  businessName: string
  businessType: string
  tagline?: string
  description?: string
  accent: string
  services: {
    id: string
    name: string
    duration_minutes: number
    price_pence: number | null
  }[]
}

export default function BookingPagePreview({
  slug,
  initials,
  businessName,
  businessType,
  tagline,
  description,
  accent,
  services,
}: Props) {
  return (
  <div className="min-w-0">
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      {/* Fake browser bar */}
      <div className="flex items-center gap-3 border-b border-stone-200 bg-stone-100/80 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>

        <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-1 text-xs text-stone-500 shadow-xs">
          <Lock className="h-3 w-3" />
          <span className="truncate">slotly.co/{slug}</span>
        </div>
      </div>

      <div className="bg-slate-50 p-4 sm:p-8">
        <div className="mx-auto max-w-md">
          <div className="border-b border-slate-200 pb-6 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ backgroundColor: accent }}>
              {initials}
            </span>

            <div className="mt-3">
              <p className="text-xl font-semibold leading-tight tracking-tight text-slate-950">
                {businessName || 'Your business'}
              </p>

              <span className="mt-2 inline-flex rounded-full bg-slate-200/70 px-2.5 py-1 text-[10px] font-medium text-slate-600 capitalize">
                {businessType}
              </span>
            </div>

          {tagline && (
            <p className="mt-3 text-sm italic text-slate-500">
              {tagline}
            </p>
          )}

          {description && (
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
              {description}
            </p>
          )}
          </div>

          <p className="mt-6 text-sm font-semibold text-slate-950">Select a service</p>
          <p className="mt-0.5 text-xs text-slate-500">Choose the appointment you would like to book.</p>

          <div className="mt-3 space-y-2.5">
            {services.length > 0 ? (
              services.slice(0, 3).map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xs"
                >
                  <div className="min-w-0">
                    <span className="block truncate font-semibold text-slate-900">
                      {service.name}
                    </span>

                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="h-2.5 w-2.5" />
                      {service.duration_minutes} min
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-slate-950">
                      {service.price_pence === null ? 'Free' : `£${(service.price_pence / 100).toFixed(2)}`}
                    </span>
                    <ChevronRight aria-hidden="true" className="size-3.5 text-slate-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                No services added yet.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  </div>
)
}
