'use client'

import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import {
  Calendar,
  CreditCard,
  Globe,
  LayoutDashboard,
  Menu,
  Scissors,
  Settings,
  Users,
  ChartNoAxesCombined,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useUserPlan } from '@/lib/useUserPlan'

const NAV = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bookings', href: '/bookings', icon: Calendar },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Statistics', href: '/stats', icon: ChartNoAxesCombined },
  { label: 'Services', href: '/services', icon: Scissors },
  { label: 'My Page', href: '/my-page', icon: Globe },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Settings', href: '/settings', icon: Settings },
]

type NavLinksProps = {
  pathname: string
  showUpgrade: boolean
  onNavigate?: () => void
}

function NavLinks({ pathname, showUpgrade, onNavigate }: NavLinksProps) {
  return (
    <nav className="flex-1 space-y-1 p-3" aria-label="Dashboard navigation">
      {NAV.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`)

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
            {href === '/billing' && showUpgrade && (
              <Badge variant="secondary" className="ml-auto bg-amber-100 text-[10px] text-amber-800">
                Upgrade
              </Badge>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function Brand() {
  return (
    <Link href="/dashboard" className="text-xl font-bold tracking-tight text-stone-950">
      Slot<span className="text-amber-500">ly</span>
    </Link>
  )
}

function Account({ userName }: { userName?: string | null }) {
  return (
    <div className="flex items-center border-t border-sidebar-border p-4">
      <UserButton />
      <span className="ml-3 truncate text-sm font-medium text-sidebar-foreground">
        {userName || 'Account'}
      </span>
    </div>
  )
}

export function Sidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { isPro, loading } = useUserPlan()
  const showUpgrade = !loading && !isPro

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 md:hidden">
        <Brand />
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="icon" aria-label="Open navigation">
                <Menu aria-hidden="true" className="size-5" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-[min(20rem,85vw)] gap-0 p-0 sm:max-w-xs">
            <SheetHeader className="border-b p-5">
              <SheetTitle>
                <span className="text-xl font-bold tracking-tight text-stone-950">
                  Slot<span className="text-amber-500">ly</span>
                </span>
                <span className="sr-only"> navigation</span>
              </SheetTitle>
            </SheetHeader>
            <NavLinks
              pathname={pathname}
              showUpgrade={showUpgrade}
              onNavigate={() => setIsOpen(false)}
            />
            <Account userName={userName} />
          </SheetContent>
        </Sheet>
      </header>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="border-b border-sidebar-border p-5">
          <Brand />
        </div>
        <NavLinks pathname={pathname} showUpgrade={showUpgrade} />
        <Account userName={userName} />
      </aside>
    </>
  )
}
