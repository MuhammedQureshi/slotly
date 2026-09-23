import { Resend } from 'resend'
import { render } from '@react-email/render'
import BookingConfirmation from '@/emails/BookingConfirmation'
import OwnerNotification from '@/emails/OwnerNotification'

const resend = new Resend(process.env.RESEND_API_KEY!)

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

  await resend.emails.send({
    from: 'Slotly <onboarding@resend.dev>',
    to,
    subject: `Booking confirmed with ${params.businessName}`,
    html,
  })
}

export async function sendOwnerNotification(params: Omit<SendBookingConfirmationParams, 'cancelUrl'>) {
  const { to, ...templateProps } = params

  const html = await render(<OwnerNotification {...templateProps} />)

  await resend.emails.send({
    from: 'Slotly <onboarding@resend.dev>',
    to,
    subject: `New Booking Received for ${params.businessName}`,
    html,
  })
}
