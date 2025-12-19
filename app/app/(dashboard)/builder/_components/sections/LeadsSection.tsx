"use client"

import { useState, useCallback } from 'react'
import { LeadsList, type Lead } from '../../leads/_components/LeadsList'
import { FilterProvider } from '@/contexts/FilterContext'
import { FilterCollections } from '../../leads/_components/FilterCollections'
import AdvancedFilters from '../../leads/_components/AdvancedFilters'
import { cn } from '@/lib/utils'
import { builderGlassPanel } from '../builderGlassStyles'

interface LeadsSectionProps {
  onNavigate?: (section: string) => void
}

export function LeadsSection({ onNavigate }: LeadsSectionProps) {
  const handleSelectLead = useCallback((lead: Lead) => {
    // Navigate to lead detail - dispatch event for modal or navigate
    window.dispatchEvent(new CustomEvent('open-lead-detail', { detail: { leadId: lead.id } }))
    // Could also navigate to pipeline with selected lead
    if (onNavigate) {
      // onNavigate('pipeline')
    }
  }, [onNavigate])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm text-emerald-100 backdrop-blur">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-300" />
            Real-time scoring with AI intelligence
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl lg:text-[3.25rem]">
              Lead Intelligence Command Center
            </h1>
            <p className="mt-3 max-w-2xl text-base text-blue-100/80 sm:text-lg">
              Monitor, prioritize, and act on buyer intent instantly with live scoring, enriched insights, and premium glassmorphism.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate?.('pipeline')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-all hover:border-white/40 hover:bg-white/20"
          >
            View Pipeline Overview
          </button>
        </div>
      </header>

      <section className={cn(builderGlassPanel, "p-6 sm:p-8")}>
        <FilterProvider>
          <div className="space-y-10">
            <AdvancedFilters />
            <FilterCollections />
            <LeadsList onSelectLead={handleSelectLead} showInlineFilters={false} />
          </div>
        </FilterProvider>
      </section>
    </div>
  )
}

