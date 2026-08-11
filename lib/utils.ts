import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
    // 'Jay's Barbershop!' -> 'jays-barbershop'
}

export function getTimeOptions() {
  const options = []

  for (let h = 6; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) continue

      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')

      options.push({
        value: `${hh}:${mm}`,
        label: `${hh}:${mm}`,
      })
    }
  }

  return options
}
