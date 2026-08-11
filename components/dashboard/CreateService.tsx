'use client'

import { useState } from 'react'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

import { Button } from '@/components/ui/button'
import ServiceForm from './ServiceForm'
import { CirclePlus } from 'lucide-react'

type Props = {
  bookingPageId: string
}

export default function CreateServiceSheet({
  bookingPageId,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button size="lg" className="w-fit justify-center">
            Add Service
            <CirclePlus className="ml-2 h-4 w-4" />
          </Button>
        }
      />

      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create Service</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <ServiceForm
            bookingPageId={bookingPageId}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}