import CreateServiceSheet from '@/components/dashboard/CreateService'
import ServiceCard from '@/components/dashboard/ServiceCard'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { Scissors } from 'lucide-react'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function Services() {
  const { userId: clerkUserId } = await auth()

if (!clerkUserId) {
  return <div>Please sign in.</div>
}

const supabase = getSupabase()

const { data: user } = await supabase
  .from('users')
  .select('id')
  .eq('clerk_user_id', clerkUserId)
  .single()

if (!user) {
  return <div>User not found.</div>
}

const { data: bookingPage } = await supabase
  .from('booking_pages')
  .select('id')
  .eq('user_id', user.id)
  .single()

if (!bookingPage) {
  return <div>No booking page found.</div>
}

const { data: services } = await supabase
  .from('services')
  .select('*')
  .eq('booking_page_id', bookingPage.id)
  .order('sort_order')

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-amber-700 uppercase">
            Booking menu
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Services</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            These are the services that your customers can book.
          </p>
        </div>
        <CreateServiceSheet bookingPageId={bookingPage.id} />
      </div>

      {services && services.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
          />
          ))}
        </div>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-amber-50 text-amber-700">
            <Scissors aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-stone-950">Add your first service</h2>
          <p className="mt-1 max-w-sm text-sm leading-6 text-stone-600">
            Create a service with a duration and price so customers can start booking.
          </p>
          <div className="mt-5">
            <CreateServiceSheet bookingPageId={bookingPage.id} />
          </div>
        </div>
      )}
    </div>
  )
}
