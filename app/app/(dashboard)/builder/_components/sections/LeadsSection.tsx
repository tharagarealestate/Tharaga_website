"use client"

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, List, LayoutGrid, Filter, Link2 } from 'lucide-react'
import { BuilderPageWrapper } from '../BuilderPageWrapper'
import { LeadsList, type Lead } from '../../leads/_components/LeadsList'
import { FilterProvider } from '@/contexts/FilterContext'
import AdvancedFilters from '../../leads/_components/AdvancedFilters'
import { StandardStatsCard } from '../design-system/StandardStatsCard'
import { CRMContent } from './CRMContent'

interface LeadsSectionProps {
  onNavigate?: (section: string) => void
}

/**
 * LeadsSection - Simplified to match messaging page pattern
 * Removed all popup modals (Filter Presets, CRM)
 * Clean tab-based interface matching messaging page
 */
export function LeadsSection({ onNavigate }: LeadsSectionProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'filters' | 'crm'>('list')
  const [stats, setStats] = useState({
    total_leads: 0,
    hot_leads: 0,
    warm_leads: 0,
  })

  const handleSelectLead = useCallback((lead: Lead) => {
    window.dispatchEvent(new CustomEvent('open-lead-detail', { detail: { leadId: lead.id } }))
  }, [])

  const handleStatsUpdate = useCallback((newStats: any) => {
    setStats({
      total_leads: newStats.total_leads || 0,
      hot_leads: newStats.hot_leads || 0,
      warm_leads: newStats.warm_leads || 0,
    })
  }, [])

  return (
    <FilterProvider>
      <BuilderPageWrapper 
        title="Lead Management" 
        description="Manage and track your leads with intelligent scoring and filtering"
        noContainer
      >
        <div className="space-y-6">
          {/* Tabs - Design System (matching messaging page) */}
          <div className="flex gap-2 border-b glow-border pb-2 overflow-x-auto">
            {[
              { id: 'list', label: 'All Leads', icon: List },
              { id: 'filters', label: 'Filters', icon: Filter },
              { id: 'crm', label: 'CRM', icon: Link2 },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'list' | 'filters' | 'crm')}
                  className={`px-6 py-3 font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-amber-300 border-b-2 border-amber-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content - Design System Container (matching messaging page) */}
          <AnimatePresence mode="wait">
            {activeTab === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Quick Stats - Using StandardStatsCard for consistency */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StandardStatsCard
                      title="Total Leads"
                      value={stats.total_leads}
                      icon={<Users className="w-5 h-5" />}
                    />
                    <StandardStatsCard
                      title="Hot Leads"
                      value={stats.hot_leads}
                      icon={<Users className="w-5 h-5" />}
                    />
                    <StandardStatsCard
                      title="Warm Leads"
                      value={stats.warm_leads}
                      icon={<Users className="w-5 h-5" />}
                    />
                  </div>

                  {/* Leads List */}
                  <LeadsList
                    onSelectLead={handleSelectLead}
                    showInlineFilters={false}
                    onStatsUpdate={handleStatsUpdate}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'filters' && (
              <motion.div
                key="filters"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 sm:p-8">
                  <AdvancedFilters />
                </div>
              </motion.div>
            )}

            {activeTab === 'crm' && (
              <motion.div
                key="crm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 sm:p-8">
                  <CRMContent />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </BuilderPageWrapper>
    </FilterProvider>
  )
}
