"use client"

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, List, LayoutGrid, Filter, Link2, TrendingUp, MessageCircle, Send, Phone, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { validateMessage } from '@/lib/integrations/messaging/templates'
import { BuilderPageWrapper } from '../BuilderPageWrapper'
import { LeadsList, type Lead } from '../../leads/_components/LeadsList'
import { FilterProvider } from '@/contexts/FilterContext'
import AdvancedFilters from '../../leads/_components/AdvancedFilters'
import { StandardStatsCard } from '../design-system/StandardStatsCard'
import { CRMDashboard } from './CRMDashboard'
import dynamic from 'next/dynamic'
import { SectionLoader } from './SectionLoader'

// Dynamically import the pipeline component
const LeadPipelineKanban = dynamic(() => import('../../leads/pipeline/_components/LeadPipelineKanban').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <SectionLoader section="pipeline" />
})

interface LeadsSectionProps {
  onNavigate?: (section: string) => void
}

/**
 * LeadsSection - Simplified to match messaging page pattern
 * Removed all popup modals (Filter Presets, CRM)
 * Clean tab-based interface matching messaging page
 * Includes Pipeline View as a tab (replaces separate sidebar menu)
 */
export function LeadsSection({ onNavigate }: LeadsSectionProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'pipeline' | 'filters' | 'crm' | 'outreach'>('list')
  const [stats, setStats] = useState({
    total_leads: 0,
    hot_leads: 0,
    warm_leads: 0,
  })

  // WhatsApp outreach state
  const [outreachForm, setOutreachForm] = useState({ to: '', body: '', type: 'whatsapp' as 'sms' | 'whatsapp' })
  const [outreachLoading, setOutreachLoading] = useState(false)
  const [outreachValidation, setOutreachValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null)

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

  const handleSendOutreach = async () => {
    if (!outreachForm.to || !outreachForm.body) { toast.error('Fill phone and message'); return }
    setOutreachLoading(true)
    try {
      const res = await fetch('/api/messaging/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: outreachForm.to, body: outreachForm.body, type: outreachForm.type }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${outreachForm.type === 'whatsapp' ? 'WhatsApp' : 'SMS'} sent!`)
        setOutreachForm({ to: '', body: '', type: outreachForm.type })
      } else {
        toast.error(data.error || 'Failed to send')
      }
    } catch { toast.error('Error sending message') } finally { setOutreachLoading(false) }
  }

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
              { id: 'list',     label: 'All Leads',     icon: List },
              { id: 'pipeline', label: 'Pipeline View', icon: TrendingUp },
              { id: 'filters',  label: 'Filters',       icon: Filter },
              { id: 'crm',      label: 'CRM',           icon: Link2 },
              { id: 'outreach', label: 'Quick Message',  icon: MessageCircle },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'list' | 'pipeline' | 'filters' | 'crm' | 'outreach')}
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
                  <CRMDashboard embedded={true} />
                </div>
              </motion.div>
            )}
            {activeTab === 'outreach' && (
              <motion.div
                key="outreach"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 sm:p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-500/15 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Quick Message</h3>
                      <p className="text-slate-400 text-sm">Send WhatsApp or SMS to any lead directly</p>
                    </div>
                  </div>

                  {/* Type toggle */}
                  <div className="flex gap-3">
                    {(['whatsapp', 'sms'] as const).map(t => (
                      <button key={t} onClick={() => setOutreachForm({ ...outreachForm, type: t })}
                        className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                          outreachForm.type === t
                            ? t === 'whatsapp' ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300' : 'bg-amber-500/20 glow-border text-amber-300'
                            : 'bg-slate-700/50 border border-slate-600/30 text-slate-400 hover:bg-slate-700'
                        }`}>
                        {t === 'whatsapp' ? <MessageCircle className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                        {t === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                      </button>
                    ))}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone Number</label>
                    <input type="tel" value={outreachForm.to}
                      onChange={e => setOutreachForm({ ...outreachForm, to: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full px-4 py-2.5 bg-slate-700/50 glow-border rounded-lg text-white placeholder:text-slate-400 focus:outline-none transition-all" />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Message</label>
                    <textarea value={outreachForm.body}
                      onChange={e => {
                        const body = e.target.value
                        setOutreachForm({ ...outreachForm, body })
                        setOutreachValidation(body ? validateMessage(body, outreachForm.type) : null)
                      }}
                      placeholder={outreachForm.type === 'whatsapp' ? 'Hi! Thank you for your interest in our properties…' : 'Hi, this is Tharaga Real Estate…'}
                      rows={5}
                      className="w-full px-4 py-2.5 bg-slate-700/50 glow-border rounded-lg text-white placeholder:text-slate-400 focus:outline-none transition-all resize-none" />
                    {outreachValidation && outreachValidation.errors.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {outreachValidation.errors.map((e, i) => (
                          <p key={i} className="text-xs text-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />{e}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <button onClick={handleSendOutreach}
                    disabled={outreachLoading || !outreachForm.to || !outreachForm.body}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {outreachLoading ? 'Sending…' : <><Send className="w-4 h-4" />Send {outreachForm.type === 'whatsapp' ? 'WhatsApp' : 'SMS'}</>}
                  </button>

                  <p className="text-center text-slate-500 text-xs">
                    For bulk messaging and templates → go to <span className="text-amber-400">Client Outreach</span> in the sidebar
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </BuilderPageWrapper>
    </FilterProvider>
  )
}
