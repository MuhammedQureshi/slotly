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
import { saveAvailability } from "@/app/(dashboard)/my-page/actions"
import { useToast } from "../ui/toast"

type DayRule = {
  day_of_week: number  // 0 = Sun, 1 = Mon ... 6 = Sat
  is_active: boolean
  start_time: string   // '09:00'
  end_time: string     // '17:00'
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

export default function AvailabilityEditor({ bookingPageId }: { bookingPageId: string }) {
  // TODO: useState with initialDays
  const [days, setDays] = useState<DayRule[]>(initialDays);
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const timeOptions = getTimeOptions()

  // TODO: write a toggleDay function that flips is_active for a given day_of_week
  // use the setDays + map pattern we just discussed
  function toggleDay(day_of_week: number) {
    setDays(currentDays => currentDays.map(day =>
        day.day_of_week === day_of_week ?
        { ...day, is_active: !day.is_active } :
            day
    ))
  }


  // TODO: write an updateTime function that updates start_time or end_time
  // it needs to know: which day, which field ('start_time' or 'end_time'), and the new value
  function updateTime(day_of_week: number, field: 'start_time' | 'end_time', value: string) {
    setDays(currentDays => currentDays.map(day =>
        day.day_of_week === day_of_week ?
        { ...day, [field]: value } :
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
        description: 'Your booking hours are now up to date.',
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
    <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-stone-200 p-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
          <CalendarClock aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-stone-950">Weekly availability</h2>
          <p className="mt-1 text-sm leading-5 text-stone-600">Set the hours customers can choose from.</p>
        </div>
      </div>

      <div className="divide-y divide-stone-100 px-5">
        {days.map(day => (
        <div key={day.day_of_week} className="py-4">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={`day-${day.day_of_week}`} className="text-sm font-medium text-stone-800">
              {DAY_NAMES[day.day_of_week]}
            </label>
            <Switch id={`day-${day.day_of_week}`} checked={day.is_active} onCheckedChange={() => toggleDay(day.day_of_week)} />
          </div>
          {day.is_active ? (
          // TODO: two selects for start_time and end_time
          // each one maps over timeOptions
          // onChange calls updateTime with the right field
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
          ) : (
            <p className="mt-2 text-xs text-stone-400">Unavailable</p>
          )}
        </div>
        ))}
      </div>

      <div className="border-t border-stone-200 bg-stone-50/70 p-5">
        <Button className="w-full bg-stone-950 hover:bg-stone-800" disabled={isSaving} onClick={handleSave}>
          {isSaving ? 'Saving…' : 'Save availability'}
        </Button>
      </div>
    </section>
  )
}
