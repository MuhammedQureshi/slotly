import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { Bell, Plus } from 'lucide-react'
import Link from 'next/link'

import { DashboardSearch } from '@/components/dashboard/DashboardSearch'
import { LiveBookingsRefresh } from '@/components/dashboard/LiveBookingsRefresh'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { buttonVariants } from '@/components/ui/button'
import { ToastProvider } from '@/components/ui/toast'
import { getUpcomingBookingCount } from '@/lib/dashboard'
import { getBookingVersion } from '@/lib/booking-version'
import { supabaseAdmin } from '@/lib/supabase'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  let bookingCount = 0
  let bookingVersion = '0::0:'
  if (user) {
    const { data: appUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', user.id)
      .maybeSingle()
    if (appUser) {
      try {
        const [count, version] = await Promise.all([
          getUpcomingBookingCount(appUser.id), getBookingVersion(appUser.id),
        ])
        bookingCount = count
        bookingVersion = version
      } catch {
        bookingCount = 0
      }
    }
  }

  return <ToastProvider>
    <LiveBookingsRefresh initialVersion={bookingVersion} />
    <div className="flex h-dvh flex-col overflow-hidden bg-secondary/30 md:flex-row">
      <Sidebar userName={user?.firstName} bookingCount={bookingCount} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="hidden h-16 shrink-0 items-center border-b border-border bg-background px-6 md:flex">
          <DashboardSearch />
          <Link href="/bookings?new=true" className={buttonVariants({ className: 'ml-auto rounded-full px-4' })}>
            <Plus aria-hidden="true" className="size-4" /> New booking
          </Link>
          <Link href="/bookings?view=day" aria-label="View today's bookings" className="ml-2 grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Bell aria-hidden="true" className="size-4" />
          </Link>
          <div className="ml-1.5"><UserButton /></div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  </ToastProvider>
}
