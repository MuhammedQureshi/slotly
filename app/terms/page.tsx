import type { Metadata } from 'next'
import { LegalLayout } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Terms of Service | Slotly',
  description: 'Terms for business accounts using Slotly.',
}

export default function TermsPage() {
  return <LegalLayout title="Terms of Service" updated="6 November 2026">
    <section><h2>Using Slotly</h2><p>These terms apply to business owners who create a Slotly account. Slotly provides a booking page, appointment management and related tools. Keep your account details accurate and secure, and use the service lawfully. You are responsible for your services, prices, availability and dealings with your customers.</p></section>
    <section><h2>Bookings and customer data</h2><p>Customers book directly with your business. Slotly does not collect payment for your services or guarantee that a customer will attend. You are responsible for handling appointment disputes, providing your own customer privacy information and following applicable data protection rules. Do not enter sensitive information in customer notes unless it is necessary and lawful to do so.</p></section>
    <section><h2>Plans and payments</h2><p>The Free plan allows up to 100 active bookings per calendar month for each account. Pro offers unlimited bookings and the additional features shown on the <a className="underline" href="/pricing">pricing page</a>. The advertised Pro price is £9 per month; the amount and billing terms shown in Stripe Checkout govern the purchase. Stripe processes subscription payments. You can manage or cancel a Pro subscription through the billing portal in your Slotly account. Cancellation normally takes effect at the end of the paid period shown there.</p></section>
    <section><h2>Availability of the service</h2><p>We work to keep Slotly available and accurate, but maintenance, third-party outages or technical problems can interrupt it. Check important appointments directly with customers when needed. We may update features and these terms as the service develops; material changes will be communicated through the service where practical.</p></section>
    <section><h2>Contact</h2><p>For account, billing or terms questions, email <a className="underline" href="mailto:privacy@slotlyapp.uk">privacy@slotlyapp.uk</a>. Our <a className="underline" href="/privacy">Privacy Policy</a> explains how information is handled.</p></section>
  </LegalLayout>
}
