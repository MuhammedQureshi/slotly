import Link from 'next/link'
import { CalendarDays, CreditCard, Globe } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Settings() {
  return (
    <div className="space-y-6">
      <header className="border-b pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage the parts of Slotly you use every day.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { icon: Globe, title: 'Booking page', description: 'Update your logo, colours and public page.', href: '/my-page', action: 'Edit page' },
          { icon: CalendarDays, title: 'Availability', description: 'Set working hours and breaks on your booking page.', href: '/my-page?tab=availability', action: 'Set availability' },
          { icon: CreditCard, title: 'Billing', description: 'View your plan and manage your subscription.', href: '/billing', action: 'View billing' },
        ].map(({ icon: Icon, title, description, href, action }) => <Card key={title}>
          <CardHeader><Icon aria-hidden="true" className="size-5 text-muted-foreground" />
            <CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
          <CardContent><Link href={href} className={buttonVariants({ variant: 'outline' })}>{action}</Link></CardContent>
        </Card>)}
      </div>
    </div>
  )
}
