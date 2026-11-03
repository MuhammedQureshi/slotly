import AvailabilityEditor, { type DayRule } from '@/components/dashboard/AvailabilityEditor'
import MyPageForm from '@/components/dashboard/MyPageForm'
import PagePreview from '@/components/dashboard/PagePreview'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { ExternalLink, LockKeyhole, QrCode } from 'lucide-react'
import BrandingForm from './BrandingForm'
import { getEntitlements } from '@/lib/plans'
import { bookingAccent } from '@/lib/branding'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
    .select('id, plan')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (!user) {
    return <div>User not found.</div>
  }

  const { data: bookingPage } = await supabase
    .from('booking_pages')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

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

  const [{ data: services }, { data: availabilityRules }] = await Promise.all([
    supabase
      .from('services')
      .select('*')
      .eq('booking_page_id', bookingPage.id)
      .order('sort_order'),
    supabase
      .from('availability_rules')
      .select('day_of_week, is_active, start_time, end_time, break_start, break_end')
      .eq('booking_page_id', bookingPage.id)
      .order('day_of_week'),
  ])


  const entitlements = getEntitlements(user.plan)
  const accent = bookingAccent(bookingPage.accent_color, entitlements.customBranding)
  const logoUrl = entitlements.customBranding
    ? bookingPage.logo_path
      ? supabase.storage.from('booking-logos').getPublicUrl(bookingPage.logo_path).data.publicUrl
      : typeof bookingPage.logo_url === 'string' && bookingPage.logo_url.startsWith('https://')
        ? bookingPage.logo_url : null
    : null
  const preview = {
    slug: bookingPage.slug,
    businessName: bookingPage.business_name,
    businessType: bookingPage.business_type,
    description: bookingPage.description ?? '',
    accent,
    logoUrl,
    showSlotlyFooter: !entitlements.customBranding,
    services: services ?? [],
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-amber-700 uppercase">Online presence</p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">My Page</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">Make your booking page your own and set the hours customers can book.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/book/${bookingPage.slug}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            View live page <ExternalLink aria-hidden="true" className="size-4" />
          </a>
          {entitlements.qrCode && <a href="/api/booking-qr" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Download QR <QrCode aria-hidden="true" className="size-4" />
          </a>}
        </div>
      </div>

      <Tabs defaultValue="appearance" className="gap-6">
        <TabsList aria-label="Booking page settings" className="h-10">
          <TabsTrigger value="appearance" className="px-4">Appearance</TabsTrigger>
          <TabsTrigger value="availability" className="px-4">Availability</TabsTrigger>
        </TabsList>
        <TabsContent value="appearance">
          {entitlements.customBranding
            ? <BrandingForm initialColor={accent} initialLogoUrl={logoUrl} preview={preview} />
            : <div className="grid items-start gap-6 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><LockKeyhole aria-hidden="true" className="size-4" /> Custom branding</CardTitle>
                  <CardDescription>Add your logo and colours and remove the Slotly footer with Pro.</CardDescription>
                </CardHeader>
                <CardContent>
                  <a href="/billing" className={buttonVariants({ size: 'lg' })}>View Pro plan</a>
                </CardContent>
              </Card>
              <div className="min-w-0 space-y-3">
                <div>
                  <h2 className="text-sm font-semibold">Customer preview</h2>
                  <p className="mt-1 text-sm text-muted-foreground">This is how your page looks to visitors.</p>
                </div>
                <PagePreview {...preview} />
              </div>
            </div>}
        </TabsContent>
        <TabsContent value="availability" className="max-w-3xl">
          <AvailabilityEditor bookingPageId={bookingPage.id} initialRules={(availabilityRules ?? []) as DayRule[]} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
