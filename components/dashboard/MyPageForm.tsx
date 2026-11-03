'use client'

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight } from 'lucide-react'
import { saveBookingPage } from '@/app/(dashboard)/my-page/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'

const schema = z.object({
  business_name: z.string().trim().min(1, 'Business name is required'),
  business_type: z.string().min(1, 'Choose a business type'),
  phone: z.string().optional(),
  description: z.string().max(200, 'Keep the description under 200 characters').optional(),
  timezone: z.string(),
})
type FormValues = z.infer<typeof schema>

const BUSINESS_TYPES = [
  { value: 'barber', label: 'Barbershop / hair salon' },
  { value: 'tutor', label: 'Tutor / teacher' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'trainer', label: 'Personal trainer' },
  { value: 'nail', label: 'Nail salon' },
  { value: 'other', label: 'Other' },
]

export default function MyPageForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const { toast } = useToast()
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { business_name: '', business_type: '', phone: '', description: '', timezone: 'Europe/London' },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const formData = new FormData()
    for (const [key, value] of Object.entries(values)) formData.set(key, value ?? '')
    const result = await saveBookingPage(formData)
    if (result?.error) {
      setServerError(result.error)
      toast({ title: 'Could not create booking page', description: result.error, variant: 'error' })
    }
  }

  return <Card className="max-w-xl">
    <CardHeader>
      <CardTitle className="text-xl">Set up your booking page</CardTitle>
      <CardDescription>Customers will find it at /book/your-slug.</CardDescription>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field data-invalid={Boolean(errors.business_name)}>
          <FieldLabel htmlFor="business-name">Business name</FieldLabel>
          <Input id="business-name" placeholder="Jay’s Barbershop" aria-invalid={Boolean(errors.business_name)} {...register('business_name')} />
          <FieldError errors={[errors.business_name]} />
        </Field>
        <Field data-invalid={Boolean(errors.business_type)}>
          <FieldLabel htmlFor="business-type">Business type</FieldLabel>
          <Controller name="business_type" control={control} render={({ field }) => <Select value={field.value} onValueChange={(value) => field.onChange(value ?? '')}>
            <SelectTrigger id="business-type" className="w-full" aria-invalid={Boolean(errors.business_type)}>
              <SelectValue placeholder="Choose a type" />
            </SelectTrigger>
            <SelectContent>{BUSINESS_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
          </Select>} />
          <FieldError errors={[errors.business_type]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="business-phone">Phone <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
          <Input id="business-phone" type="tel" autoComplete="tel" placeholder="+44 7700 900000" {...register('phone')} />
        </Field>
        <Field data-invalid={Boolean(errors.description)}>
          <FieldLabel htmlFor="business-description">Description <span className="font-normal text-muted-foreground">(optional)</span></FieldLabel>
          <Textarea id="business-description" rows={3} placeholder="Tell customers about your shop" aria-invalid={Boolean(errors.description)} {...register('description')} />
          <FieldDescription>Shown near the top of your public booking page.</FieldDescription>
          <FieldError errors={[errors.description]} />
        </Field>
        <input type="hidden" {...register('timezone')} />
        {serverError && <FieldError>{serverError}</FieldError>}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating…' : <>Create booking page <ArrowRight aria-hidden="true" /></>}
        </Button>
      </form>
    </CardContent>
  </Card>
}
