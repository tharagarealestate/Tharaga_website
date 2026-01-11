"use client"

import dynamic from 'next/dynamic'
import { SectionWrapper } from './SectionWrapper'
import { SectionLoader } from './SectionLoader'
import { StandardPageWrapper } from '../StandardPageWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { builderDesignSystem } from '../design-system'
import { TrendingUp } from 'lucide-react'

interface PipelineSectionProps {
  onNavigate?: (section: string) => void
}

// Dynamically import the pipeline component to avoid SSR issues
const LeadPipelineKanban = dynamic(() => import('../../leads/pipeline/_components/LeadPipelineKanban').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <SectionLoader section="pipeline" />
})

export function PipelineSection({ onNavigate }: PipelineSectionProps) {
  return (
    <SectionWrapper>
      <StandardPageWrapper
        title="Lead Pipeline"
        subtitle="Visualize and manage your leads through the sales pipeline"
        icon={<TrendingUp className={builderDesignSystem.cards.icon} />}
      >
        <GlassCard
          {...builderDesignSystem.cards.sectionCard.props}
          className={builderDesignSystem.cards.sectionCard.props.className}
        >
          <div className="p-6 sm:p-8">
            <div className="w-full max-w-[1920px] mx-auto">
              <LeadPipelineKanban />
            </div>
          </div>
        </GlassCard>
      </StandardPageWrapper>
    </SectionWrapper>
  )
}

