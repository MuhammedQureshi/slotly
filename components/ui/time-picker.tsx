'use client'

import { useId } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'))

export function TimePicker({ label, value, onValueChange, optional = false, required = false }: {
  label: string
  value: string
  onValueChange: (value: string) => void
  optional?: boolean
  required?: boolean
}) {
  const id = useId()
  const [hour = '', minute = ''] = value.split(':')

  return <div className="min-w-0 space-y-2">
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id}>{label}{required && <span aria-hidden="true">*</span>}</Label>
      {optional && value && <Button type="button" variant="ghost" size="xs" aria-label={`Clear ${label.toLowerCase()}`}
        onClick={() => onValueChange('')}><X aria-hidden="true" /> Clear</Button>}
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
      <Select value={hour || null} onValueChange={(next) => next && onValueChange(`${next}:${minute || '00'}`)}>
        <SelectTrigger id={id} aria-label={`${label} hour`} className="w-full"><SelectValue placeholder="HH" /></SelectTrigger>
        <SelectContent>{HOURS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground">:</span>
      <Select value={minute || null} onValueChange={(next) => next && onValueChange(`${hour}:${next}`)} disabled={!hour}>
        <SelectTrigger aria-label={`${label} minute`} className="w-full"><SelectValue placeholder="MM" /></SelectTrigger>
        <SelectContent>{MINUTES.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  </div>
}
