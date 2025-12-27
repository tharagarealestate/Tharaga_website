"use client"

import { useState, useCallback } from 'react'
import { LeadsList, type Lead } from '../../leads/_components/LeadsList'
import { FilterProvider } from '@/contexts/FilterContext'
import { FilterCollections } from '../../leads/_components/FilterCollections'
import AdvancedFilters from '../../leads/_components/AdvancedFilters'

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
    <div className="space-y-6">
      {/* Header - Admin Design System */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white mb-2">Lead Management</h1>
        <p className="text-slate-300">Monitor, prioritize, and act on buyer intent instantly with live scoring and enriched insights.</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate?.('pipeline')}
          className="px-4 py-2 glow-border bg-slate-800/95 text-slate-200 hover:bg-slate-700/50 rounded-lg text-sm font-semibold transition-colors"
        >
          View Pipeline Overview
        </button>
      </div>

      {/* Main Content - Admin Design System */}
      <div className="bg-slate-800/95 glow-border rounded-lg p-6">
        <FilterProvider>
          <div className="space-y-6">
            <AdvancedFilters />
            <FilterCollections />
            <LeadsList onSelectLead={handleSelectLead} showInlineFilters={false} />
          </div>
        </FilterProvider>
      </div>
    </div>
  )
}

