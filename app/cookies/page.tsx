import type { Metadata } from 'next'
import { LegalLayout } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Cookie Policy | Slotly',
  description: 'How Slotly uses essential cookies and browser storage.',
}

export default function CookiesPage() {
  return <LegalLayout title="Cookie Policy" updated="6 November 2026">
    <section><h2>What we use</h2><p>Slotly uses essential cookies and similar storage to keep accounts signed in, protect sessions, and make the service work. Clerk, our sign-in provider, may set authentication and security cookies. Stripe may set its own cookies when you open its hosted checkout or billing portal. Those services’ cookie names and lifetimes may change.</p></section>
    <section><h2>Your notice choice</h2><p>When you accept the cookie notice on our landing page, we save <code className="rounded bg-secondary px-1">slotly-cookie-notice-v1</code> in your browser’s local storage. Its value records that you have seen the notice on that device. It is not used for advertising and does not identify your account.</p></section>
    <section><h2>Optional cookies</h2><p>Slotly does not currently install optional advertising or analytics cookies through its application code. Essential sign-in and security storage is needed for the service you request and remains available whether or not you have acknowledged the notice. If we add optional cookies later, we will ask for a separate choice before using them.</p></section>
    <section><h2>Managing storage</h2><p>You can clear cookies and local storage in your browser settings. Removing sign-in cookies may log you out; removing the notice choice will show the notice again. For questions, email <a className="underline" href="mailto:privacy@slotlyapp.uk">privacy@slotlyapp.uk</a>.</p></section>
  </LegalLayout>
}
