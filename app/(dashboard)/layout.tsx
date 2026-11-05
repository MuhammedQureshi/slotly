import { currentUser } from '@clerk/nextjs/server'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { buttonVariants } from '@/components/ui/button'
import { ToastProvider } from '@/components/ui/toast'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()

  return <ToastProvider>
    <div className="flex h-dvh flex-col overflow-hidden bg-secondary/30 md:flex-row">
      <Sidebar userName={user?.firstName} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="hidden h-14 shrink-0 items-center border-b border-border bg-background px-5 md:flex">
          <Link href="/bookings" className="flex h-8 w-64 items-center gap-2 rounded-lg bg-secondary px-3 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <Search aria-hidden="true" className="size-3.5" />
            Search appointments
            <kbd className="ml-auto rounded bg-background px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </Link>
          <Link href="/bookings" className={buttonVariants({ size: 'sm', className: 'ml-auto rounded-full px-3' })}>
            <Plus aria-hidden="true" className="size-3.5" /> New booking
          </Link>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  </ToastProvider>
}
