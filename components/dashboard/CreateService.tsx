'use client'

import { useState } from 'react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
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
          <Button size="lg" className="w-fit justify-center bg-stone-950 px-4 hover:bg-stone-800">
            <CirclePlus aria-hidden="true" className="size-4" />
            Add service
          </Button>
        }
      />

      <SheetContent className="sm:max-w-lg">
        <SheetHeader className="border-b border-stone-200 px-6 py-5">
          <SheetTitle className="text-lg font-semibold">Create service</SheetTitle>
          <SheetDescription>Add a bookable option to your public page.</SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto">
          <ServiceForm
            bookingPageId={bookingPageId}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
