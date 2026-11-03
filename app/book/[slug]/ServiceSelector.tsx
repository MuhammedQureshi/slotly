import { ChevronRight, Clock } from "lucide-react"
import { Button } from '@/components/ui/button'

type Service = {
  id: string
  name: string
  duration_minutes: number
  price_pence: number | null
}


export default function ServiceSelector({ services, onSelect }: { services: Service[], onSelect: (service: Service) => void }) {
  return (
    <div>
      <div className="mb-5">
        <h2 id="services-heading" className="text-xl font-semibold tracking-tight text-slate-950">
          Select a service
        </h2>
        <p className="mt-1 text-sm text-slate-600">Choose the appointment you would like to book.</p>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <Button
            key={service.id}
            type="button"
            variant="outline"
            onClick={() => onSelect(service)}
            className="group h-auto w-full items-center gap-4 whitespace-normal p-5 text-left sm:p-6"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-slate-950 sm:text-lg">
                {service.name}
              </span>
              <span className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                <Clock aria-hidden="true" className="size-4" />
                {service.duration_minutes} min
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-3">
              <span className="text-base font-semibold tabular-nums text-slate-950">
                {service.price_pence === null || service.price_pence === 0
                  ? 'Free'
                  : `£${(service.price_pence / 100).toFixed(2)}`}
              </span>
              <span className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                <ChevronRight aria-hidden="true" className="size-4" />
              </span>
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}
