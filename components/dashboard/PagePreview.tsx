'use client'
import { Clock, Lock } from 'lucide-react'
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
    duration: number
    priceType: 'fixed' | 'free' | 'ask'
    price?: number
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
    <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
      {/* Fake browser bar */}
      <div className="flex items-center gap-3 border-b border-border bg-[#f9fafb] px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>

        <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span className="truncate">slotly.co/{slug}</span>
        </div>
      </div>

      <div className="bg-background p-6">
        <div className="mx-auto max-w-md rounded-[10px] border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {initials}
            </span>

            <div>
              <p className="text-lg font-bold leading-tight">
                {businessName || 'Your business'}
              </p>

              <span className="mt-0.5 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {businessType}
              </span>
            </div>
          </div>

          {tagline && (
            <p className="mt-3 text-sm italic text-muted-foreground">
              {tagline}
            </p>
          )}

          {description && (
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              {description}
            </p>
          )}

          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Choose a service
          </p>

          <div className="mt-2 space-y-2">
            {services.length > 0 ? (
              services.slice(0, 3).map((service, index) => (
                <div
                  key={service.id}
                  className={`flex items-center justify-between rounded-md border p-3 text-sm ${
                    index === 0
                      ? 'border-l-[3px] bg-(--accent)/40'
                      : 'border-border bg-card'
                  }`}
                  style={
                    index === 0
                      ? { borderLeftColor: accent }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {service.name}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {service.duration} min
                    </span>
                  </div>

                  <span className="font-semibold">
                    {service.priceType === 'fixed'
                      ? `£${service.price}`
                      : service.priceType === 'free'
                      ? 'Free'
                      : 'Ask'}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                No services added yet.
              </div>
            )}
          </div>

          <button
            type="button"
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-sm font-medium text-white"
            style={{ background: accent }}
          >
            Confirm booking
          </button>
        </div>
      </div>
    </div>
  </div>
)
}
