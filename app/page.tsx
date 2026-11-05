import type { Metadata } from 'next'

import { LandingHero } from './LandingHero'

export const metadata: Metadata = {
  title: 'Slotly | Your booking page, ready in 60 seconds',
  description:
    'Create a booking page, share your link and let customers book available appointments online.',
}

export default function Home() {
  return <LandingHero />
}
