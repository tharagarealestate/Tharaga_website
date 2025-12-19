"use client"

import { SectionWrapper } from './SectionWrapper'
import { DealLifecycleTracker } from '../ultra-automation/components/DealLifecycleTracker'
import { useDemoMode } from '../DemoDataProvider'

interface DealLifecycleSectionProps {
  onNavigate?: (section: string) => void
}

export function DealLifecycleSection({ onNavigate }: DealLifecycleSectionProps) {
  const { builderId } = useDemoMode()
  
  return (
    <SectionWrapper>
      <div className="w-full max-w-7xl mx-auto space-y-6 py-6">
        <header className="space-y-2">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
            Deal Lifecycle
          </h1>
          <p className="text-base text-blue-100/80 sm:text-lg max-w-2xl">
            Track deals through all stages, detect stalling, and optimize conversion with real-time analytics.
          </p>
        </header>
        <DealLifecycleTracker builderId={builderId || undefined} />
      </div>
    </SectionWrapper>
  )
}

