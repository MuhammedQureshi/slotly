export const DEFAULT_BOOKING_ACCENT = '#0c0a09'

export function isAccessibleBookingAccent(color: string) {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return false
  const channels = [1, 3, 5].map((index) => parseInt(color.slice(index, index + 2), 16) / 255)
  const luminance = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return luminance[0] * 0.2126 + luminance[1] * 0.7152 + luminance[2] * 0.0722 <= 0.16
}

export function bookingAccent(color: string | null | undefined, customBranding: boolean) {
  return customBranding && color && isAccessibleBookingAccent(color)
    ? color : DEFAULT_BOOKING_ACCENT
}
