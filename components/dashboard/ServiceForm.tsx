/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createService } from '@/app/(dashboard)/services/actions'
import { updateService } from '@/app/(dashboard)/services/actions'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]

// TODO: Zod schema with these fields:
// - name: required string
// - duration_minutes: number (hint: z.coerce.number() — because selects return strings)
// - price: optional string (you'll convert to pence in the action)
// - description: optional string, max 200 chars
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Service name is required'),

  duration_minutes: z.coerce
    .number()
    .int()
    .positive(),

  price: z
    .string()
    .optional()
    .refine(
      value =>
        !value ||
        (!Number.isNaN(Number(value)) && Number(value) >= 0),
      {
        message: 'Price must be a positive number',
      }
    ),

  description: z
    .string()
    .max(200, 'Max 200 characters')
    .optional(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  bookingPageId: string
  service?: FormValues & { id: string }  // if passed, we're editing not creating
  onSuccess: () => void                  // called after save to close the Sheet
}

export default function ServiceForm({ bookingPageId, service, onSuccess }: Props) {
  // TODO: useForm with zodResolver
  const {
  register,
  control,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<FormValues, unknown, FormValues>({
  resolver: zodResolver(schema),
  defaultValues: {
    name: service?.name ?? '',
    duration_minutes: service?.duration_minutes ?? 30,
    price: service?.price ?? '',
    description: service?.description ?? '',
  },
})

  // TODO: if service is passed, set defaultValues from it
  //       (this is how the same form works for both add and edit)
  const onSubmit = async (data: FormValues) => {
    // TODO: build FormData
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('duration_minutes', data.duration_minutes.toString())
    formData.append('price', data.price ?? '')
    formData.append('description', data.description ?? '')
    // TODO: append bookingPageId
    formData.append('booking_page_id', bookingPageId)
    // TODO: if service exists, call updateService — otherwise call createService
        const result = service
          ? await updateService(formData)
          : await createService(formData)

        if (!result?.error) {
          onSuccess()
}
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 p-4">

  {/* Name */}
  <div className="grid gap-2">
    <label htmlFor="name" className="text-sm font-medium">
      Service Name
    </label>

    <Input 
      id="name"
      placeholder="e.g. Haircut"
      {...register('name')} 
    />

    {errors.name && (
      <p className="text-sm text-red-500">
        {errors.name.message}
      </p>
    )}
  </div>


  {/* Duration */}
  <div className="grid gap-2">
    <label className="text-sm font-medium">
      Duration
    </label>

    <Controller
      name="duration_minutes"
      control={control}
      render={({ field }) => (
        <Select
          value={field.value?.toString()}
          onValueChange={(value) => field.onChange(Number(value))}
        >
          <SelectTrigger className="w-full max-w-48">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>

          <SelectContent>
            <SelectGroup>
              <SelectLabel>Durations</SelectLabel>

              {DURATION_OPTIONS.map((option) => (
                <SelectItem 
                  key={option} 
                  value={option.toString()}
                >
                  {option} minutes
                </SelectItem>
              ))}

            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    />

    {errors.duration_minutes && (
      <p className="text-sm text-red-500">
        {errors.duration_minutes.message}
      </p>
    )}
  </div>


  {/* Price */}
  <div className="grid gap-2">
    <label htmlFor="price" className="text-sm font-medium">
      Price
    </label>

    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        £
      </span>

      <Input
        id="price"
        type="text"
        placeholder="Optional"
        className="pl-7"
        {...register('price')}
      />
    </div>

    {errors.price && (
      <p className="text-sm text-red-500">
        {errors.price.message}
      </p>
    )}
  </div>


  {/* Description */}
  <div className="grid gap-2">
    <label htmlFor="description" className="text-sm font-medium">
      Description
    </label>

    <Textarea
      id="description"
      placeholder="Optional description"
      {...register('description')}
    />

    {errors.description && (
      <p className="text-sm text-red-500">
        {errors.description.message}
      </p>
    )}
  </div>


  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Saving...' : 'Save'}
  </Button>

</form>
  )
}