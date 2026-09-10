'use client'

// 'use client' is required because this component uses browser interactivity
// (form state, button clicks). Server components can't do that.

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { saveBookingPage } from '@/app/(dashboard)/my-page/actions'

// --- Zod schema ---
// This is your single source of truth for validation rules.
// Zod checks the data BEFORE it reaches your server action.
const schema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  business_type: z.string().min(1, 'Please select a business type'),
  phone: z.string().optional(),
  description: z.string().max(200, 'Max 200 characters').optional(),
  timezone: z.string(),
})

// TypeScript type inferred automatically from the schema above
type FormValues = z.infer<typeof schema>

// Values must match the CHECK constraint in your Supabase schema:
// CHECK (business_type IN ('barber','tutor','cleaner','trainer','nail','other'))
const BUSINESS_TYPES = [
  { value: 'barber',  label: 'Barbershop / Hair Salon' },
  { value: 'tutor',   label: 'Tutor / Teacher' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'trainer', label: 'Personal Trainer' },
  { value: 'nail',    label: 'Nail Salon' },
  { value: 'other',   label: 'Other' },
]

export default function MyPageForm() {
  const [serverError, setServerError] = useState<string | null>(null)

  // useForm wires up all the form state management for you.
  // zodResolver connects your Zod schema so validation runs automatically.
  const {
    register,       // connects each input to the form
    handleSubmit,   // wraps your submit handler with validation
    formState: { errors, isSubmitting }, // errors from Zod, isSubmitting = true while action runs
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      timezone: 'Europe/London',
    },
  })

  // handleSubmit only calls this function if Zod validation passes
  const onSubmit = async (data: FormValues) => {
    setServerError(null)

    // FormData is what Next.js server actions expect
    const formData = new FormData()
    formData.append('business_name', data.business_name)
    formData.append('business_type', data.business_type)
    formData.append('phone', data.phone ?? '')
    formData.append('description', data.description ?? '')
    formData.append('timezone', data.timezone)

    const result = await saveBookingPage(formData)

    // If the action returned an error (instead of redirecting), show it
    if (result?.error) {
      setServerError(result.error)
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight text-stone-950">Set up your booking page</h2>
      <p className="mb-7 mt-2 text-sm leading-6 text-stone-600">
        This creates your public page at <span className="font-mono">/book/your-slug</span>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Business Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-800">Business name *</label>
          <input
            {...register('business_name')}
            placeholder="Jay's Barbershop"
            className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none transition focus:border-stone-400 focus:ring-3 focus:ring-stone-200"
          />
          {/* errors.business_name comes from Zod if the field is empty */}
          {errors.business_name && (
            <p className="text-red-500 text-xs mt-1">{errors.business_name.message}</p>
          )}
        </div>

        {/* Business Type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-800">Business type *</label>
          <select
            {...register('business_type')}
            className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-stone-400 focus:ring-3 focus:ring-stone-200"
          >
            <option value="">Select a type...</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {errors.business_type && (
            <p className="text-red-500 text-xs mt-1">{errors.business_type.message}</p>
          )}
        </div>

        {/* Phone (optional) */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-800">Phone <span className="font-normal text-stone-400">(optional)</span></label>
          <input
            {...register('phone')}
            placeholder="+44 7700 900000"
            className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none transition focus:border-stone-400 focus:ring-3 focus:ring-stone-200"
          />
        </div>

        {/* Description (optional, max 200 chars) */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-800">Description <span className="font-normal text-stone-400">(optional)</span></label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Tell customers a little about your business..."
            className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition focus:border-stone-400 focus:ring-3 focus:ring-stone-200"
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Timezone (hidden — defaulted to Europe/London, you can make this a select later) */}
        <input type="hidden" {...register('timezone')} />

        {/* Server-side error (e.g. Supabase failed) */}
        {serverError && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 w-full rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Create my booking page →'}
        </button>

      </form>
    </div>
  )
}
