"use client"

import { useState } from "react"
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

type DayRule = {
  day_of_week: number  // 0 = Sun, 1 = Mon ... 6 = Sat
  is_active: boolean
  start_time: string   // '09:00'
  end_time: string     // '17:00'
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

  const timeOptions = getTimeOptions()

  // TODO: write a toggleDay function that flips is_active for a given day_of_week
  // use the setDays + map pattern we just discussed
  function toggleDay(day_of_week: number) {
    setDays(days.map(day =>
        day.day_of_week === day_of_week ?
        { ...day, is_active: !day.is_active } :
            day
    ))
  }


  // TODO: write an updateTime function that updates start_time or end_time
  // it needs to know: which day, which field ('start_time' or 'end_time'), and the new value
  function updateTime(day_of_week: number, field: 'start_time' | 'end_time', value: string) {
    setDays(days.map(day =>
        day.day_of_week === day_of_week ?
        { ...day, [field]: value } :
            day
    ))
  }

  return (
    <div className="bg-card p-10 rounded-2xl flex flex-col gap-4 items-center">
      <h2 className="text-lg font-semibold">Availability</h2>
      {days.map(day => (
        <div key={day.day_of_week} className="flex items-center gap-4">
          <span>{DAY_NAMES[day.day_of_week]}</span>
          <Switch checked={day.is_active} onCheckedChange={() => toggleDay(day.day_of_week)} />
          {day.is_active && (
          // TODO: two selects for start_time and end_time
          // each one maps over timeOptions
          // onChange calls updateTime with the right field
            <div className="flex gap-2"> 
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Start Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={time.value} value={time.value} onClick={() => updateTime(day.day_of_week, 'start_time', time.value)}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="End Time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map(time => (
                    <SelectItem key={time.value} value={time.value} onClick={() => updateTime(day.day_of_week, 'end_time', time.value)}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
      </div>
    ))}
      {/* TODO: a save button — we'll wire up the action after */}
      <Button className="mt-4" onClick={() => console.log(days)}>Save</Button>
    </div>
  )
} 