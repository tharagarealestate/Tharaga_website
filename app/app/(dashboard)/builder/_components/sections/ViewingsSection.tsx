"use client"

import { SectionWrapper } from './SectionWrapper'
import { ViewingsCalendar } from '../ultra-automation/components/ViewingsCalendar'
import { useDemoMode } from '../DemoDataProvider'

interface ViewingsSectionProps {
  onNavigate?: (section: string) => void
}

export function ViewingsSection({ onNavigate }: ViewingsSectionProps) {
  const { builderId } = useDemoMode()
  
  return (
    <SectionWrapper>
      <div className="w-full max-w-7xl mx-auto space-y-6 py-6">
        <header className="space-y-2">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
            Property Viewings
          </h1>
          <p className="text-base text-blue-100/80 sm:text-lg max-w-2xl">
            Manage scheduled property viewings, track reminders, and monitor viewing completion status.
          </p>
        </header>
        <ViewingsCalendar builderId={builderId || undefined} />
      </div>
    </SectionWrapper>
  )
}

