"use client"

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, List, Filter, Link2, TrendingUp, LayoutDashboard } from 'lucide-react'
import { BuilderPageWrapper } from '../BuilderPageWrapper'
import { LeadsList, type Lead } from '../../leads/_components/LeadsList'
import { FilterProvider } from '@/contexts/FilterContext'
import AdvancedFilters from '../../leads/_components/AdvancedFilters'
import { StandardStatsCard } from '../design-system/StandardStatsCard'
import { CRMContent } from './CRMContent'
import dynamic from 'next/dynamic'
import { SectionLoader } from './SectionLoader'

// Dynamically import the pipeline component
const LeadPipelineKanban = dynamic(() => import('../../leads/pipeline/_components/LeadPipelineKanban').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <SectionLoader section="pipeline" />
})

interface OverviewSectionProps {
  onNavigate?: (section: string) => void
}

/**
 * OverviewSection - Dashboard Overview with Leads-style UI Design
 * Provides quick access to leads with clean, professional interface
 */
export function OverviewSection({ onNavigate }: OverviewSectionProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'pipeline' | 'filters' | 'crm'>('list')
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
        title="Dashboard Overview"
        description="Quick access to your leads and business insights"
        noContainer
      >
        <div className="space-y-6">
          {/* Quick Stats - Top of page */}
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

          {/* Tabs - Leads-style Design */}
          <div className="flex gap-2 border-b glow-border pb-2 overflow-x-auto">
            {[
              { id: 'list', label: 'All Leads', icon: List },
              { id: 'pipeline', label: 'Pipeline View', icon: TrendingUp },
              { id: 'filters', label: 'Filters', icon: Filter },
              { id: 'crm', label: 'CRM', icon: Link2 },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'list' | 'pipeline' | 'filters' | 'crm')}
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

          {/* Tab Content - Leads-style Containers */}
          <AnimatePresence mode="wait">
            {activeTab === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 sm:p-8">
                  {/* Leads List */}
                  <LeadsList
                    onSelectLead={handleSelectLead}
                    showInlineFilters={false}
                    onStatsUpdate={handleStatsUpdate}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'pipeline' && (
              <motion.div
                key="pipeline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 sm:p-8">
                  <div className="w-full max-w-[1920px] mx-auto">
                    <LeadPipelineKanban />
                  </div>
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
                  {/* Filter Help Section */}
                  <div className="mb-6 p-4 bg-amber-500/10 border border-amber-400/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-amber-300 mb-2">About Filters</h4>
                    <p className="text-xs text-slate-300">
                      Use filters to narrow down your leads based on specific criteria like score range, budget, location, and activity.
                      Filtered results will automatically apply to the "All Leads" tab. You can save commonly used filter combinations for quick access.
                    </p>
                  </div>
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

