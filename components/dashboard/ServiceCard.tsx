'use client'

import { useState } from 'react'
import { deleteService } from '@/app/(dashboard)/services/actions'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import ServiceForm from './ServiceForm'

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

  const handleDelete = async () => {
  const formData = new FormData()
  formData.append('service_id', service.id)

  const result = await deleteService(formData)

  if (!result?.error) {
    setIsDeleteOpen(false)
  }
}
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const formattedPrice =
    service.price_pence === null
      ? 'Free'
      : `£${(service.price_pence / 100).toFixed(2)}`

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="md:flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {service.name}
          </h3>

          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-1 text-xs">
              {service.duration_minutes} min
            </span>

            <span className="rounded-xl bg-muted px-2 py-1 text-xs text-blue-600">
              {formattedPrice}
            </span>
          </div>

          {service.description && (
            <p className="mt-3 text-sm text-muted-foreground">
              {service.description}
            </p>
          )}
        </div>
  
<div className="flex flex-col items-end gap-3">
        <Button
          variant="outline"
          onClick={() => setIsEditOpen(true)}
        >
          Edit
        </Button>

        <div className="flex flex-col items-end gap-2">
          <Sheet
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
          >
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  Edit {service.name}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6">
                <ServiceForm
                  bookingPageId={service.booking_page_id}
                  service={{
                    id: service.id,
                    name: service.name,
                    duration_minutes:
                      service.duration_minutes,
                    price: service.price_pence
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
            onClick={() => setIsDeleteOpen(true)}
          >
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

                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  </div>
  )
}