"use client"

import { SectionWrapper } from './SectionWrapper'
import { NegotiationsDashboard } from '../ultra-automation/components/NegotiationsDashboard'
import { useDemoMode } from '../DemoDataProvider'
import { StandardPageWrapper } from '../StandardPageWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { builderDesignSystem } from '../design-system'
import { Handshake } from 'lucide-react'

interface NegotiationsSectionProps {
  onNavigate?: (section: string) => void
}

export function NegotiationsSection({ onNavigate }: NegotiationsSectionProps) {
  const { builderId } = useDemoMode()
  
  return (
    <SectionWrapper>
      <StandardPageWrapper
        title="Negotiations"
        subtitle="Track price negotiations, analyze strategies, and get AI-powered recommendations for successful deals."
        icon={<Handshake className={builderDesignSystem.cards.icon} />}
      >
        <GlassCard
          {...builderDesignSystem.cards.sectionCard.props}
          className={builderDesignSystem.cards.sectionCard.props.className}
        >
          <div className="p-6 sm:p-8">
            <NegotiationsDashboard builderId={builderId || undefined} />
          </div>
        </GlassCard>
      </StandardPageWrapper>
    </SectionWrapper>
  )
}

