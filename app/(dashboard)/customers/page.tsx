import { auth } from '@clerk/nextjs/server'
import { Download, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabaseAdmin } from '@/lib/supabase'

export default async function CustomersPage() {
  const { userId } = await auth()
  if (!userId) return <p>Please sign in.</p>
  const { data: user } = await supabaseAdmin.from('users').select('id, plan, ever_pro')
    .eq('clerk_user_id', userId).maybeSingle()
  if (!user) return <p>Account not found.</p>
  const { data: pages } = await supabaseAdmin.from('booking_pages').select('id').eq('user_id', user.id)
  const ids = (pages ?? []).map((page) => page.id)
  const people = new Map<string, { name: string; email: string; phone: string; count: number }>()
  if (ids.length) {
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabaseAdmin.from('bookings')
        .select('customer_name, customer_email, customer_phone, starts_at')
        .in('booking_page_id', ids).order('starts_at', { ascending: false }).range(offset, offset + 499)
      if (error) return <p>Unable to load customers.</p>
      for (const row of data ?? []) {
        const key = row.customer_email.trim().toLowerCase()
        const person = people.get(key) ?? {
          name: row.customer_name, email: row.customer_email, phone: row.customer_phone || '', count: 0,
        }
        person.count++
        people.set(key, person)
      }
      if ((data ?? []).length < 500) break
    }
  }
  const canSeeHistory = user.plan === 'pro' || user.ever_pro

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-widest text-amber-700 uppercase">Your clients</p>
        <h1 className="text-3xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-2 text-sm text-muted-foreground">People who have booked your barbershop.</p>
      </div>
      <a href="/api/export?kind=customers" className={buttonVariants({ variant: 'outline' })}>
        <Download aria-hidden="true" /> Download CSV
      </a>
    </header>

    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <div><CardTitle>Client directory</CardTitle><CardDescription>{people.size} {people.size === 1 ? 'customer' : 'customers'}</CardDescription></div>
          <UsersRound aria-hidden="true" className="size-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {people.size ? <Table>
          <TableHeader><TableRow>
            <TableHead className="pl-4">Customer</TableHead><TableHead>Email</TableHead>
            <TableHead className="hidden sm:table-cell">Phone</TableHead><TableHead className="pr-4 text-right">Bookings</TableHead>
          </TableRow></TableHeader>
          <TableBody>{[...people.values()].map((person) => <TableRow key={person.email}>
            <TableCell className="pl-4 font-medium">{canSeeHistory
              ? <Link href={`/customers/${encodeURIComponent(person.email)}`} className="underline-offset-4 hover:underline">{person.name}</Link>
              : person.name}</TableCell>
            <TableCell className="text-muted-foreground">{person.email}</TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">{person.phone || '—'}</TableCell>
            <TableCell className="pr-4 text-right"><Badge variant="secondary">{person.count}</Badge></TableCell>
          </TableRow>)}</TableBody>
        </Table> : <div className="py-14 text-center">
          <UsersRound aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No customers yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Customers appear here after their first booking.</p>
        </div>}
      </CardContent>
    </Card>

    {!canSeeHistory && <Card><CardContent className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Appointment history and private notes are available on Pro.</p>
      <Link href="/billing" className={buttonVariants({ variant: 'outline' })}>View plans</Link>
    </CardContent></Card>}
  </div>
}
