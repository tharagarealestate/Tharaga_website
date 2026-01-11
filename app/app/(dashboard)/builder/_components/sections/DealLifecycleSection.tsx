"use client"

import { SectionWrapper } from './SectionWrapper'
import { DealLifecycleTracker } from '../ultra-automation/components/DealLifecycleTracker'
import { useDemoMode } from '../DemoDataProvider'
import { StandardPageWrapper } from '../StandardPageWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { builderDesignSystem } from '../design-system'
import { TrendingUp } from 'lucide-react'

interface DealLifecycleSectionProps {
  onNavigate?: (section: string) => void
}

export function DealLifecycleSection({ onNavigate }: DealLifecycleSectionProps) {
  const { builderId } = useDemoMode()
  
  return (
    <SectionWrapper>
      <StandardPageWrapper
        title="Deal Lifecycle"
        subtitle="Track deals through all stages, detect stalling, and optimize conversion with real-time analytics."
        icon={<TrendingUp className={builderDesignSystem.cards.icon} />}
      >
        <GlassCard
          {...builderDesignSystem.cards.sectionCard.props}
          className={builderDesignSystem.cards.sectionCard.props.className}
        >
          <div className="p-6 sm:p-8">
            <DealLifecycleTracker builderId={builderId || undefined} />
          </div>
        </GlassCard>
      </StandardPageWrapper>
    </SectionWrapper>
  )
}

