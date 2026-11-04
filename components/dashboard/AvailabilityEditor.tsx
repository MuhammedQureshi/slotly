"use client"

import { useState } from "react"
import { CalendarClock } from "lucide-react"
import { getTimeOptions } from "@/lib/utils"
import { Switch } from "../ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { TimePicker } from '@/components/ui/time-picker'
import { saveAvailability } from "@/app/(dashboard)/my-page/actions"
import { useToast } from "../ui/toast"

export type DayRule = {
  day_of_week: number  // 0 = Sun, 1 = Mon ... 6 = Sat
  is_active: boolean
  start_time: string   // '09:00'
  end_time: string     // '17:00'
  break_start?: string | null
  break_end?: string | null
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const initialDays: DayRule[] = [
  { day_of_week: 0, is_active: false, start_time: '09:00', end_time: '17:00' }, // Sun
  { day_of_week: 1, is_active: true,  start_time: '09:00', end_time: '17:00' }, // Mon
  { day_of_week: 2, is_active: true,  start_time: '09:00', end_time: '17:00' }, // Tue
  { day_of_week: 3, is_active: true,  start_time: '09:00', end_time: '17:00' }, // Wed
  { day_of_week: 4, is_active: true,  start_time: '09:00', end_time: '17:00' }, // Thu
  { day_of_week: 5, is_active: true,  start_time: '09:00', end_time: '17:00' }, // Fri
  { day_of_week: 6, is_active: false, start_time: '09:00', end_time: '17:00' }, // Sat
]

function mergeAvailability(rules: DayRule[]) {
  const byDay = new Map(
    rules.map((rule) => [
      rule.day_of_week,
      {
        ...rule,
        start_time: rule.start_time.slice(0, 5),
        end_time: rule.end_time.slice(0, 5),
        break_start: rule.break_start?.slice(0, 5) ?? null,
        break_end: rule.break_end?.slice(0, 5) ?? null,
      },
    ])
  )
  return initialDays.map((fallback) => byDay.get(fallback.day_of_week) ?? fallback)
}

export default function AvailabilityEditor({
  bookingPageId,
  initialRules,
}: {
  bookingPageId: string
  initialRules: DayRule[]
}) {
  const [days, setDays] = useState<DayRule[]>(() => mergeAvailability(initialRules))
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const timeOptions = getTimeOptions()

  function toggleDay(day_of_week: number) {
    setDays(currentDays => currentDays.map(day =>
        day.day_of_week === day_of_week ?
        { ...day, is_active: !day.is_active } :
            day
    ))
  }


  function updateTime(day_of_week: number, field: 'start_time' | 'end_time' | 'break_start' | 'break_end', value: string) {
    setDays(currentDays => currentDays.map(day =>
        day.day_of_week === day_of_week ?
        { ...day, [field]: field.startsWith('break_') ? (value || null) : value } :
            day
    ))
  }

  const handleSave = async () => {
    setIsSaving(true)
    const formData = new FormData()
    formData.append('booking_page_id', bookingPageId)
    formData.append('days', JSON.stringify(days))

    try {
      const result = await saveAvailability(formData)

      if (result?.error) {
        toast({
          title: 'Could not save availability',
          description: result.error,
          variant: 'error',
        })
        return
      }

      toast({
        title: 'Availability saved',
        description: result?.conflicts
          ? `${result.conflicts} existing appointment${result.conflicts === 1 ? '' : 's'} conflict with the new hours and remain booked.`
          : 'Your booking hours are now up to date.',
      })
    } catch {
      toast({
        title: 'Could not save availability',
        description: 'Something went wrong. Please try again.',
        variant: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2"><CalendarClock aria-hidden="true" className="size-4" /> Weekly availability</CardTitle>
        <CardDescription>Set the hours customers can choose from.</CardDescription>
      </CardHeader>

      <CardContent className="divide-y">
        {days.map(day => (
        <div key={day.day_of_week} className="py-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`day-${day.day_of_week}`}>
              {DAY_NAMES[day.day_of_week]}
            </Label>
            <Switch id={`day-${day.day_of_week}`} checked={day.is_active} onCheckedChange={() => toggleDay(day.day_of_week)} />
          </div>
          {day.is_active ? (
            <>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <Select
                value={day.start_time}
                onValueChange={val => val && updateTime(day.day_of_week, 'start_time', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Start Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-stone-400">to</span>
              <Select
                value={day.end_time}
                onValueChange={val => val && updateTime(day.day_of_week, 'end_time', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="End Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TimePicker label={`${DAY_NAMES[day.day_of_week]} break starts`} value={day.break_start ?? ''}
                onValueChange={(value) => updateTime(day.day_of_week, 'break_start', value)} optional />
              <TimePicker label={`${DAY_NAMES[day.day_of_week]} break ends`} value={day.break_end ?? ''}
                onValueChange={(value) => updateTime(day.day_of_week, 'break_end', value)} optional />
            </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-stone-400">Unavailable</p>
          )}
        </div>
        ))}
      </CardContent>

      <CardFooter>
        <Button className="w-full" disabled={isSaving} onClick={handleSave}>
          {isSaving ? 'Saving…' : 'Save availability'}
        </Button>
      </CardFooter>
    </Card>
  )
}
