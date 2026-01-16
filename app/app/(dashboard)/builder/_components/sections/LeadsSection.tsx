"use client"

import { useCallback, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Users,
  Clock,
  Star,
  Sparkles,
  ExternalLink,
  Filter,
  LayoutGrid,
  Zap,
  CheckCircle2
} from 'lucide-react'

import { LeadsList, type Lead } from '../../leads/_components/LeadsList'
import { FilterProvider, useFilters } from '@/contexts/FilterContext'
import { FilterCollections } from '../../leads/_components/FilterCollections'
import AdvancedFilters from '../../leads/_components/AdvancedFilters'

interface LeadsSectionProps {
  onNavigate?: (section: string) => void
}

export function LeadsSection({ onNavigate }: LeadsSectionProps) {
  const [showPresets, setShowPresets] = useState(false)
  const [showCRM, setShowCRM] = useState(false)
  const [stats, setStats] = useState({
    total_leads: 0,
    hot_leads: 0,
    pending_interactions: 0,
  })

  const handleSelectLead = useCallback((lead: Lead) => {
    // Navigate to lead detail - dispatch event for modal or navigate
    window.dispatchEvent(new CustomEvent('open-lead-detail', { detail: { leadId: lead.id } }))
  }, [])

  const handleStatsUpdate = useCallback((newStats: any) => {
    setStats({
      total_leads: newStats.total_leads || 0,
      hot_leads: newStats.hot_leads || 0,
      pending_interactions: newStats.pending_interactions || 0,
    })
  }, [])

  return (
    <FilterProvider>
      {/* Background matches sidebar - no custom background needed */}
      <div className="relative w-full">
        <div className="relative z-10 w-full">
          <div className="mx-auto max-w-7xl space-y-6">

            {/* Hero Command Center - Compact & Action-Oriented */}
            <LeadsCommandCenter
              onShowPresets={() => setShowPresets(true)}
              onShowCRM={() => setShowCRM(true)}
              onNavigate={onNavigate}
              stats={stats}
            />

            {/* Main Content - Leads First! */}
            <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 sm:p-8">
              <div className="space-y-6">
                {/* Inline Quick Filters */}
                <AdvancedFilters />

                {/* The Star of the Show - Leads List */}
                <LeadsList
                  onSelectLead={handleSelectLead}
                  showInlineFilters={false}
                  onStatsUpdate={handleStatsUpdate}
                />
              </div>
            </section>
          </div>
        </div>

        {/* Filter Presets Modal */}
        <AnimatePresence>
          {showPresets && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowPresets(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed inset-4 sm:inset-10 md:inset-20 z-50 overflow-y-auto rounded-3xl glow-border bg-slate-900/98 backdrop-blur-xl shadow-2xl"
              >
                <div className="sticky top-0 z-10 border-b glow-border bg-slate-900/95 backdrop-blur p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-amber-300" />
                        Filter Presets & Saved Playbooks
                      </h2>
                      <p className="text-sm text-blue-100/70 mt-1">
                        Quick-start your lead analysis with intelligent presets
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPresets(false)}
                      className="rounded-xl glow-border bg-slate-700/50 px-4 py-2 text-white hover:bg-slate-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <FilterCollections />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* CRM Quick Access Modal */}
        <AnimatePresence>
          {showCRM && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowCRM(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed inset-4 sm:inset-10 md:left-auto md:right-10 md:top-10 md:bottom-10 md:w-full md:max-w-2xl z-50 overflow-y-auto rounded-3xl glow-border bg-slate-900/98 backdrop-blur-xl shadow-2xl"
              >
                <div className="sticky top-0 z-10 border-b glow-border bg-slate-900/95 backdrop-blur p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ExternalLink className="h-6 w-6 text-blue-400" />
                        CRM Integration Hub
                      </h2>
                      <p className="text-sm text-slate-300 mt-1">
                        Manage your Zoho CRM connection and sync leads
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCRM(false)}
                      className="rounded-xl glow-border bg-slate-700/50 px-4 py-2 text-white hover:bg-slate-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <ZohoCRMQuickAccess />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Floating CRM Button - Always Accessible */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => setShowCRM(true)}
          className="fixed bottom-6 right-6 z-40 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-110 transition-all group"
          title="Open CRM Integration"
        >
          <ExternalLink className="h-6 w-6 text-white" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
            CRM Integration
          </span>
        </motion.button>
      </div>
    </FilterProvider>
  )
}

// Command Center Component - Compact, Action-First Design
function LeadsCommandCenter({ onShowPresets, onShowCRM, onNavigate, stats }: {
  onShowPresets: () => void
  onShowCRM: () => void
  onNavigate?: (section: string) => void
  stats: {
    total_leads: number
    hot_leads: number
    pending_interactions: number
  }
}) {
  return (
    <header className="bg-slate-900/95 glow-border rounded-xl p-6 backdrop-blur-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        {/* Left: Title & Badge */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm text-emerald-100 backdrop-blur">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-300" />
            AI-Powered Lead Intelligence
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Leads Command Center
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100/80">
              Your leads, intelligently scored and ready for action. Filter, analyze, and convert faster.
            </p>
          </div>
        </div>

        {/* Right: Action Buttons - Mobile Optimized */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Filter Presets Button */}
          <button
            onClick={onShowPresets}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl glow-border bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-300 backdrop-blur transition-all hover:bg-amber-500/30"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Filter Presets</span>
          </button>

          {/* CRM Integration Button */}
          <button
            onClick={onShowCRM}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl glow-border bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-300 backdrop-blur transition-all hover:bg-amber-500/30"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Zoho CRM</span>
            <span className="sm:hidden">CRM</span>
          </button>

          {/* Pipeline View */}
          <button
            onClick={() => onNavigate?.('pipeline')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl glow-border bg-slate-700/50 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-slate-700"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Pipeline</span>
            <span className="sm:hidden">Board</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Row - Mobile Optimized */}
      <QuickStatsRow stats={stats} />
    </header>
  )
}

// Quick Stats Component
function QuickStatsRow({ stats }: {
  stats: {
    total_leads: number
    hot_leads: number
    pending_interactions: number
  }
}) {
  const { activeFilterCount } = useFilters()

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:items-center lg:gap-4">
      <StatBadge icon={Users} label="All Leads" value={stats.total_leads.toString()} color="blue" />
      <StatBadge icon={Star} label="Hot Leads" value={stats.hot_leads.toString()} color="red" />
      <StatBadge icon={Clock} label="Pending" value={stats.pending_interactions.toString()} color="amber" />
      <StatBadge
        icon={Filter}
        label="Active Filters"
        value={activeFilterCount.toString()}
        color={activeFilterCount > 0 ? "emerald" : "slate"}
      />
    </div>
  )
}

interface StatBadgeProps {
  icon: React.ElementType
  label: string
  value: string
  color: 'blue' | 'red' | 'amber' | 'emerald' | 'slate'
}

function StatBadge({ icon: Icon, label, value, color }: StatBadgeProps) {
  const colorClasses = {
    blue: 'border-blue-400/30 bg-blue-400/10 text-blue-100',
    red: 'border-red-400/30 bg-red-400/10 text-red-100',
    amber: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
    emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
    slate: 'border-slate-400/30 bg-slate-400/10 text-slate-100',
  }

  return (
    <div className={`flex items-center gap-2 rounded-xl border ${colorClasses[color]} px-3 py-2 backdrop-blur`}>
      <Icon className="h-4 w-4" />
      <div className="flex-1 min-w-0">
        <p className="text-xs opacity-80 truncate">{label}</p>
        <p className="text-lg font-bold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

// Zoho CRM Quick Access Component
function ZohoCRMQuickAccess() {
  const [status, setStatus] = useState<{ connected?: boolean; account?: { name?: string } } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/integrations/zoho/status')
      .then(res => res.json())
      .then(data => {
        setStatus(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleOpenZoho = async (leadId?: string) => {
    if (!leadId) {
      window.open('https://crm.zoho.in', '_blank')
      return
    }

    try {
      const response = await fetch('/api/integrations/zoho/open-with-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId }),
      })

      const data = await response.json()

      if (data.success && data.zohoUrl) {
        window.open(data.zohoUrl, '_blank')
      } else if (data.errorType === 'NOT_CONNECTED' && data.connectUrl) {
        window.location.href = data.connectUrl
      } else {
        alert(data.message || 'Failed to open Zoho CRM')
      }
    } catch (error) {
      console.error('Error opening Zoho:', error)
      alert('Failed to open Zoho CRM. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-400/30 bg-blue-400/10 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-blue-500/20 p-3">
            <Zap className="h-6 w-6 text-blue-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Zoho CRM Integration</h3>
            <p className="text-sm text-slate-300 mt-1">
              {loading ? 'Checking connection...' : 
               status?.connected 
                 ? `Connected to ${status.account?.name || 'Zoho CRM'}` 
                 : 'Connect your Zoho CRM to sync leads and deals automatically'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/95 glow-border rounded-xl p-6 space-y-4">
        {status?.connected ? (
          <>
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">CRM Connected</span>
            </div>
            <p className="text-sm text-slate-300">
              Click on any lead card to open it in Zoho CRM with details pre-filled.
            </p>
            <button
              onClick={() => handleOpenZoho()}
              className="block w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
            >
              Open Zoho CRM
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-slate-400 text-sm">
              Connect your Zoho CRM account to start syncing leads automatically.
            </p>
            <button
              onClick={() => window.location.href = '/builder/integrations?provider=zoho'}
              className="block w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
            >
              Connect Zoho CRM
            </button>
          </>
        )}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-integrations'))}
          className="block w-full rounded-xl glow-border bg-slate-700/50 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-slate-700 transition-all"
        >
          Manage Integration Settings
        </button>
      </div>
    </div>
  )
}
