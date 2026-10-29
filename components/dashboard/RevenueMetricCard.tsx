'use client'

import { PoundSterling } from 'lucide-react'

import { useUserPlan } from '@/lib/useUserPlan'

import MetricCard from './MetricCard'

export default function RevenueMetricCard({ value }: { value?: string }) {
  const { isPro, loading } = useUserPlan()

  return (
    <MetricCard
      label="Revenue this month"
      value={value}
      description="Confirmed and active bookings"
      icon={PoundSterling}
      locked={loading || !isPro}
    />
  )
}
