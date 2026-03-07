"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, Users, Target,
  ArrowUpRight, ArrowDownRight,
  Download, RefreshCw, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderDataContext, useRealtimeData, formatINR } from '../hooks/useBuilderData'

interface AnalyticsProps {
  onNavigate?: (section: string) => void
}

export function AnalyticsSection({ onNavigate }: AnalyticsProps) {
  const { isAdmin } = useBuilderDataContext()

  // Real analytics from Supabase
  const { data: analyticsData, isLoading: analyticsLoading } = useRealtimeData<{
    success: boolean
    conversion_rate: number
    conversion_trend: string
    avg_response_time: number
    response_time_trend: string
    total_value: number
    value_trend: string
    leads_by_source: { source: string; count: number; percentage: number }[]
    leads_by_status: { status: string; count: number; percentage: number }[]
    conversion_funnel: { stage: string; count: number; percentage: number }[]
  }>('/api/leads/analytics', { refreshInterval: 30000 })

  // Real lead counts
  const { data: leadCountData, isLoading: countsLoading } = useRealtimeData<{
    success: boolean
    data: { total: number; hot: number; warm: number; pending_interactions: number }
  }>('/api/leads/count', { refreshInterval: 30000 })

  const leads = leadCountData?.data
  const totalLeads = leads?.total || 0
  const conversionRate = analyticsData?.conversion_rate || 0
  const avgResponseTime = analyticsData?.avg_response_time || 0
  const totalValue = analyticsData?.total_value || 0
  const leadSources = analyticsData?.leads_by_source || []
  const conversionFunnel = analyticsData?.conversion_funnel || []
  const leadsByStatus = analyticsData?.leads_by_status || []

  const isLoading = analyticsLoading || countsLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
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

  const conversionTrendUp = analyticsData?.conversion_trend === 'up'
  const responseTimeGood = analyticsData?.response_time_trend === 'down'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400 font-medium">
                <Shield className="w-3 h-3" /> All Builders
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-1">Real-time performance insights</p>
        </div>
        <button className="p-2 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors">
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: totalLeads.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Conversion Rate', value: `${conversionRate.toFixed(1)}%`, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Avg Response', value: avgResponseTime > 0 ? `${avgResponseTime.toFixed(1)}h` : '—', icon: RefreshCw, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Pipeline Value', value: formatINR(totalValue), icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', stat.bg)}>
                  <Icon className={cn('w-4 h-4', stat.color)} />
                </div>
              </div>
              <span className="text-3xl font-bold text-zinc-100 tabular-nums">{stat.value}</span>
            </motion.div>
          )
        })}
      </div>

      {/* Funnel + Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6">
          <h2 className="text-base font-semibold text-zinc-100 mb-5">Conversion Funnel</h2>
          {conversionFunnel.length === 0 ? (
            <div className="text-center py-8 text-sm text-zinc-600">No funnel data yet</div>
          ) : (
            <div className="space-y-3">
              {conversionFunnel.map((stage, i) => {
                const maxCount = conversionFunnel[0]?.count || 1
                const colors = ['bg-blue-500', 'bg-cyan-500', 'bg-purple-500', 'bg-orange-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500', 'bg-emerald-500', 'bg-red-500']
                return (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400 w-28 truncate capitalize">{stage.stage.replace(/_/g, ' ')}</span>
                    <div className="flex-1 h-7 bg-zinc-800/50 rounded-md overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(3, (stage.count / maxCount) * 100)}%` }}
                        transition={{ duration: 0.6, delay: 0.1 * i }}
                        className={cn('h-full rounded-md', colors[i % colors.length])}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-zinc-300 tabular-nums">
                        {stage.count} ({stage.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Lead Status Breakdown */}
          {leadsByStatus.length > 0 && (
            <div className="mt-6 pt-5 border-t border-zinc-800/50">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Lead Status</h3>
              <div className="flex flex-wrap gap-3">
                {leadsByStatus.map(s => (
                  <div key={s.status} className="bg-zinc-800/40 rounded-lg px-3 py-2">
                    <p className="text-[11px] text-zinc-500 capitalize">{s.status}</p>
                    <p className="text-sm font-bold text-zinc-200 tabular-nums">{s.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Lead Sources */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6">
          <h2 className="text-base font-semibold text-zinc-100 mb-5">Lead Sources</h2>
          {leadSources.length === 0 ? (
            <div className="text-center py-8 text-sm text-zinc-600">No source data yet</div>
          ) : (
            <div className="space-y-3">
              {leadSources.map((source, idx) => {
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500']
                return (
                  <div key={source.source}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-zinc-300 capitalize">{source.source || 'Unknown'}</span>
                      <span className="text-xs text-zinc-500 tabular-nums">{source.count} ({source.percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${source.percentage}%` }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className={cn('h-full rounded-full', colors[idx % colors.length])}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
