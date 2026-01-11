"use client"

import { SectionWrapper } from './SectionWrapper'
import dynamic from 'next/dynamic'
import { SectionLoader } from './SectionLoader'
import { StandardPageWrapper } from '../StandardPageWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { builderDesignSystem } from '../design-system'
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
    <SectionWrapper>
      <StandardPageWrapper
        title="Behavior Analytics"
        subtitle="Track and analyze user behavior patterns"
        icon={<Activity className={builderDesignSystem.cards.icon} />}
      >
        <GlassCard
          {...builderDesignSystem.cards.sectionCard.props}
          className={builderDesignSystem.cards.sectionCard.props.className}
        >
          <div className="p-6 sm:p-8">
            <BehaviorTrackingPage />
          </div>
        </GlassCard>
      </StandardPageWrapper>
    </SectionWrapper>
  )
}

