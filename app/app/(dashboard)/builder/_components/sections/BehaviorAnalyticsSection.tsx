"use client"

import dynamic from 'next/dynamic'
import { SectionLoader } from './SectionLoader'
import { BuilderPageWrapper } from '../BuilderPageWrapper'
import { Activity } from 'lucide-react'

interface BehaviorAnalyticsSectionProps {
  onNavigate?: (section: string) => void
}

const BehaviorTrackingPage = dynamic(() => import('../../../behavior-tracking/page').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <SectionLoader section="behavior-analytics" />
})

export function BehaviorAnalyticsSection({ onNavigate }: BehaviorAnalyticsSectionProps) {
  return (
    <BuilderPageWrapper 
      title="Behavior Analytics" 
      description="Track and analyze user behavior patterns"
      noContainer
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8">
            <BehaviorTrackingPage />
          </div>
        </div>
      </div>
    </BuilderPageWrapper>
  )
}

