'use client'

// 'use client' is required because this component uses browser interactivity
// (form state, button clicks). Server components can't do that.

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { saveBookingPage } from './actions'

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
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-semibold mb-1">Set up your booking page</h1>
      <p className="text-gray-500 text-sm mb-6">
        This creates your public page at <span className="font-mono">/book/your-slug</span>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Business name *</label>
          <input
            {...register('business_name')}
            placeholder="Jay's Barbershop"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          {/* errors.business_name comes from Zod if the field is empty */}
          {errors.business_name && (
            <p className="text-red-500 text-xs mt-1">{errors.business_name.message}</p>
          )}
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Business type *</label>
          <select
            {...register('business_type')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
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
          <label className="block text-sm font-medium mb-1">Phone <span className="text-gray-400">(optional)</span></label>
          <input
            {...register('phone')}
            placeholder="+44 7700 900000"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Description (optional, max 200 chars) */}
        <div>
          <label className="block text-sm font-medium mb-1">Description <span className="text-gray-400">(optional)</span></label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Tell customers a little about your business..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
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
          className="w-full bg-black text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition"
        >
          {isSubmitting ? 'Saving...' : 'Create my booking page →'}
        </button>

      </form>
    </div>
  )
}