'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'

export default function StatisticsDateFilter({ initialFrom, initialTo, timezone, rangeAdjusted }: {
  initialFrom: string
  initialTo: string
  timezone: string
  rangeAdjusted: boolean
}) {
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [notice, setNotice] = useState(rangeAdjusted ? 'The end date was moved to match the start date.' : '')

  return <form method="get" className="space-y-3">
    <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <DatePicker label="From" name="from" value={from} timezone={timezone} onValueChange={(next) => {
        setFrom(next)
        if (next > to) {
          setTo(next)
          setNotice('The end date moved to match your new start date.')
        } else setNotice('')
      }} />
      <DatePicker label="To" name="to" value={to} minDate={from} timezone={timezone} onValueChange={(next) => {
        setTo(next)
        setNotice('')
      }} />
      <Button type="submit">Apply dates</Button>
    </div>
    {notice && <p role="status" className="text-xs text-muted-foreground">{notice}</p>}
  </form>
}
