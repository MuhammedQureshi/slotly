import { LockKeyhole } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value?: string | number
  description?: string
  icon: LucideIcon
  locked?: boolean
}

export default function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  locked = false,
}: Props) {
  return (
    <article className="relative min-h-38 overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      {locked ? (
        <>
          <div aria-hidden="true" className="pointer-events-none select-none blur-[3px]">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-stone-600">{label}</p>
              <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-stone-950">
              £1,248.00
            </p>
            <p className="mt-2 text-sm text-stone-500">This month</p>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 px-5 text-center">
            <span className="grid size-9 place-items-center rounded-full bg-stone-950 text-white shadow-sm">
              <LockKeyhole aria-hidden="true" className="size-4" />
            </span>
            <p className="mt-2 text-sm font-semibold text-stone-950">Pro feature</p>
            <p className="mt-1 text-xs text-stone-600">Upgrade to view revenue</p>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-stone-600">{label}</p>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <Icon aria-hidden="true" className="size-4" />
            </span>
          </div>
          <p className="mt-5 text-3xl font-semibold tracking-tight text-stone-950">
            {value ?? 0}
          </p>
          {description ? (
            <p className="mt-2 text-sm text-stone-500">{description}</p>
          ) : null}
        </>
      )}
    </article>
  )
}
