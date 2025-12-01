"use client"

import dynamic from 'next/dynamic'
import { SectionLoader } from './SectionLoader'

interface BehaviorAnalyticsSectionProps {
  onNavigate?: (section: string) => void
}

const BehaviorTrackingPage = dynamic(() => import('../../../behavior-tracking/page').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <SectionLoader section="behavior-analytics" />
})

export function BehaviorAnalyticsSection({ onNavigate }: BehaviorAnalyticsSectionProps) {
  return (
    <div className="w-full">
      <BehaviorTrackingPage />
    </div>
  )
}

