'use client'

import { PoundSterling } from 'lucide-react'

import { useUserPlan } from '@/lib/useUserPlan'

import MetricCard from './MetricCard'

export default function RevenueMetricCard({ value }: { value?: string }) {
  const { isPro, loading } = useUserPlan()

  return (
    <MetricCard
      label="Estimated service value"
      value={value}
      description="Based on appointment prices; payments happen at the shop"
      icon={PoundSterling}
      locked={loading || !isPro}
      lockedDescription="Upgrade to view estimated service value"
    />
  )
}
