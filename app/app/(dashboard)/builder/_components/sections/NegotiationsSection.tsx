"use client"

import { SectionWrapper } from './SectionWrapper'
import { NegotiationsDashboard } from '../ultra-automation/components/NegotiationsDashboard'

interface NegotiationsSectionProps {
  onNavigate?: (section: string) => void
}

export function NegotiationsSection({ onNavigate }: NegotiationsSectionProps) {
  return (
    <SectionWrapper>
      <div className="w-full max-w-7xl mx-auto space-y-6 py-6">
        <header className="space-y-2">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
            Negotiations
          </h1>
          <p className="text-base text-blue-100/80 sm:text-lg max-w-2xl">
            Track price negotiations, analyze strategies, and get AI-powered recommendations for successful deals.
          </p>
        </header>
        <NegotiationsDashboard />
      </div>
    </SectionWrapper>
  )
}

