"use client"

import { SectionWrapper } from './SectionWrapper'
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
    <SectionWrapper>
      <div className="w-full max-w-7xl mx-auto space-y-6 py-6">
        <BehaviorTrackingPage />
      </div>
    </SectionWrapper>
  )
}

