import AvailabilityEditor from '@/components/dashboard/AvailabilityEditor'
import MyPageForm from '@/components/dashboard/MyPageForm'
import PagePreview from '@/components/dashboard/PagePreview'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { ExternalLink } from 'lucide-react'

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
    return (
      <div className="space-y-8">
        <div className="border-b border-stone-200 pb-6">
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-amber-700 uppercase">Online presence</p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">My Page</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">Create the public page your customers will use to book.</p>
        </div>
        <MyPageForm />
      </div>
    )
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
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-amber-700 uppercase">Online presence</p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">My Page</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">Preview your booking page and choose when customers can book.</p>
        </div>
        <a
          href={`/book/${bookingPage.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
        >
          View live page
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <div>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-stone-950">Customer preview</h2>
            <p className="mt-1 text-sm text-stone-600">This is how your page looks to visitors.</p>
          </div>
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
          accent="#0c0a09"
          services={services ?? []}
          />
        </div>
        <AvailabilityEditor bookingPageId={bookingPage.id} />
      </div>
    </div>
  )
}
