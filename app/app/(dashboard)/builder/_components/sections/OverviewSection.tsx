"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Building2, TrendingUp,
  ArrowUpRight, ArrowDownRight, Eye, Zap,
  Target, Phone, Mail,
  BarChart3, Activity, Sparkles, Shield,
  Clock, IndianRupee, UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderDataContext, useRealtimeData, formatINR, timeAgo } from '../hooks/useBuilderData'

interface OverviewProps {
  onNavigate?: (section: string) => void
}

// Pipeline stage from API
interface PipelineItem {
  id: string
  lead_id: string
  builder_id: string
  stage: string
  stage_order: number
  deal_value: number
  probability: number
  last_activity_at: string
  lead?: {
    id: string
    category: string
    score: number
    last_activity: string
    user?: {
      email: string
      full_name: string
      phone: string
    }
  }
}

// Real-time stats shape
interface RealtimeStats {
  totalLeads: number
  hotLeads: number
  warmLeads: number
  totalProperties: number
  activeProperties: number
  totalViews: number
  totalInquiries: number
  conversionRate: number
  timestamp: string
}

// AI insights response shape
interface AIInsightsResponse {
  success: boolean
  data?: {
    metrics?: any
    aiInsights?: {
      keyFindings: string[]
      performanceSummary: string
      opportunities: string[]
      risks: string[]
    }
    recommendations?: {
      title: string
      description: string
      priority: string
      category: string
    }[]
  }
}

const PIPELINE_STAGES = [
  { key: 'new', label: 'New', color: 'bg-blue-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-cyan-500' },
  { key: 'qualified', label: 'Qualified', color: 'bg-purple-500' },
  { key: 'site_visit_scheduled', label: 'Site Visit', color: 'bg-orange-500' },
  { key: 'site_visit_completed', label: 'Visit Done', color: 'bg-yellow-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-violet-500' },
  { key: 'offer_made', label: 'Offer Made', color: 'bg-pink-500' },
  { key: 'closed_won', label: 'Closed Won', color: 'bg-emerald-500' },
  { key: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500' },
]

export function OverviewSection({ onNavigate }: OverviewProps) {
  const { isAdmin, companyName, isAuthenticated } = useBuilderDataContext()
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [aiOpportunities, setAiOpportunities] = useState<string[]>([])

  // Real-time stats - refresh every 30s
  const { data: statsData, isLoading: statsLoading } = useRealtimeData<RealtimeStats>(
    '/api/builder/stats/realtime',
    { refreshInterval: 30000 }
  )

  // Lead counts - refresh every 30s
  const { data: leadCountData, isLoading: leadsLoading } = useRealtimeData<{
    success: boolean
    data: { total: number; hot: number; warm: number; pending_interactions: number }
  }>('/api/leads/count', { refreshInterval: 30000 })

  // Pipeline data (supports admin access) - refresh every 30s
  const { data: pipelineData, isLoading: pipelineLoading } = useRealtimeData<{
    success: boolean
    data: PipelineItem[]
    total: number
    is_admin: boolean
  }>('/api/leads/pipeline', { refreshInterval: 30000 })

  // Analytics - conversion funnel and lead sources
  const { data: analyticsData } = useRealtimeData<{
    success: boolean
    conversion_rate: number
    leads_by_source: { source: string; count: number; percentage: number }[]
    leads_by_status: { status: string; count: number }[]
  }>('/api/leads/analytics', { refreshInterval: 60000 })

  // AI Insights - fetch once on load
  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false

    async function fetchAIInsights() {
      try {
        const res = await fetch('/api/builder/overview/ai-insights', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
        if (res.ok) {
          const json: AIInsightsResponse = await res.json()
          if (!cancelled && json.success && json.data?.aiInsights) {
            const insights = json.data.aiInsights
            setAiInsight(insights.performanceSummary || insights.keyFindings?.[0] || null)
            setAiOpportunities(insights.opportunities?.slice(0, 3) || [])
          }
        }
      } catch {
        // AI insights are optional - fail silently
      }
    }

    fetchAIInsights()
    return () => { cancelled = true }
  }, [isAuthenticated])

  // Derive real metrics
  const leads = leadCountData?.data
  const totalLeads = leads?.total || statsData?.totalLeads || 0
  const hotLeads = leads?.hot || statsData?.hotLeads || 0
  const warmLeads = leads?.warm || statsData?.warmLeads || 0
  const totalProperties = statsData?.totalProperties || 0
  const conversionRate = analyticsData?.conversion_rate || statsData?.conversionRate || 0
  const totalViews = statsData?.totalViews || 0
  const pendingInteractions = leads?.pending_interactions || 0

  // Pipeline stage counts from real data
  const stageCounts = PIPELINE_STAGES.map(stage => {
    const count = (pipelineData?.data || []).filter(item => item.stage === stage.key).length
    return { ...stage, count }
  }).filter(s => s.count > 0 || ['new', 'contacted', 'qualified', 'closed_won'].includes(s.key))

  const totalInPipeline = pipelineData?.total || stageCounts.reduce((sum, s) => sum + s.count, 0)

  // Recent pipeline activity (sorted by last_activity_at)
  const recentPipelineActivity = (pipelineData?.data || [])
    .filter(item => item.last_activity_at)
    .sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime())
    .slice(0, 6)

  // Admin: Per-builder breakdown from pipeline data
  const builderBreakdown = isAdmin ? (() => {
    const map = new Map<string, { builder_id: string; leads: number; dealValue: number }>()
    for (const item of pipelineData?.data || []) {
      const entry = map.get(item.builder_id) || { builder_id: item.builder_id, leads: 0, dealValue: 0 }
      entry.leads++
      entry.dealValue += item.deal_value || 0
      map.set(item.builder_id, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.dealValue - a.dealValue)
  })() : []

  const isLoading = statsLoading || leadsLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 animate-pulse">
              <div className="h-4 w-20 bg-zinc-800 rounded mb-3" />
              <div className="h-8 w-16 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const metrics = [
    { label: 'Total Leads', value: totalLeads.toString(), icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    { label: 'Hot Leads', value: hotLeads.toString(), icon: Target, color: 'text-red-400', bgColor: 'bg-red-500/10' },
    { label: 'Properties', value: totalProperties.toString(), icon: Building2, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    { label: 'Conversion', value: `${conversionRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isAdmin
              ? `Managing all builders — ${companyName}`
              : `${companyName} — Command Center`}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Admin View</span>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 hover:border-zinc-700/60 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{metric.label}</span>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', metric.bgColor)}>
                  <Icon className={cn('w-4 h-4', metric.color)} />
                </div>
              </div>
              <span className="text-3xl font-bold text-zinc-100 tabular-nums">{metric.value}</span>
            </motion.div>
          )
        })}
      </div>

      {/* Extra stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-lg px-4 py-3">
          <span className="text-[11px] text-zinc-500 uppercase">Total Views</span>
          <p className="text-lg font-bold text-zinc-100 tabular-nums">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-lg px-4 py-3">
          <span className="text-[11px] text-zinc-500 uppercase">Warm Leads</span>
          <p className="text-lg font-bold text-zinc-100 tabular-nums">{warmLeads}</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-lg px-4 py-3">
          <span className="text-[11px] text-zinc-500 uppercase">Pending Follow-ups</span>
          <p className="text-lg font-bold text-zinc-100 tabular-nums">{pendingInteractions}</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-lg px-4 py-3">
          <span className="text-[11px] text-zinc-500 uppercase">Pipeline Value</span>
          <p className="text-lg font-bold text-zinc-100 tabular-nums">
            {formatINR((pipelineData?.data || []).reduce((sum, p) => sum + (p.deal_value || 0), 0))}
          </p>
        </div>
      </div>

      {/* Admin: Builder Breakdown */}
      {isAdmin && builderBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-zinc-900/60 border border-amber-500/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-zinc-100">Builder Progress Overview</h2>
            <span className="text-xs text-zinc-500 ml-auto">{builderBreakdown.length} active builders</span>
          </div>
          <div className="space-y-3">
            {builderBreakdown.map((builder, i) => (
              <div key={builder.builder_id} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                  {String.fromCharCode(65 + i)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 font-medium truncate">Builder {builder.builder_id.slice(0, 8)}</p>
                  <p className="text-xs text-zinc-500">{builder.leads} leads in pipeline</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-amber-400">{formatINR(builder.dealValue)}</p>
                  <p className="text-[10px] text-zinc-500">deal value</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Pipeline + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Overview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Pipeline Overview</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{totalInPipeline} leads in pipeline</p>
            </div>
            <button onClick={() => onNavigate?.('leads')} className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors">
              View Pipeline
            </button>
          </div>
          {stageCounts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No leads in pipeline yet</p>
              <button onClick={() => onNavigate?.('leads')} className="mt-2 text-xs text-amber-400 hover:text-amber-300">
                Add your first lead
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {stageCounts.map((stage) => (
                <div key={stage.key} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-24 truncate">{stage.label}</span>
                  <div className="flex-1 h-7 bg-zinc-800/50 rounded-md overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: totalInPipeline > 0 ? `${(stage.count / totalInPipeline) * 100}%` : '0%' }}
                      transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                      className={cn('h-full rounded-md', stage.color)}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-zinc-300 tabular-nums">
                      {stage.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Activity Feed - Real pipeline activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-zinc-100">Recent Activity</h2>
            <Activity className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="space-y-3">
            {recentPipelineActivity.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">No recent activity</p>
            ) : (
              recentPipelineActivity.map((item) => {
                const stageName = PIPELINE_STAGES.find(s => s.key === item.stage)?.label || item.stage
                const leadName = item.lead?.user?.full_name || item.lead?.user?.email || 'Unknown Lead'
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-zinc-800">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 leading-snug truncate">
                        <span className="font-medium text-zinc-200">{leadName}</span>
                        {' → '}
                        <span className="text-zinc-400">{stageName}</span>
                      </p>
                      <span className="text-[11px] text-zinc-600 mt-0.5 block">
                        {item.last_activity_at ? timeAgo(item.last_activity_at) : ''}
                      </span>
                    </div>
                    {item.deal_value > 0 && (
                      <span className="text-[11px] text-amber-400 font-medium flex-shrink-0">
                        {formatINR(item.deal_value)}
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Leads', icon: Users, section: 'leads', color: 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/10' },
          { label: 'Properties', icon: Building2, section: 'properties', color: 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/10' },
          { label: 'Marketing', icon: Sparkles, section: 'marketing', color: 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/15 border-purple-500/10' },
          { label: 'Analytics', icon: BarChart3, section: 'analytics', color: 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/10' },
        ].map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              onClick={() => onNavigate?.(action.section)}
              className={cn('flex items-center gap-3 p-4 rounded-xl border transition-all duration-150', action.color)}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium text-zinc-200">{action.label}</span>
            </button>
          )
        })}
      </div>

      {/* AI Insights - Real from API */}
      {aiInsight && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-zinc-100 mb-1">AI Insight</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{aiInsight}</p>
              {aiOpportunities.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {aiOpportunities.map((opp, i) => (
                    <li key={i} className="text-xs text-zinc-500 flex items-start gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                      {opp}
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={() => onNavigate?.('leads')} className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors">
                View Hot Leads →
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Fallback AI insight when API hasn't returned yet */}
      {!aiInsight && hotLeads > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 mb-1">Quick Insight</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                You have <span className="text-amber-300 font-medium">{hotLeads} hot leads</span> and <span className="text-amber-300 font-medium">{pendingInteractions} pending follow-ups</span>.
                {pendingInteractions > 0 ? ' Prioritize follow-ups to improve conversion.' : ' Pipeline is on track.'}
              </p>
              <button onClick={() => onNavigate?.('leads')} className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors">
                View Hot Leads →
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
