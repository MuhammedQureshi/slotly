import MyPageForm from '@/components/dashboard/MyPageForm'
import PagePreview from '@/components/dashboard/PagePreview'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}


export default async function Mypage() {
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
    .select('*')
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
    <div className="grid gap-8 lg:grid-cols-2">
      <MyPageForm />
      <PagePreview 
      slug={bookingPage.slug}
          initials={bookingPage.business_name
            .split(' ')
            .map((word: string) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
          businessName={bookingPage.business_name}
          businessType={bookingPage.business_type}
          description={bookingPage.description ?? ''}
          accent="#000"
          services={services ?? []}
      />
    </div>
  )
}
