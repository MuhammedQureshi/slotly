'use client'
  import Link from 'next/link'
  import { usePathname } from 'next/navigation'
  import { UserButton } from '@clerk/nextjs'
  import { cn } from '@/lib/utils'
  import { LayoutDashboard, Calendar, Scissors, Globe, CreditCard, Settings } from 'lucide-react'
  
  const NAV = [
    { label: 'Overview',  href: '/dashboard',icon: LayoutDashboard },
    { label: 'Bookings',  href: '/bookings', icon: Calendar },
    { label: 'Services',  href: '/services', icon: Scissors },
    { label: 'My Page',   href: '/my-page',  icon: Globe },
    { label: 'Billing',   href: '/billing',  icon: CreditCard },
    { label: 'Settings',  href: '/settings', icon: Settings },
  ]
  export function Sidebar({userName}: any) {
    const pathname = usePathname()
    return (
      <aside className="w-56 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-5 border-b border-stone-200">
          <span className="text-xl font-bold">Slot<span className="text-amber-500">ly</span></span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-amber-50 text-amber-700'
                : 'text-stone-600 hover:bg-stone-50'
            )}>
              <Icon size={15} />{label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center p-4 border-t border-stone-200">
          <UserButton />
          <span className="ml-3 text-sm font-medium">{userName}</span>
        </div>
      </aside>
    )
  }
