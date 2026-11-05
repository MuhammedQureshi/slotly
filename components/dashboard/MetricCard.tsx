import { LockKeyhole } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  label: string
  value?: string | number
  description?: string
  icon: LucideIcon
  locked?: boolean
  lockedDescription?: string
}

export default function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  locked = false,
  lockedDescription = 'Upgrade to view this metric',
}: Props) {
  return (
    <Card className="relative min-h-36 gap-0 bg-background py-5">
      <CardContent>
      {locked ? (
        <>
          <div aria-hidden="true" className="pointer-events-none select-none blur-[3px]">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <span className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
              —
            </p>
            <p className="mt-2 text-sm text-muted-foreground">This month</p>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 px-5 text-center">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <LockKeyhole aria-hidden="true" className="size-4" />
            </span>
            <p className="mt-2 text-sm font-semibold text-foreground">Pro feature</p>
            <p className="mt-1 text-xs text-muted-foreground">{lockedDescription}</p>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
              <Icon aria-hidden="true" className="size-4" />
            </span>
          </div>
          <p className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
            {value ?? 0}
          </p>
          {description ? (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </>
      )}
      </CardContent>
    </Card>
  )
}
