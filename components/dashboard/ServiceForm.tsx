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
import { Label } from '@/components/ui/label'
import { useToast } from '../ui/toast'

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]

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
  service?: FormValues & { id: string }
  onSuccess: () => void
}

export default function ServiceForm({ bookingPageId, service, onSuccess }: Props) {
  const { toast } = useToast()
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

  const onSubmit = async (data: FormValues) => {
  const formData = new FormData()

  formData.append('name', data.name)
  formData.append('duration_minutes', data.duration_minutes.toString())
  formData.append('price', data.price ?? '')
  formData.append('description', data.description ?? '')
  formData.append('booking_page_id', bookingPageId)

  if (service) {
    formData.append('service_id', service.id)
  }

  try {
    const result = service
      ? await updateService(formData)
      : await createService(formData)

    if (result?.error) {
      toast({
        title: service ? 'Could not save service' : 'Could not add service',
        description: result.error,
        variant: 'error',
      })
      return
    }

    toast({
      title: service ? 'Service updated' : 'Service added',
      description: service
        ? `${data.name} has been updated.`
        : `${data.name} is now available to book.`,
    })
    onSuccess()
  } catch {
    toast({
      title: service ? 'Could not save service' : 'Could not add service',
      description: 'Something went wrong. Please try again.',
      variant: 'error',
    })
  }
}

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 p-6">

  <div className="grid gap-2">
    <Label htmlFor="name">
      Service Name
    </Label>

    <Input
      id="name"
      placeholder="e.g. Haircut"
      className="h-10"
      aria-invalid={Boolean(errors.name)}
      {...register('name')} 
    />

    {errors.name && (
      <p className="text-xs text-destructive">
        {errors.name.message}
      </p>
    )}
  </div>


  <div className="grid gap-2">
    <Label htmlFor="service-duration">
      Duration
    </Label>

    <Controller
      name="duration_minutes"
      control={control}
      render={({ field }) => (
        <Select
          value={field.value?.toString()}
          onValueChange={(value) => field.onChange(Number(value))}
        >
          <SelectTrigger id="service-duration" className="h-10 w-full">
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
      <p className="text-xs text-destructive">
        {errors.duration_minutes.message}
      </p>
    )}
  </div>


  <div className="grid gap-2">
    <Label htmlFor="price">
      Price
    </Label>

    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        £
      </span>

      <Input
        id="price"
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        placeholder="Optional"
        className="h-10 pl-7"
        aria-invalid={Boolean(errors.price)}
        {...register('price')}
      />
    </div>

    {errors.price && (
      <p className="text-xs text-destructive">
        {errors.price.message}
      </p>
    )}
  </div>


  <div className="grid gap-2">
    <Label htmlFor="description">
      Description
    </Label>

    <Textarea
      id="description"
      placeholder="Optional description"
      className="min-h-24 resize-none"
      aria-invalid={Boolean(errors.description)}
      {...register('description')}
    />

    {errors.description && (
      <p className="text-xs text-destructive">
        {errors.description.message}
      </p>
    )}
  </div>


  <Button type="submit" size="lg" className="mt-1" disabled={isSubmitting}>
    {isSubmitting ? 'Saving…' : service ? 'Save changes' : 'Create service'}
  </Button>

</form>
  )
}
