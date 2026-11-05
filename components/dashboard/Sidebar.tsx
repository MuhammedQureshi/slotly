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
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, group: 'Manage' },
  { label: 'Bookings', href: '/bookings', icon: Calendar, group: 'Manage' },
  { label: 'Customers', href: '/customers', icon: Users, group: 'Manage' },
  { label: 'Statistics', href: '/stats', icon: ChartNoAxesCombined, group: 'Manage' },
  { label: 'Services', href: '/services', icon: Scissors, group: 'Manage' },
  { label: 'My Page', href: '/my-page', icon: Globe, group: 'Workspace' },
  { label: 'Billing', href: '/billing', icon: CreditCard, group: 'Workspace' },
  { label: 'Settings', href: '/settings', icon: Settings, group: 'Workspace' },
]

type NavLinksProps = {
  pathname: string
  showUpgrade: boolean
  onNavigate?: () => void
}

function NavLinks({ pathname, showUpgrade, onNavigate }: NavLinksProps) {
  return (
    <nav className="flex-1 overflow-y-auto p-3" aria-label="Dashboard navigation">
      {['Manage', 'Workspace'].map((group, groupIndex) => <div key={group} className={groupIndex ? 'mt-6' : ''}>
        <p className="mb-2 px-2 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground/70 uppercase">{group}</p>
        <div className="space-y-1">{NAV.filter((item) => item.group === group).map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`)

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
            {href === '/billing' && showUpgrade && (
              <Badge variant="secondary" className="ml-auto bg-accent/10 text-[10px] text-accent">
                Upgrade
              </Badge>
            )}
          </Link>
        )
      })}</div></div>)}
    </nav>
  )
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
      <span className="grid size-7 place-items-center rounded-lg bg-primary font-display text-base text-primary-foreground">S</span>
      Slotly
    </Link>
  )
}

function Account({ userName }: { userName?: string | null }) {
  return (
    <div className="flex items-center border-t border-sidebar-border p-3">
      <UserButton />
      <span className="ml-2.5 truncate text-sm font-medium text-sidebar-foreground">
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
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 md:hidden">
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
                <span className="text-xl font-semibold tracking-tight text-foreground">
                  Slotly
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

      <aside className="hidden w-52 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Brand />
        </div>
        <NavLinks pathname={pathname} showUpgrade={showUpgrade} />
        <Account userName={userName} />
      </aside>
    </>
  )
}
