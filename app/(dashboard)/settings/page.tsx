import Link from 'next/link'
import { CalendarDays, CreditCard, Globe } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'

export default function Settings() {
  return (
    <div className="space-y-6">
      <header className="border-b pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage the parts of Slotly you use every day.</p>
      </header>
      <div className="max-w-4xl space-y-3">
        {[
          { icon: Globe, title: 'Booking page', description: 'Update your logo, colours and public page.', href: '/my-page', action: 'Edit page' },
          { icon: CalendarDays, title: 'Availability', description: 'Set working hours and breaks on your booking page.', href: '/my-page?tab=availability', action: 'Set availability' },
          { icon: CreditCard, title: 'Billing', description: 'View your plan and manage your subscription.', href: '/billing', action: 'View billing' },
        ].map(({ icon: Icon, title, description, href, action }) => <Card key={title} className="gap-0 py-0">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><Icon aria-hidden="true" className="size-5" /></span><div><CardTitle className="text-base">{title}</CardTitle><CardDescription className="mt-1">{description}</CardDescription></div></div>
            <Link href={href} className={buttonVariants({ variant: 'outline', className: 'shrink-0 rounded-xl' })}>{action}</Link>
          </CardContent>
        </Card>)}
      </div>
    </div>
  )
}
