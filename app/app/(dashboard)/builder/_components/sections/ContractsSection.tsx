"use client"

import { SectionWrapper } from './SectionWrapper'
import { ContractsManager } from '../ultra-automation/components/ContractsManager'
import { useDemoMode } from '../DemoDataProvider'
import { StandardPageWrapper } from '../StandardPageWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { builderDesignSystem } from '../design-system'
import { FileText } from 'lucide-react'

interface ContractsSectionProps {
  onNavigate?: (section: string) => void
}

export function ContractsSection({ onNavigate }: ContractsSectionProps) {
  const { builderId } = useDemoMode()
  
  return (
    <SectionWrapper>
      <StandardPageWrapper
        title="Contracts"
        subtitle="Manage contracts, track signatures, and monitor contract status with automatic alerts."
        icon={<FileText className={builderDesignSystem.cards.icon} />}
      >
        <GlassCard
          {...builderDesignSystem.cards.sectionCard.props}
          className={builderDesignSystem.cards.sectionCard.props.className}
        >
          <div className="p-6 sm:p-8">
            <ContractsManager builderId={builderId || undefined} />
          </div>
        </GlassCard>
      </StandardPageWrapper>
    </SectionWrapper>
  )
}

