import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CustomerHistory({ params }: { params: Promise<{ email: string }> }) {
  const { userId } = await auth()
  if (!userId) return <p>Please sign in.</p>
  const email = (await params).email
  if (!z.string().email().safeParse(email).success) return <p>Customer not found.</p>
  const { data: user } = await supabaseAdmin.from('users').select('id, plan, ever_pro').eq('clerk_user_id', userId).maybeSingle()
  if (!user) return <p>Account not found.</p>
  if (user.plan !== 'pro' && !user.ever_pro) return <p>Customer appointment history is available on Pro.</p>
  const { data: pages } = await supabaseAdmin.from('booking_pages').select('id').eq('user_id', user.id)
  const ids = (pages ?? []).map((page) => page.id)
  if (!ids.length) return <p>No appointments.</p>
  const { data, error } = await supabaseAdmin.from('bookings')
    .select('id, customer_name, customer_email, starts_at, status, private_notes, service:service_id(name)')
    .in('booking_page_id', ids).ilike('customer_email', email.replace(/[\\%_]/g, '\\$&'))
    .order('starts_at', { ascending: false }).limit(500)
  if (error || !data?.length) return <p>Customer not found.</p>
  return <div className="space-y-6">
    <Link href="/customers" className={buttonVariants({ variant: 'outline', size: 'sm' })}><ArrowLeft aria-hidden="true" /> Customers</Link>
    <header><h1 className="text-3xl font-semibold tracking-tight">{data[0].customer_name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{data[0].customer_email}</p></header>
    <ul className="space-y-3">{data.map((booking) => {
      const service = Array.isArray(booking.service) ? booking.service[0] : booking.service
      return <li key={booking.id}><Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div><CardTitle className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4" /> {service?.name || 'Appointment'}</CardTitle>
              <CardDescription>{new Date(booking.starts_at).toLocaleString('en-GB')}</CardDescription></div>
            <Badge variant="outline" className="capitalize">{booking.status.replaceAll('_', ' ')}</Badge>
          </div>
        </CardHeader>
        {booking.private_notes && <CardContent><p className="text-xs font-medium text-muted-foreground">Private notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{booking.private_notes}</p></CardContent>}
      </Card></li>
    })}</ul>
  </div>
}
