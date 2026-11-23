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
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import ServiceForm from './ServiceForm'
import { Clock, Pencil, Scissors, Trash2 } from 'lucide-react'
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
    <Card className="h-full gap-0 py-0">
      <CardContent className="flex flex-1 gap-4 p-5 sm:p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><Scissors aria-hidden="true" className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3"><h2 className="truncate text-lg font-bold text-foreground">{service.name}</h2><span className="shrink-0 text-base font-bold tabular-nums">{formattedPrice}</span></div>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><Clock aria-hidden="true" className="size-4" />{service.duration_minutes} minutes</p>
          {service.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{service.description}</p>}
        </div>
      </CardContent>

      <CardFooter className="mt-auto gap-2 bg-card px-5 py-3 sm:px-6">
        <Button
          variant="outline"
          className="flex-1 border-border"
          onClick={() => setIsEditOpen(true)}
        >
          <Pencil aria-hidden="true" />
          Edit
        </Button>

          <Sheet
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
          >
            <SheetContent className="owner-app sm:max-w-lg">
              <SheetHeader className="border-b border-border px-6 py-5">
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

            <DialogContent className="owner-app">
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
      </CardFooter>
    </Card>
  )
}
