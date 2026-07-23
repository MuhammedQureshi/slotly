import CreateServiceSheet from '@/components/dashboard/CreateService'
import ServiceCard from '@/components/dashboard/ServiceCard'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

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
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Services</h2>
      <p className="text-muted-foreground">
        These are the services that your customers can book.
      </p> 
      <CreateServiceSheet bookingPageId={bookingPage.id} />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {services?.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
        />
      ))}
    </div>
    </div>
  )
}