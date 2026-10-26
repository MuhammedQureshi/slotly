import { Resend } from 'resend'
import { render } from '@react-email/render'
import BookingConfirmation from '@/emails/BookingConfirmation'
import OwnerNotification from '@/emails/OwnerNotification'

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured')
  return new Resend(process.env.RESEND_API_KEY)
}

type SendBookingConfirmationParams = {
  to: string
  customerName: string
  businessName: string
  serviceName: string
  date: string
  time: string
  duration: number
  price: string
  cancelUrl: string
}

export async function sendBookingConfirmation(params: SendBookingConfirmationParams) {
  const { to, ...templateProps } = params

  const html = await render(<BookingConfirmation {...templateProps} />)

  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Slotly <onboarding@resend.dev>',
    to,
    subject: `Booking confirmed with ${params.businessName}`,
    html,
  })
  if (error) throw new Error('Customer confirmation failed: ' + error.message)
}

export async function sendOwnerNotification(params: Omit<SendBookingConfirmationParams, 'cancelUrl'> & { dashboardUrl?: string }) {
  const { to, ...templateProps } = params

  const html = await render(<OwnerNotification {...templateProps} />)

  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Slotly <onboarding@resend.dev>',
    to,
    subject: `New Booking Received for ${params.businessName}`,
    html,
  })
  if (error) throw new Error('Owner notification failed: ' + error.message)
}
