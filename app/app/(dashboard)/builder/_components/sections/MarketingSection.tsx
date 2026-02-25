"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Mail, MessageSquare, Share2, Plus, Eye, Users,
  Sparkles, Send, TrendingUp, FileText, Globe, Shield,
  Building2, ArrowRight, Check, Loader2, AlertCircle,
  BarChart3, Target, Zap, Phone, ChevronRight, X,
  Copy, ExternalLink, Clock, Star, Flame, Activity,
  RefreshCw, Download, PieChart, ArrowUpRight, Inbox,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderDataContext, useRealtimeData, formatINR } from '../hooks/useBuilderData'

interface MarketingProps {
  onNavigate?: (section: string) => void
}

type TabId = 'overview' | 'campaigns' | 'email' | 'content'

export function MarketingSection({ onNavigate }: MarketingProps) {
  const { isAdmin } = useBuilderDataContext()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState<string | null>(null)
  const [showPropertyPicker, setShowPropertyPicker] = useState(false)

  // Real data from APIs
  const { data: analyticsData, refetch: refetchAnalytics } = useRealtimeData<{
    success: boolean
    leads_by_source: { source: string; count: number; percentage: number }[]
    total_value: number
    conversion_rate: number
    conversion_funnel: { stage: string; count: number }[]
    leads_by_status: { status: string; count: number }[]
  }>('/api/leads/analytics', { refreshInterval: 30000 })

  const { data: leadCountData } = useRealtimeData<{
    success: boolean
    data: { total: number; hot: number; warm: number; pending_interactions: number }
  }>('/api/leads/count', { refreshInterval: 30000 })

  const { data: propertiesData } = useRealtimeData<{
    items: { id: string; title: string; city: string; priceINR: number | null; image: string | null; views: number; inquiries: number; status: string }[]
  }>('/api/builder/properties')

  const { data: pipelineData } = useRealtimeData<{
    success: boolean
    data: { id: string; lead_id: string; stage: string; deal_value: number; lead?: { user?: { email: string; full_name: string; phone: string }; score: number } }[]
    total: number
  }>('/api/leads/pipeline', { refreshInterval: 30000 })

  const leadSources = analyticsData?.leads_by_source || []
  const totalLeads = leadCountData?.data?.total || 0
  const hotLeads = leadCountData?.data?.hot || 0
  const warmLeads = leadCountData?.data?.warm || 0
  const conversionRate = analyticsData?.conversion_rate || 0
  const pipelineValue = analyticsData?.total_value || 0
  const properties = propertiesData?.items || []
  const pipelineLeads = pipelineData?.data || []
  const conversionFunnel = analyticsData?.conversion_funnel || []

  // Derive metrics
  const totalFromMarketing = leadSources.reduce((sum, s) => sum + s.count, 0)
  const topSource = leadSources.length > 0 ? leadSources[0] : null

  // Send lead email to builder
  const sendLeadEmail = useCallback(async (leadEmail: string, leadName: string, propertyId: string) => {
    setEmailSending(true)
    setEmailSent(null)
    try {
      const res = await fetch('/api/marketing/form-analysis', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          form_data: {
            name: leadName,
            email: leadEmail,
            phone: '',
            additionalInfo: 'Sent from Marketing Hub campaign'
          }
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEmailSent(leadEmail)
        refetchAnalytics()
      }
    } catch (err) {
      console.error('[Marketing] Email send error:', err)
    } finally {
      setEmailSending(false)
    }
  }, [refetchAnalytics])

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'email', label: 'Email & Outreach', icon: Mail },
    { id: 'content', label: 'AI Content', icon: Sparkles },
  ]

  const SOURCE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
    website: { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' },
    google: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
    referral: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
    social: { bg: 'bg-purple-500/10', text: 'text-purple-400', bar: 'bg-purple-500' },
    direct: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', bar: 'bg-cyan-500' },
    campaign: { bg: 'bg-pink-500/10', text: 'text-pink-400', bar: 'bg-pink-500' },
  }

  function getSourceColor(source: string) {
    const key = source.toLowerCase()
    for (const [k, v] of Object.entries(SOURCE_COLORS)) {
      if (key.includes(k)) return v
    }
    return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', bar: 'bg-zinc-500' }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Marketing Hub</h1>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-[10px] text-amber-400 font-semibold">
                <Shield className="w-3 h-3" /> All Builders
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-1">Track campaigns, manage leads, and automate outreach</p>
        </div>
        <button
          onClick={() => setShowPropertyPicker(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-amber-500/10"
        >
          <Zap className="w-4 h-4" /> Launch Campaign
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/8', border: 'border-blue-500/12' },
          { label: 'Hot Leads', value: hotLeads, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/8', border: 'border-orange-500/12' },
          { label: 'Warm Leads', value: warmLeads, icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/12' },
          { label: 'Conversion', value: `${conversionRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/12' },
          { label: 'Pipeline', value: formatINR(pipelineValue), icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/8', border: 'border-purple-500/12' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={cn('border rounded-xl px-4 py-3', stat.bg, stat.border)}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-medium">{stat.label}</span>
              <stat.icon className={cn('w-4 h-4', stat.color)} />
            </div>
            <p className="text-xl font-bold text-zinc-100 mt-1 tabular-nums">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Overview Tab ───────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Lead Source Breakdown */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-zinc-200">Lead Sources</h2>
                <span className="text-[11px] text-zinc-500">{totalFromMarketing} total</span>
              </div>
              {leadSources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-2">
                    <PieChart className="w-5 h-5 text-zinc-600" />
                  </div>
                  <p className="text-xs text-zinc-600">No sources tracked yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leadSources.slice(0, 6).map((source, idx) => {
                    const colors = getSourceColor(source.source)
                    return (
                      <div key={source.source} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-2 h-2 rounded-full', colors.bar)} />
                            <span className="text-sm text-zinc-300 capitalize font-medium">{source.source || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-200 tabular-nums">{source.count}</span>
                            <span className="text-[11px] text-zinc-600 tabular-nums">{source.percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${source.percentage}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                            className={cn('h-full rounded-full', colors.bar)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Conversion Funnel */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-zinc-200">Conversion Funnel</h2>
                <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-md',
                  conversionRate >= 10 ? 'bg-emerald-500/10 text-emerald-400' : conversionRate >= 5 ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-500/10 text-zinc-400'
                )}>
                  {conversionRate.toFixed(1)}% conversion
                </span>
              </div>
              {conversionFunnel.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-2">
                    <BarChart3 className="w-5 h-5 text-zinc-600" />
                  </div>
                  <p className="text-xs text-zinc-600">No funnel data yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversionFunnel.map((stage, idx) => {
                    const maxCount = Math.max(...conversionFunnel.map(s => s.count), 1)
                    const percentage = (stage.count / maxCount) * 100
                    const funnelColors = ['bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500']
                    return (
                      <div key={stage.stage}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-zinc-300 capitalize font-medium">{stage.stage.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-bold text-zinc-200 tabular-nums">{stage.count}</span>
                        </div>
                        <div className="h-8 bg-zinc-800/30 rounded-lg overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                            className={cn('h-full rounded-lg opacity-20', funnelColors[idx % funnelColors.length])}
                          />
                          <div className="absolute inset-0 flex items-center px-3">
                            <div className={cn('w-1.5 h-1.5 rounded-full mr-2', funnelColors[idx % funnelColors.length])} />
                            <span className="text-xs text-zinc-400">{stage.stage.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Pipeline Leads */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-200">Recent Leads in Pipeline</h2>
              <button onClick={() => onNavigate?.('leads')} className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {pipelineLeads.length === 0 ? (
              <div className="text-center py-8">
                <Inbox className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-600">No leads in pipeline yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pipelineLeads.slice(0, 5).map(lead => {
                  const name = lead.lead?.user?.full_name || lead.lead?.user?.email?.split('@')[0] || 'Unknown'
                  const score = lead.lead?.score || 0
                  return (
                    <div key={lead.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/60 border border-zinc-800/40 rounded-xl hover:border-zinc-700/60 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                        {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{name}</p>
                        <p className="text-[11px] text-zinc-600 capitalize">{lead.stage.replace(/_/g, ' ')}</p>
                      </div>
                      {lead.deal_value > 0 && (
                        <span className="text-xs text-amber-400 font-semibold">{formatINR(lead.deal_value)}</span>
                      )}
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-md border',
                        score >= 70 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        score >= 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                      )}>
                        {score}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Campaigns Tab ──────────────────────────────────────────── */}
      {activeTab === 'campaigns' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Lead Source Performance */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-200">Campaign Performance by Source</h2>
              <button onClick={() => refetchAnalytics()} className="p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors">
                <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            </div>
            {leadSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-3">
                  <Megaphone className="w-6 h-6 text-zinc-600" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-1">No campaigns yet</h3>
                <p className="text-xs text-zinc-600 text-center max-w-[280px]">Launch your first campaign to start tracking lead sources and conversion metrics</p>
                <button
                  onClick={() => setShowPropertyPicker(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create First Campaign
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {leadSources.map((source, idx) => {
                  const colors = getSourceColor(source.source)
                  return (
                    <div key={source.source} className={cn('border rounded-xl p-4 transition-colors hover:border-zinc-700/60', colors.bg, 'border-zinc-800/40')}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bg)}>
                          <Globe className={cn('w-4 h-4', colors.text)} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-200 capitalize">{source.source || 'Unknown'}</h3>
                          <p className="text-[11px] text-zinc-500">{source.percentage.toFixed(0)}% of total</p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-zinc-100 tabular-nums">{source.count}</span>
                        <span className="text-xs text-zinc-500">leads</span>
                      </div>
                      <div className="h-1 bg-zinc-800/50 rounded-full overflow-hidden mt-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${source.percentage}%` }}
                          transition={{ duration: 0.6 }}
                          className={cn('h-full rounded-full', colors.bar)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Properties Performance */}
          {properties.length > 0 && (
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-zinc-200 mb-4">Property Engagement</h2>
              <div className="space-y-2">
                {properties.slice(0, 5).map(prop => (
                  <div key={prop.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/60 border border-zinc-800/40 rounded-xl hover:border-zinc-700/60 transition-colors">
                    {prop.image && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                        <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{prop.title}</p>
                      <p className="text-[11px] text-zinc-500">{prop.city} {prop.priceINR ? `\u00b7 ${formatINR(prop.priceINR)}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{prop.views}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{prop.inquiries}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProperty(prop.id)
                        setActiveTab('email')
                      }}
                      className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[11px] font-semibold hover:bg-amber-500/20 transition-colors"
                    >
                      Send to Leads
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Email & Outreach Tab ───────────────────────────────────── */}
      {activeTab === 'email' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Email Campaign Builder */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-zinc-200 mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-zinc-500" /> Send Lead Reports via Email
            </h2>

            {/* Step 1: Select Property */}
            <div className="mb-5">
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">Step 1: Select Property</label>
              {properties.length === 0 ? (
                <div className="text-center py-6 bg-zinc-900/60 rounded-xl border border-zinc-800/40">
                  <Building2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-600">No properties listed yet. Upload a property first.</p>
                  <button
                    onClick={() => onNavigate?.('properties')}
                    className="mt-3 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                  >
                    Go to Properties <ArrowRight className="w-3 h-3 inline ml-1" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {properties.slice(0, 4).map(prop => (
                    <button
                      key={prop.id}
                      onClick={() => setSelectedProperty(prop.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                        selectedProperty === prop.id
                          ? 'bg-amber-500/8 border-amber-500/30 ring-1 ring-amber-500/20'
                          : 'bg-zinc-900/60 border-zinc-800/40 hover:border-zinc-700/60'
                      )}
                    >
                      {prop.image && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                          <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{prop.title}</p>
                        <p className="text-[11px] text-zinc-500">{prop.city}</p>
                      </div>
                      {selectedProperty === prop.id && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-zinc-950" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Select Leads */}
            {selectedProperty && (
              <div className="mb-5">
                <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-2 block">
                  Step 2: Send AI Analysis to Leads ({pipelineLeads.length} available)
                </label>
                {pipelineLeads.length === 0 ? (
                  <div className="text-center py-6 bg-zinc-900/60 rounded-xl border border-zinc-800/40">
                    <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-xs text-zinc-600">No leads in pipeline. Add leads first from the Pipeline section.</p>
                    <button
                      onClick={() => onNavigate?.('leads')}
                      className="mt-3 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    >
                      Go to Pipeline <ArrowRight className="w-3 h-3 inline ml-1" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {pipelineLeads.map(lead => {
                      const name = lead.lead?.user?.full_name || 'Unknown'
                      const email = lead.lead?.user?.email || ''
                      const score = lead.lead?.score || 0
                      const isSent = emailSent === email
                      return (
                        <div key={lead.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/60 border border-zinc-800/40 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 flex-shrink-0">
                            {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">{name}</p>
                            <p className="text-[11px] text-zinc-600 truncate">{email}</p>
                          </div>
                          <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                            score >= 70 ? 'bg-orange-500/10 text-orange-400' :
                            score >= 40 ? 'bg-amber-500/10 text-amber-400' :
                            'bg-zinc-800 text-zinc-500'
                          )}>
                            {score}
                          </span>
                          {isSent ? (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <Check className="w-3 h-3" /> Sent
                            </span>
                          ) : (
                            <button
                              onClick={() => email && sendLeadEmail(email, name, selectedProperty)}
                              disabled={emailSending || !email}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[11px] font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-40"
                            >
                              {emailSending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Send Email
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* How it works */}
            <div className="mt-4 p-4 bg-zinc-900/60 border border-zinc-800/40 rounded-xl">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">How it works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { step: '1', title: 'Select Property', desc: 'Choose a property to promote', icon: Building2 },
                  { step: '2', title: 'AI Analyzes Match', desc: 'GPT-4 scores lead-property fit', icon: Sparkles },
                  { step: '3', title: 'Email Delivered', desc: 'Personalized report sent to lead', icon: Mail },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-[11px] font-bold text-amber-400 flex-shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-300">{s.title}</p>
                      <p className="text-[11px] text-zinc-600">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── AI Content Tab ─────────────────────────────────────────── */}
      {activeTab === 'content' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* AI Content Generator */}
          <div className="bg-gradient-to-br from-purple-500/5 via-transparent to-transparent border border-purple-500/15 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-zinc-100 mb-1">AI Content Generator</h3>
                <p className="text-sm text-zinc-500 mb-4">Generate professional marketing content instantly with AI</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'Property Description', desc: 'Compelling listing copy', icon: FileText, color: 'purple' },
                    { label: 'Market Report', desc: 'Area analysis & trends', icon: BarChart3, color: 'blue' },
                    { label: 'Social Post', desc: 'Instagram & Facebook', icon: Share2, color: 'pink' },
                  ].map(item => (
                    <button key={item.label} className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border text-left transition-all hover:border-zinc-700',
                      `bg-${item.color}-500/5 border-${item.color}-500/15`
                    )}>
                      <item.icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', `text-${item.color}-400`)} />
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                        <p className="text-[11px] text-zinc-500">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content Templates */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-zinc-200 mb-4">Content Templates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Property Launch', desc: 'Announce a new listing with all key details', tag: 'Email' },
                { title: 'Price Drop Alert', desc: 'Notify leads about price reductions', tag: 'WhatsApp' },
                { title: 'Market Update', desc: 'Share monthly area price trends', tag: 'Email' },
                { title: 'Open House Invite', desc: 'Invite leads to visit scheduled properties', tag: 'SMS' },
              ].map(t => (
                <div key={t.title} className="flex items-start gap-3 p-4 bg-zinc-900/60 border border-zinc-800/40 rounded-xl hover:border-zinc-700/60 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800/60 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-zinc-200">{t.title}</p>
                      <span className="text-[9px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded font-medium">{t.tag}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{t.desc}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Property Picker Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {showPropertyPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
              onClick={() => setShowPropertyPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[15%] max-w-lg mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl z-[2001] overflow-hidden shadow-2xl shadow-black/40"
            >
              <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-100">Launch Campaign</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Select a property to promote</p>
                </div>
                <button onClick={() => setShowPropertyPicker(false)} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              <div className="p-5 max-h-[400px] overflow-y-auto space-y-2">
                {properties.length === 0 ? (
                  <div className="text-center py-10">
                    <Building2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-400 font-medium">No properties available</p>
                    <p className="text-xs text-zinc-600 mt-1">Upload a property first to launch campaigns</p>
                  </div>
                ) : (
                  properties.map(prop => (
                    <button
                      key={prop.id}
                      onClick={() => {
                        setSelectedProperty(prop.id)
                        setShowPropertyPicker(false)
                        setActiveTab('email')
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/40 hover:border-zinc-700/60 transition-all text-left"
                    >
                      {prop.image && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                          <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{prop.title}</p>
                        <p className="text-[11px] text-zinc-500">{prop.city} {prop.priceINR ? `\u00b7 ${formatINR(prop.priceINR)}` : ''}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-600" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
