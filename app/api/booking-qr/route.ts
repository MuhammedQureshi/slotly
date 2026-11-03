import { auth } from '@clerk/nextjs/server'
import QRCode from 'qrcode'
import { supabaseAdmin } from '@/lib/supabase'
import { getEntitlements } from '@/lib/plans'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })
  const { data: user } = await supabaseAdmin.from('users').select('id, plan')
    .eq('clerk_user_id', userId).maybeSingle()
  if (!user || !getEntitlements(user.plan).qrCode) {
    return new Response('QR downloads are available on Pro', { status: 403 })
  }
  const { data: page } = await supabaseAdmin.from('booking_pages').select('slug')
    .eq('user_id', user.id).limit(1).maybeSingle()
  if (!page) return new Response('Booking page not found', { status: 404 })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return new Response('App URL missing', { status: 503 })
  const svg = await QRCode.toString(new URL(`/book/${encodeURIComponent(page.slug)}`, appUrl).toString(), {
    type: 'svg', errorCorrectionLevel: 'M', margin: 2, width: 512,
  })
  return new Response(svg, { headers: {
    'Content-Type': 'image/svg+xml',
    'Content-Disposition': 'attachment; filename="slotly-booking-qr.svg"',
    'Cache-Control': 'private, no-store',
  } })
}
