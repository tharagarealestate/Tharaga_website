"use client"

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
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
      {/* Header - Design System Typography */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Lead Management</h1>
        <p className="text-slate-300 text-base sm:text-lg">Monitor, prioritize, and act on buyer intent instantly with live scoring and enriched insights.</p>
      </motion.div>

      {/* Controls - Design System Buttons */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate?.('pipeline')}
          className="px-6 py-3 glow-border bg-slate-800/95 text-slate-200 hover:bg-slate-700/50 rounded-lg text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
        >
          View Pipeline Overview
        </motion.button>
      </div>

      {/* Main Content - Design System Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 sm:p-8">
          <FilterProvider>
            <div className="space-y-6">
              <AdvancedFilters />
              <FilterCollections />
              <LeadsList onSelectLead={handleSelectLead} showInlineFilters={false} />
            </div>
          </FilterProvider>
        </div>
      </motion.div>
    </div>
  )
}

