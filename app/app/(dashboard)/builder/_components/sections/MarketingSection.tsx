"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Mail, Share2, Plus, Eye, Users,
  Sparkles, Send, TrendingUp, FileText, Globe, Shield,
  Building2, ArrowRight, Check, Loader2,
  BarChart3, Target, Zap, ChevronRight, X,
  Copy, ExternalLink, Clock, Flame, Activity,
  RefreshCw, PieChart, ArrowUpRight, Inbox,
  CheckCircle2, AlertCircle, LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderDataContext, useRealtimeData, formatINR } from '../hooks/useBuilderData'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MarketingProps {
  onNavigate?: (section: string) => void
}

type TabId = 'overview' | 'campaigns' | 'email' | 'content'

interface PipelineLead {
  id: string
  lead_id: string
  stage: string
  deal_value: number
  lead?: {
    user?: { email: string; full_name: string; phone: string }
    score: number
  }
}

interface Property {
  id: string
  title: string
  city: string
  priceINR: number | null
  image: string | null
  views: number
  inquiries: number
  status: string
}

// ─── Source color map ─────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, { bg: string; text: string; bar: string; border: string }> = {
  website:  { bg: 'bg-blue-500/8',   text: 'text-blue-400',   bar: 'bg-blue-500',   border: 'border-blue-500/20' },
  google:   { bg: 'bg-emerald-500/8', text: 'text-emerald-400', bar: 'bg-emerald-500', border: 'border-emerald-500/20' },
  referral: { bg: 'bg-amber-500/8',  text: 'text-amber-400',  bar: 'bg-amber-500',  border: 'border-amber-500/20' },
  social:   { bg: 'bg-purple-500/8', text: 'text-purple-400', bar: 'bg-purple-500', border: 'border-purple-500/20' },
  direct:   { bg: 'bg-cyan-500/8',   text: 'text-cyan-400',   bar: 'bg-cyan-500',   border: 'border-cyan-500/20' },
  campaign: { bg: 'bg-pink-500/8',   text: 'text-pink-400',   bar: 'bg-pink-500',   border: 'border-pink-500/20' },
}

function getSourceColor(source: string) {
  const key = source.toLowerCase()
  for (const [k, v] of Object.entries(SOURCE_COLORS)) {
    if (key.includes(k)) return v
  }
  return { bg: 'bg-zinc-500/8', text: 'text-zinc-400', bar: 'bg-zinc-500', border: 'border-zinc-500/20' }
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function FlowBanner() {
  const steps = [
    { icon: Building2, label: 'Upload Property', desc: 'List your project', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { icon: Megaphone, label: 'Launch Campaign', desc: 'Share & promote', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { icon: Users, label: 'Capture Leads', desc: 'Auto-collected', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { icon: Mail, label: 'Email Builder', desc: 'AI-powered report', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ]

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
      <div className="flex items-center gap-1 sm:gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center flex-1 min-w-0">
            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0', step.bg, step.border)}>
                <step.icon className={cn('w-4 h-4', step.color)} />
              </div>
              <div className="text-center hidden sm:block">
                <p className="text-[11.5px] font-semibold text-zinc-200">{step.label}</p>
                <p className="text-[10px] text-zinc-600">{step.desc}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 flex-shrink-0 flex items-start pt-[10px] justify-center">
                <ChevronRight className="w-4 h-4 text-zinc-700" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MarketingSection({ onNavigate }: MarketingProps) {
  const { isAdmin } = useBuilderDataContext()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  const [emailSending, setEmailSending] = useState<string | null>(null) // leadId being sent
  const [sentEmails, setSentEmails] = useState<Set<string>>(new Set())
  const [showPropertyPicker, setShowPropertyPicker] = useState(false)
  const [aiGenerating, setAiGenerating] = useState<string | null>(null)
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // ── Data fetching ──────────────────────────────────────────────────────────
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
    items: Property[]
  }>('/api/builder/properties')

  const { data: pipelineData } = useRealtimeData<{
    success: boolean
    data: PipelineLead[]
    total: number
  }>('/api/leads/pipeline', { refreshInterval: 30000 })

  // ── Derived values ─────────────────────────────────────────────────────────
  const leadSources = analyticsData?.leads_by_source || []
  const totalLeads = leadCountData?.data?.total || 0
  const hotLeads = leadCountData?.data?.hot || 0
  const warmLeads = leadCountData?.data?.warm || 0
  const conversionRate = analyticsData?.conversion_rate || 0
  const pipelineValue = analyticsData?.total_value || 0
  const properties = propertiesData?.items || []
  const pipelineLeads = pipelineData?.data || []
  const conversionFunnel = analyticsData?.conversion_funnel || []
  const totalFromMarketing = leadSources.reduce((sum, s) => sum + s.count, 0)

  // ── Send lead email (uses /api/marketing/form-analysis) ────────────────────
  const sendLeadEmail = useCallback(
    async (lead: PipelineLead, propertyId: string) => {
      const email = lead.lead?.user?.email
      const name = lead.lead?.user?.full_name || 'Lead'
      const phone = lead.lead?.user?.phone || ''
      if (!email || !propertyId) return

      setEmailSending(lead.id)
      try {
        const res = await fetch('/api/marketing/form-analysis', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            property_id: propertyId,
            form_data: {
              name,
              email,
              phone,
              additionalInfo: 'Sent from Marketing Hub — AI Lead Analysis',
            },
          }),
        })
        const data = await res.json()
        if (data.success) {
          setSentEmails((prev) => new Set(prev).add(lead.id))
          refetchAnalytics()
        }
      } catch (err) {
        console.error('[Marketing] Email send error:', err)
      } finally {
        setEmailSending(null)
      }
    },
    [refetchAnalytics]
  )

  // Send AI analysis to all hot leads at once
  const sendToAllHotLeads = useCallback(async () => {
    if (!selectedProperty) return
    const hotLeadsList = pipelineLeads.filter(
      (l) => (l.lead?.score || 0) >= 70 && l.lead?.user?.email
    )
    for (const lead of hotLeadsList) {
      if (!sentEmails.has(lead.id)) {
        await sendLeadEmail(lead, selectedProperty)
      }
    }
  }, [selectedProperty, pipelineLeads, sentEmails, sendLeadEmail])

  // Simulate AI content generation
  const generateContent = useCallback(async (type: string) => {
    setAiGenerating(type)
    await new Promise((r) => setTimeout(r, 1800))
    const samples: Record<string, string> = {
      'Property Description':
        "Discover luxury living at its finest. This meticulously crafted residence offers spacious interiors, premium finishes, and breathtaking views. Every detail has been thoughtfully designed to elevate your lifestyle. Prime location with easy access to top schools, shopping centers, and business hubs. Schedule a site visit today.",
      'Market Report':
        "The local real estate market has seen a 12% appreciation over the last quarter. Demand from IT professionals and young families is driving prices upward. New infrastructure projects are expected to further boost valuations in the next 12-18 months. Inventory remains tight at 2.3 months of supply.",
      'Social Post':
        "✨ Your dream home is now a reality! Introducing [Property Name] — where luxury meets comfort. 3 & 4 BHK apartments starting at ₹X Cr. 🏡 Modern amenities | Prime location | RERA Registered. Limited units available. DM us or call now! #RealEstate #DreamHome #LuxuryLiving",
    }
    setGeneratedContent((prev) => ({ ...prev, [type]: samples[type] || 'Generated content...' }))
    setAiGenerating(null)
  }, [])

  const copyContent = useCallback((key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }, [])

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'email', label: 'Email & Outreach', icon: Mail },
    { id: 'content', label: 'AI Content', icon: Sparkles },
  ]

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Marketing Hub</h1>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-400 font-semibold">
                <Shield className="w-3 h-3" /> All Builders
              </span>
            )}
          </div>
          <p className="text-[13px] text-zinc-500 mt-1">
            Track campaigns, manage leads, and automate outreach
          </p>
        </div>
        <button
          onClick={() => setShowPropertyPicker(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-[13px] font-bold transition-colors shadow-lg shadow-amber-500/15"
        >
          <Zap className="w-4 h-4" /> Launch Campaign
        </button>
      </div>

      {/* ── Flow Banner ──────────────────────────────────────────────────── */}
      <FlowBanner />

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Leads', value: String(totalLeads), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/6 border-blue-500/12' },
          { label: 'Hot Leads', value: String(hotLeads), icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/6 border-orange-500/12' },
          { label: 'Warm Leads', value: String(warmLeads), icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/6 border-amber-500/12' },
          { label: 'Conversion', value: `${conversionRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/6 border-emerald-500/12' },
          { label: 'Pipeline', value: formatINR(pipelineValue), icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/6 border-purple-500/12' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 30 }}
            className={cn('border rounded-2xl px-4 py-3', stat.bg)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-zinc-500 font-medium">{stat.label}</span>
              <stat.icon className={cn('w-3.5 h-3.5', stat.color)} />
            </div>
            <p className="text-[20px] font-bold text-zinc-100 tabular-nums">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all flex-1 justify-center sm:flex-none sm:justify-start',
                activeTab === tab.id
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Lead Source Breakdown */}
              <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[13px] font-bold text-zinc-200">Lead Sources</h2>
                  <span className="text-[11px] text-zinc-500 tabular-nums">{totalFromMarketing} total</span>
                </div>
                {leadSources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <PieChart className="w-8 h-8 text-zinc-700 mb-2" />
                    <p className="text-[12px] text-zinc-600">No sources tracked yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leadSources.slice(0, 6).map((source, idx) => {
                      const colors = getSourceColor(source.source)
                      return (
                        <div key={source.source}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-2 h-2 rounded-full', colors.bar)} />
                              <span className="text-[13px] text-zinc-300 capitalize font-medium">
                                {source.source || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-bold text-zinc-200 tabular-nums">{source.count}</span>
                              <span className="text-[11px] text-zinc-600 tabular-nums w-8 text-right">
                                {source.percentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${source.percentage}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.08 }}
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
                  <h2 className="text-[13px] font-bold text-zinc-200">Conversion Funnel</h2>
                  <span
                    className={cn(
                      'text-[11px] font-semibold px-2 py-0.5 rounded-lg',
                      conversionRate >= 10
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : conversionRate >= 5
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-zinc-500/10 text-zinc-400'
                    )}
                  >
                    {conversionRate.toFixed(1)}% conv.
                  </span>
                </div>
                {conversionFunnel.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <BarChart3 className="w-8 h-8 text-zinc-700 mb-2" />
                    <p className="text-[12px] text-zinc-600">No funnel data yet</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {conversionFunnel.map((stage, idx) => {
                      const maxCount = Math.max(...conversionFunnel.map((s) => s.count), 1)
                      const pct = (stage.count / maxCount) * 100
                      const barColors = ['bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500']
                      const bar = barColors[idx % barColors.length]
                      return (
                        <div key={stage.stage}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] text-zinc-400 capitalize">
                              {stage.stage.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[12px] font-bold text-zinc-200 tabular-nums">{stage.count}</span>
                          </div>
                          <div className="h-6 bg-zinc-800/30 rounded-lg overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, delay: idx * 0.08 }}
                              className={cn('h-full rounded-lg opacity-30', bar)}
                            />
                            <div className="absolute inset-0 flex items-center px-2.5">
                              <div className={cn('w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0', bar)} />
                              <span className="text-[11px] text-zinc-500 capitalize">
                                {stage.stage.replace(/_/g, ' ')}
                              </span>
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
                <h2 className="text-[13px] font-bold text-zinc-200">Recent Leads in Pipeline</h2>
                <button
                  onClick={() => onNavigate?.('leads')}
                  className="flex items-center gap-1 text-[12px] text-amber-400 hover:text-amber-300 transition-colors"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {pipelineLeads.length === 0 ? (
                <div className="text-center py-8">
                  <Inbox className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-[12px] text-zinc-600">No leads in pipeline yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pipelineLeads.slice(0, 5).map((lead) => {
                    const name =
                      lead.lead?.user?.full_name ||
                      lead.lead?.user?.email?.split('@')[0] ||
                      'Unknown'
                    const score = lead.lead?.score || 0
                    return (
                      <div
                        key={lead.id}
                        className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/60 border border-zinc-800/40 rounded-xl hover:border-zinc-700/60 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 flex-shrink-0">
                          {getInitials(name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-zinc-200 truncate">{name}</p>
                          <p className="text-[11px] text-zinc-600 capitalize">
                            {lead.stage.replace(/_/g, ' ')}
                          </p>
                        </div>
                        {lead.deal_value > 0 && (
                          <span className="text-[12px] text-amber-400 font-semibold tabular-nums">
                            {formatINR(lead.deal_value)}
                          </span>
                        )}
                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-lg border tabular-nums',
                            score >= 70
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                              : score >= 40
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                          )}
                        >
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

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <motion.div
            key="campaigns"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            {/* Campaign Performance */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-bold text-zinc-200">Performance by Source</h2>
                <button
                  onClick={() => refetchAnalytics()}
                  className="p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              </div>
              {leadSources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-3">
                    <Megaphone className="w-6 h-6 text-zinc-600" />
                  </div>
                  <h3 className="text-[13px] font-semibold text-zinc-300 mb-1">No campaigns yet</h3>
                  <p className="text-[11px] text-zinc-600 text-center max-w-[260px]">
                    Launch your first campaign to start tracking lead sources
                  </p>
                  <button
                    onClick={() => setShowPropertyPicker(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-[13px] font-semibold hover:bg-amber-500/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Create First Campaign
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {leadSources.map((source, idx) => {
                    const colors = getSourceColor(source.source)
                    return (
                      <motion.div
                        key={source.source}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className={cn(
                          'border rounded-2xl p-4 transition-colors hover:border-zinc-700/60',
                          colors.bg,
                          colors.border
                        )}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', colors.bg, colors.border, 'border')}>
                            <Globe className={cn('w-4 h-4', colors.text)} />
                          </div>
                          <div>
                            <h3 className="text-[13px] font-semibold text-zinc-200 capitalize">
                              {source.source || 'Unknown'}
                            </h3>
                            <p className="text-[10.5px] text-zinc-500 tabular-nums">
                              {source.percentage.toFixed(0)}% of total
                            </p>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1 mb-3">
                          <span className="text-[22px] font-bold text-zinc-100 tabular-nums">{source.count}</span>
                          <span className="text-[12px] text-zinc-500">leads</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${source.percentage}%` }}
                            transition={{ duration: 0.7, delay: idx * 0.06 }}
                            className={cn('h-full rounded-full', colors.bar)}
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Property Engagement */}
            {properties.length > 0 && (
              <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
                <h2 className="text-[13px] font-bold text-zinc-200 mb-4">Property Engagement</h2>
                <div className="space-y-2">
                  {properties.slice(0, 5).map((prop) => (
                    <div
                      key={prop.id}
                      className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/60 border border-zinc-800/40 rounded-xl hover:border-zinc-700/60 transition-colors"
                    >
                      {prop.image && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                          <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-zinc-200 truncate">{prop.title}</p>
                        <p className="text-[11px] text-zinc-500">
                          {prop.city}
                          {prop.priceINR ? ` · ${formatINR(prop.priceINR)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[12px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span className="tabular-nums">{prop.views}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span className="tabular-nums">{prop.inquiries}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProperty(prop.id)
                          setActiveTab('email')
                        }}
                        className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[11px] font-semibold hover:bg-amber-500/20 transition-colors flex-shrink-0"
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

        {/* Email & Outreach Tab */}
        {activeTab === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
              <h2 className="text-[13px] font-bold text-zinc-200 mb-5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-500" />
                Send AI Lead Analysis via Email
              </h2>

              {/* Step 1: Select Property */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center text-[10px] font-bold text-amber-400 flex-shrink-0">
                    1
                  </div>
                  <label className="text-[11.5px] text-zinc-400 font-semibold uppercase tracking-wider">
                    Select Property
                  </label>
                  {selectedProperty && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
                  )}
                </div>

                {properties.length === 0 ? (
                  <div className="text-center py-6 bg-zinc-900/60 rounded-xl border border-zinc-800/40">
                    <Building2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-[12px] text-zinc-600">No properties yet. Upload one first.</p>
                    <button
                      onClick={() => onNavigate?.('properties')}
                      className="mt-3 text-[12px] text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    >
                      Go to Properties <ArrowRight className="w-3 h-3 inline ml-0.5" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {properties.slice(0, 4).map((prop) => (
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
                        {prop.image ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                            <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-zinc-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-zinc-200 truncate">{prop.title}</p>
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

              {/* Step 2: Select & Send to Leads */}
              {selectedProperty && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center text-[10px] font-bold text-blue-400 flex-shrink-0">
                      2
                    </div>
                    <label className="text-[11.5px] text-zinc-400 font-semibold uppercase tracking-wider">
                      Send AI Analysis to Leads
                    </label>
                    <span className="text-[11px] text-zinc-600 ml-1">
                      ({pipelineLeads.length} available)
                    </span>
                    {pipelineLeads.filter((l) => (l.lead?.score || 0) >= 70 && l.lead?.user?.email).length > 0 && (
                      <button
                        onClick={sendToAllHotLeads}
                        disabled={!!emailSending}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg text-[11px] font-semibold hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                      >
                        <Flame className="w-3 h-3" />
                        Send to Hot Leads
                      </button>
                    )}
                  </div>

                  {pipelineLeads.length === 0 ? (
                    <div className="text-center py-6 bg-zinc-900/60 rounded-xl border border-zinc-800/40">
                      <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-[12px] text-zinc-600">No leads in pipeline yet.</p>
                      <button
                        onClick={() => onNavigate?.('leads')}
                        className="mt-3 text-[12px] text-amber-400 hover:text-amber-300 font-medium transition-colors"
                      >
                        Go to Pipeline <ArrowRight className="w-3 h-3 inline ml-0.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      {pipelineLeads.map((lead) => {
                        const name = lead.lead?.user?.full_name || 'Unknown'
                        const email = lead.lead?.user?.email || ''
                        const score = lead.lead?.score || 0
                        const isSent = sentEmails.has(lead.id)
                        const isSending = emailSending === lead.id

                        return (
                          <div
                            key={lead.id}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 border rounded-xl transition-all',
                              isSent
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-zinc-900/60 border-zinc-800/40'
                            )}
                          >
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 flex-shrink-0">
                              {getInitials(name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-zinc-200 truncate">{name}</p>
                              <p className="text-[11px] text-zinc-600 truncate">{email || 'No email'}</p>
                            </div>
                            <span
                              className={cn(
                                'text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums flex-shrink-0',
                                score >= 70
                                  ? 'bg-orange-500/10 text-orange-400'
                                  : score >= 40
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-zinc-800 text-zinc-500'
                              )}
                            >
                              {score}
                            </span>
                            {isSent ? (
                              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold flex-shrink-0">
                                <Check className="w-3.5 h-3.5" /> Sent
                              </span>
                            ) : (
                              <button
                                onClick={() => sendLeadEmail(lead, selectedProperty)}
                                disabled={!!emailSending || !email}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[11px] font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-40 flex-shrink-0"
                              >
                                {isSending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                                Send
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
              <div className="mt-4 p-4 bg-zinc-900/60 border border-zinc-800/40 rounded-2xl">
                <h3 className="text-[10.5px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  How it works
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { step: '1', title: 'Select Property', desc: 'Choose a property to promote', icon: Building2 },
                    { step: '2', title: 'AI Analyzes Match', desc: 'GPT-4o scores lead-property fit', icon: Sparkles },
                    { step: '3', title: 'Email Delivered', desc: 'Personalized report sent via Resend', icon: Mail },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-[11px] font-bold text-amber-400 flex-shrink-0">
                        {s.step}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-zinc-300">{s.title}</p>
                        <p className="text-[11px] text-zinc-600">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Content Tab */}
        {activeTab === 'content' && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            {/* AI Generator */}
            <div className="bg-gradient-to-br from-violet-500/5 via-transparent to-transparent border border-violet-500/15 rounded-2xl p-5">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-zinc-100">AI Content Generator</h3>
                  <p className="text-[13px] text-zinc-500 mt-0.5">Generate professional marketing content instantly</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Property Description', desc: 'Compelling listing copy', icon: FileText, color: 'text-violet-400', bg: 'bg-violet-500/8', border: 'border-violet-500/15' },
                  { label: 'Market Report', desc: 'Area analysis & trends', icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/8', border: 'border-blue-500/15' },
                  { label: 'Social Post', desc: 'Instagram & Facebook', icon: Share2, color: 'text-pink-400', bg: 'bg-pink-500/8', border: 'border-pink-500/15' },
                ].map((item) => (
                  <div key={item.label} className={cn('rounded-xl border p-4 transition-all', item.bg, item.border)}>
                    <div className="flex items-start gap-3 mb-3">
                      <item.icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', item.color)} />
                      <div>
                        <p className="text-[13px] font-semibold text-zinc-200">{item.label}</p>
                        <p className="text-[11px] text-zinc-500">{item.desc}</p>
                      </div>
                    </div>

                    {generatedContent[item.label] ? (
                      <div className="space-y-2">
                        <p className="text-[11.5px] text-zinc-400 leading-relaxed bg-zinc-900/60 rounded-lg p-3 border border-zinc-800/40 line-clamp-4">
                          {generatedContent[item.label]}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyContent(item.label, generatedContent[item.label])}
                            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 rounded-lg text-[11px] font-medium transition-colors flex-1 justify-center"
                          >
                            {copiedKey === item.label ? (
                              <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Copy</>
                            )}
                          </button>
                          <button
                            onClick={() => generateContent(item.label)}
                            disabled={aiGenerating === item.label}
                            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 rounded-lg text-[11px] font-medium transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => generateContent(item.label)}
                        disabled={aiGenerating === item.label}
                        className={cn(
                          'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-semibold transition-colors',
                          item.bg,
                          item.color,
                          'hover:opacity-80 disabled:opacity-50'
                        )}
                      >
                        {aiGenerating === item.label ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                        ) : (
                          <><Sparkles className="w-3.5 h-3.5" /> Generate</>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content Templates */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
              <h2 className="text-[13px] font-bold text-zinc-200 mb-4">Content Templates</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: 'Property Launch', desc: 'Announce a new listing with all key details', tag: 'Email', color: 'text-blue-400' },
                  { title: 'Price Drop Alert', desc: 'Notify leads about price reductions', tag: 'WhatsApp', color: 'text-emerald-400' },
                  { title: 'Market Update', desc: 'Share monthly area price trends', tag: 'Email', color: 'text-violet-400' },
                  { title: 'Open House Invite', desc: 'Invite leads to visit scheduled properties', tag: 'SMS', color: 'text-amber-400' },
                ].map((t) => (
                  <button
                    key={t.title}
                    className="flex items-start gap-3 p-4 bg-zinc-900/60 border border-zinc-800/40 rounded-xl hover:border-zinc-700/60 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-zinc-800/60 flex items-center justify-center flex-shrink-0">
                      <FileText className={cn('w-4 h-4', t.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-semibold text-zinc-200">{t.title}</p>
                        <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded font-medium">
                          {t.tag}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-zinc-500">{t.desc}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-700 flex-shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Property Picker Modal ─────────────────────────────────────────── */}
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
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-4 top-[15%] max-w-lg mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl z-[2001] overflow-hidden shadow-2xl shadow-black/40"
            >
              <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-bold text-zinc-100">Launch Campaign</h2>
                  <p className="text-[12px] text-zinc-500 mt-0.5">Select a property to promote</p>
                </div>
                <button
                  onClick={() => setShowPropertyPicker(false)}
                  className="p-2 rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              <div className="p-4 max-h-[420px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {properties.length === 0 ? (
                  <div className="text-center py-10">
                    <Building2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-[13px] text-zinc-400 font-medium">No properties available</p>
                    <p className="text-[11px] text-zinc-600 mt-1">Upload a property first to launch campaigns</p>
                    <button
                      onClick={() => {
                        setShowPropertyPicker(false)
                        onNavigate?.('properties')
                      }}
                      className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-[13px] font-semibold mx-auto hover:bg-amber-500/20 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Property
                    </button>
                  </div>
                ) : (
                  properties.map((prop) => (
                    <button
                      key={prop.id}
                      onClick={() => {
                        setSelectedProperty(prop.id)
                        setShowPropertyPicker(false)
                        setActiveTab('email')
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/40 hover:border-zinc-700/60 transition-all text-left"
                    >
                      {prop.image ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                          <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-zinc-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-zinc-200 truncate">{prop.title}</p>
                        <p className="text-[11px] text-zinc-500">
                          {prop.city}
                          {prop.priceINR ? ` · ${formatINR(prop.priceINR)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-600 flex-shrink-0">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />{prop.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />{prop.inquiries}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
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
