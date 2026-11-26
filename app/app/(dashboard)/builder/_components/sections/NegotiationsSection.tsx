"use client"

import { NegotiationsDashboard } from '../ultra-automation/components/NegotiationsDashboard'
import { useBuilderAuth } from '../BuilderAuthProvider'
import { BuilderPageWrapper } from '../BuilderPageWrapper'
import { Handshake } from 'lucide-react'

interface NegotiationsSectionProps {
  onNavigate?: (section: string) => void
}

export function NegotiationsSection({ onNavigate }: NegotiationsSectionProps) {
  const { builderId } = useBuilderAuth()
  
  return (
    <BuilderPageWrapper 
      title="Negotiations" 
      description="Track price negotiations, analyze strategies, and get AI-powered recommendations for successful deals"
      noContainer
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8">
            <NegotiationsDashboard builderId={builderId || undefined} />
          </div>
        </div>
      </div>
    </BuilderPageWrapper>
  )
}

