'use client'

import { useState } from 'react'
import { deleteService } from '@/app/(dashboard)/services/actions'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import ServiceForm from './ServiceForm'
import { Clock, Pencil, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

type Service = {
  id: string
  name: string
  booking_page_id: string
  duration_minutes: number
  price_pence: number | null
  description: string | null
}

export default function ServiceCard({
  service,
}: {
  service: Service
}) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    const formData = new FormData()
    formData.append('service_id', service.id)

    try {
      const result = await deleteService(formData)

      if (result?.error) {
        toast({
          title: 'Could not delete service',
          description: result.error,
          variant: 'error',
        })
        return
      }

      setIsDeleteOpen(false)
      toast({
        title: 'Service deleted',
        description: `${service.name} was removed from your booking page.`,
      })
    } catch {
      toast({
        title: 'Could not delete service',
        description: 'Something went wrong. Please try again.',
        variant: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const formattedPrice =
    service.price_pence === null
      ? 'Free'
      : `£${(service.price_pence / 100).toFixed(2)}`

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <div className="flex flex-1 items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight text-stone-950">
            {service.name}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
              <Clock aria-hidden="true" className="size-3.5" />
              {service.duration_minutes} min
            </span>

            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              {formattedPrice}
            </span>
          </div>

          {service.description && (
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-stone-600">
              {service.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-stone-100 pt-4">
        <Button
          variant="outline"
          className="flex-1 border-stone-200"
          onClick={() => setIsEditOpen(true)}
        >
          <Pencil aria-hidden="true" />
          Edit
        </Button>

          <Sheet
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
          >
            <SheetContent className="sm:max-w-lg">
              <SheetHeader className="border-b border-stone-200 px-6 py-5">
                <SheetTitle className="text-lg font-semibold">
                  Edit {service.name}
                </SheetTitle>
              </SheetHeader>

              <div className="overflow-y-auto">
                <ServiceForm
                  bookingPageId={service.booking_page_id}
                  service={{
                    id: service.id,
                    name: service.name,
                    duration_minutes:
                      service.duration_minutes,
                    price: service.price_pence !== null
                      ? (
                          service.price_pence / 100
                        ).toString()
                      : '',
                    description:
                      service.description ?? '',
                  }}
                  onSuccess={() =>
                    setIsEditOpen(false)
                  }
                />
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </Button>

          <Dialog
              open={isDeleteOpen}
              onOpenChange={setIsDeleteOpen}
          >

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Delete Service?
                </DialogTitle>
              </DialogHeader>

              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete{' '}
                <strong>{service.name}</strong>?
                This action cannot be undone.
              </p>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() =>
                    setIsDeleteOpen(false)
                  }
                >
                  Cancel
                </Button>

                <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>
    </article>
  )
}
