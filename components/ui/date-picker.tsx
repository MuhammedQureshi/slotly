'use client'

import { useId, useState } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TimePicker } from '@/components/ui/time-picker'

function calendarDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : undefined
}

type DatePickerProps = {
  label: string
  name?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  minDate?: string
  timezone?: string
  required?: boolean
}

export function DatePicker({ label, name, value, defaultValue = '', onValueChange, minDate,
  timezone = 'Europe/London', required = false }: DatePickerProps) {
  const id = useId()
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const selected = value ?? internalValue
  const selectedDate = calendarDate(selected)
  const earliest = minDate ? calendarDate(minDate) : undefined

  return <div className="space-y-2">
    <Label htmlFor={id}>{label}{required && <span aria-hidden="true">*</span>}</Label>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button id={id} type="button" variant="outline" className="w-full justify-start text-left font-normal" />}>
        <CalendarDays aria-hidden="true" />
        {selectedDate
          ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: timezone }).format(selectedDate)
          : <span className="text-muted-foreground">Choose a date</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selectedDate} timeZone={timezone}
          disabled={earliest ? { before: earliest } : undefined}
          onSelect={(date) => {
            if (!date) return
            const next = formatInTimeZone(date, timezone, 'yyyy-MM-dd')
            setInternalValue(next)
            onValueChange?.(next)
            setOpen(false)
          }} />
      </PopoverContent>
    </Popover>
    {name && <input type="hidden" name={name} value={selected} />}
  </div>
}

export function DateTimeField({ name, timezone = 'Europe/London', minDate }: {
  name: string
  timezone?: string
  minDate?: string
}) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const today = minDate ?? formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')

  return <div className="grid gap-4 sm:grid-cols-2">
    <DatePicker label="Date" value={date} onValueChange={setDate} minDate={today} timezone={timezone} required />
    <TimePicker label="Time" value={time} onValueChange={setTime} required />
    <input type="hidden" name={name} value={date && time ? `${date}T${time}` : ''} />
  </div>
}
