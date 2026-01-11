"use client"

import { SectionWrapper } from './SectionWrapper'
import { ViewingsCalendar } from '../ultra-automation/components/ViewingsCalendar'
import { useDemoMode } from '../DemoDataProvider'
import { StandardPageWrapper } from '../StandardPageWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { builderDesignSystem } from '../design-system'
import { Calendar } from 'lucide-react'

interface ViewingsSectionProps {
  onNavigate?: (section: string) => void
}

export function ViewingsSection({ onNavigate }: ViewingsSectionProps) {
  const { builderId } = useDemoMode()
  
  return (
    <SectionWrapper>
      <StandardPageWrapper
        title="Property Viewings"
        subtitle="Manage scheduled property viewings, track reminders, and monitor viewing completion status."
        icon={<Calendar className={builderDesignSystem.cards.icon} />}
      >
        <GlassCard
          {...builderDesignSystem.cards.sectionCard.props}
          className={builderDesignSystem.cards.sectionCard.props.className}
        >
          <div className="p-6 sm:p-8">
            <ViewingsCalendar builderId={builderId || undefined} />
          </div>
        </GlassCard>
      </StandardPageWrapper>
    </SectionWrapper>
  )
}

