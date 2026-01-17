"use client"

import { ViewingsCalendar } from '../ultra-automation/components/ViewingsCalendar'
import { useBuilderAuth } from '../BuilderAuthProvider'
import { BuilderPageWrapper } from '../BuilderPageWrapper'
import { Calendar } from 'lucide-react'

interface ViewingsSectionProps {
  onNavigate?: (section: string) => void
}

export function ViewingsSection({ onNavigate }: ViewingsSectionProps) {
  const { builderId } = useBuilderAuth()
  
  return (
    <BuilderPageWrapper 
      title="Property Viewings" 
      description="Manage scheduled property viewings, track reminders, and monitor viewing completion status"
      noContainer
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8">
            <ViewingsCalendar builderId={builderId || undefined} />
          </div>
        </div>
      </div>
    </BuilderPageWrapper>
  )
}

