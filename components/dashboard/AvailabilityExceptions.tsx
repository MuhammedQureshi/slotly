'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarOff, Clock3 } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { TimePicker } from '@/components/ui/time-picker'
import {
  removeAvailabilityOverride, removeBlockedDate, saveAvailabilityOverride,
  saveBlockedDateRange, saveChangeCutoff,
} from '@/app/(dashboard)/my-page/actions'

type BlockedDate = { blocked_date: string; reason: string | null }
type Override = {
  date: string
  is_active: boolean
  start_time: string
  end_time: string
  break_start: string | null
  break_end: string | null
}

function messageFor(result: { error?: string; conflicts?: number }, success: string) {
  if (result.error) return result.error
  return result.conflicts
    ? `${success} ${result.conflicts} existing appointment${result.conflicts === 1 ? '' : 's'} conflict; they remain booked.`
    : success
}

export default function AvailabilityExceptions({ pageId, timezone, initialCutoff, blockedDates, overrides }: {
  pageId: string
  timezone: string
  initialCutoff: number
  blockedDates: BlockedDate[]
  overrides: Override[]
}) {
  const router = useRouter()
  const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')
  const [cutoff, setCutoff] = useState(String(initialCutoff))
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [exceptionDate, setExceptionDate] = useState('')
  const [open, setOpen] = useState(true)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [breakStart, setBreakStart] = useState('')
  const [breakEnd, setBreakEnd] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function run(action: () => Promise<{ error?: string; conflicts?: number }>, success: string) {
    setBusy(true)
    setMessage('')
    try {
      const result = await action()
      setMessage(messageFor(result, success))
      if (!result.error) router.refresh()
      return !result.error
    } catch {
      setMessage('Could not save this change. Please try again.')
      return false
    } finally {
      setBusy(false)
    }
  }

  return <div className="space-y-6">
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2"><Clock3 aria-hidden="true" className="size-4" /> Customer change cutoff</CardTitle>
        <CardDescription>Customers can cancel or reschedule online until this many hours before their appointment. You can still manage it yourself.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="change-cutoff">Hours before appointment</Label>
          <Select value={cutoff} onValueChange={(value) => setCutoff(value ?? '12')}>
            <SelectTrigger id="change-cutoff" className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{['0','2','4','12','24','48'].map((hours) =>
              <SelectItem key={hours} value={hours}>{hours === '0' ? 'Until the start' : `${hours} hours before`}</SelectItem>
            )}</SelectContent>
          </Select>
        </div>
        <Button disabled={busy} onClick={() => run(() => saveChangeCutoff(pageId, Number(cutoff)), 'Change cutoff saved.')}>Save cutoff</Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2"><CalendarOff aria-hidden="true" className="size-4" /> Days off and holidays</CardTitle>
        <CardDescription>Block a single day or a date range. Existing appointments remain booked and conflicts are shown after saving.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <DatePicker label="From" value={startDate} onValueChange={(value) => {
            setStartDate(value)
            if (endDate && endDate < value) setEndDate(value)
          }} timezone={timezone} minDate={today} />
          <DatePicker label="To" value={endDate} onValueChange={setEndDate} timezone={timezone} minDate={startDate || today} />
        </div>
        <div className="space-y-2"><Label htmlFor="block-reason">Reason (optional)</Label>
          <Input id="block-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={200} placeholder="Holiday or day off" /></div>
        <Button disabled={busy || !startDate || !endDate} onClick={async () => {
          const saved = await run(() => saveBlockedDateRange(pageId, startDate, endDate, reason), 'Dates blocked.')
          if (saved) { setStartDate(''); setEndDate(''); setReason('') }
        }}>Block dates</Button>
        {blockedDates.length > 0 && <div className="border-t pt-4">
          <p className="mb-2 text-sm font-medium">Blocked dates</p>
          <ul className="max-h-56 space-y-2 overflow-y-auto">{blockedDates.map((day) => <li key={day.blocked_date} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
            <span>{day.blocked_date}{day.reason ? ` · ${day.reason}` : ''}</span>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => removeBlockedDate(pageId, day.blocked_date), 'Date unblocked.')}>Remove</Button>
          </li>)}</ul>
        </div>}
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="border-b">
        <CardTitle>One-off hours</CardTitle>
        <CardDescription>Open on a normally closed day, or set different hours or a break for one date.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <DatePicker label="Date" value={exceptionDate} onValueChange={setExceptionDate} timezone={timezone} minDate={today} />
        <div className="flex items-center gap-3"><Switch id="exception-open" checked={open} onCheckedChange={setOpen} />
          <Label htmlFor="exception-open">Open for bookings</Label></div>
        {open && <div className="grid gap-4 sm:grid-cols-2">
          <TimePicker label="Opens" value={startTime} onValueChange={setStartTime} required />
          <TimePicker label="Closes" value={endTime} onValueChange={setEndTime} required />
          <TimePicker label="Break starts" value={breakStart} onValueChange={setBreakStart} optional />
          <TimePicker label="Break ends" value={breakEnd} onValueChange={setBreakEnd} optional />
        </div>}
        <Button disabled={busy || !exceptionDate} onClick={async () => {
          const saved = await run(() => saveAvailabilityOverride(pageId, {
            date: exceptionDate, is_active: open, start_time: startTime, end_time: endTime,
            break_start: open && breakStart ? breakStart : null,
            break_end: open && breakEnd ? breakEnd : null,
          }), 'One-off hours saved.')
          if (saved) setExceptionDate('')
        }}>Save one-off hours</Button>
        {overrides.length > 0 && <div className="border-t pt-4">
          <p className="mb-2 text-sm font-medium">Upcoming exceptions</p>
          <ul className="max-h-56 space-y-2 overflow-y-auto">{overrides.map((item) => <li key={item.date} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
            <span>{item.date} · {item.is_active ? `${item.start_time.slice(0,5)}–${item.end_time.slice(0,5)}` : 'Closed'}</span>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => removeAvailabilityOverride(pageId, item.date), 'One-off hours removed.')}>Remove</Button>
          </li>)}</ul>
        </div>}
      </CardContent>
    </Card>
    {message && <p role="status" className="rounded-lg border bg-muted px-4 py-3 text-sm">{message}</p>}
  </div>
}
