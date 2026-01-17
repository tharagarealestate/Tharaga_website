"use client"

import { DealLifecycleTracker } from '../ultra-automation/components/DealLifecycleTracker'
import { useDemoMode } from '../DemoDataProvider'
import { BuilderPageWrapper } from '../BuilderPageWrapper'
import { TrendingUp } from 'lucide-react'

interface DealLifecycleSectionProps {
  onNavigate?: (section: string) => void
}

export function DealLifecycleSection({ onNavigate }: DealLifecycleSectionProps) {
  const { builderId } = useDemoMode()
  
  return (
    <BuilderPageWrapper 
      title="Deal Lifecycle" 
      description="Track deals through all stages, detect stalling, and optimize conversion with real-time analytics"
      noContainer
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8">
            <DealLifecycleTracker builderId={builderId || undefined} />
          </div>
        </div>
      </div>
    </BuilderPageWrapper>
  )
}

