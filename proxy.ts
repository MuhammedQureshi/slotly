import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const isPublicRoute = createRouteMatcher([
    '/',
    '/pricing',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/book(.*)',
    '/booking-success(.*)',
    '/cancel(.*)',
    '/api/webhooks(.*)',
    '/api/slots(.*)',
    '/api/bookings',
    '/api/cron/reminders',
  ])


export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
    const { userId } = await auth()
    if (userId && !req.nextUrl.pathname.startsWith('/api/') && !req.nextUrl.pathname.startsWith('/__clerk/')) {
      const { data: user } = await supabaseAdmin.from('users').select('id, onboarding_complete')
        .eq('clerk_user_id', userId).maybeSingle()
      // The webhook can arrive after the first authenticated page request.
      const complete = user?.onboarding_complete === true
      const onboarding = req.nextUrl.pathname.startsWith('/onboarding')
      if (!complete && !onboarding) return NextResponse.redirect(new URL('/onboarding', req.url))
      if (complete && onboarding) return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
}
