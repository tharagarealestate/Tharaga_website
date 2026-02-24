"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, Users, Eye, Target,
  ArrowUpRight, ArrowDownRight, Calendar,
  Download, Filter, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalyticsProps {
  onNavigate?: (section: string) => void
}

type TimeRange = '7d' | '30d' | '90d' | '12m'

export function AnalyticsSection({ onNavigate }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    conversionRate: 0,
    avgResponseTime: '0',
    revenue: '0',
  })

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch('/api/leads/count', { credentials: 'include', cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data) {
            const total = data.data.total || 0
            const hot = data.data.hot || 0
            setMetrics({
              totalLeads: total,
              conversionRate: total > 0 ? Math.round((hot / total) * 100) : 0,
              avgResponseTime: '2.4hrs',
              revenue: '₹12.5L',
            })
          }
        }
      } catch (error) {
        console.error('[Analytics] Failed to load:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadAnalytics()
  }, [timeRange])

  // Mock chart data for visualization
  const weeklyData = [
    { day: 'Mon', leads: 12, conversions: 3 },
    { day: 'Tue', leads: 18, conversions: 5 },
    { day: 'Wed', leads: 15, conversions: 4 },
    { day: 'Thu', leads: 22, conversions: 7 },
    { day: 'Fri', leads: 19, conversions: 6 },
    { day: 'Sat', leads: 8, conversions: 2 },
    { day: 'Sun', leads: 5, conversions: 1 },
  ]

  const sourceData = [
    { source: 'Google Ads', leads: 42, percentage: 35, color: 'bg-blue-500' },
    { source: 'Website Form', leads: 30, percentage: 25, color: 'bg-emerald-500' },
    { source: 'WhatsApp', leads: 24, percentage: 20, color: 'bg-green-500' },
    { source: 'Referrals', leads: 15, percentage: 12.5, color: 'bg-purple-500' },
    { source: 'Social Media', leads: 9, percentage: 7.5, color: 'bg-amber-500' },
  ]

  const maxLeads = Math.max(...weeklyData.map(d => d.leads))

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Performance insights and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            {(['7d', '30d', '90d', '12m'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  timeRange === range ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="p-2 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: metrics.totalLeads.toString(), change: 12.5, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Conversion Rate', value: `${metrics.conversionRate}%`, change: 3.2, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Avg Response', value: metrics.avgResponseTime, change: -15, icon: RefreshCw, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Revenue', value: metrics.revenue, change: 8.7, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', stat.bg)}>
                  <Icon className={cn('w-4 h-4', stat.color)} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-zinc-100 tabular-nums">{stat.value}</span>
                <span className={cn(
                  'flex items-center gap-0.5 text-xs font-medium mb-1',
                  stat.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {stat.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(stat.change)}%
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Leads Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6"
        >
          <h2 className="text-base font-semibold text-zinc-100 mb-5">Weekly Lead Activity</h2>
          <div className="flex items-end gap-3 h-48">
            {weeklyData.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1" style={{ height: '160px' }}>
                  <div className="w-full flex-1 flex items-end justify-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.leads / maxLeads) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="w-5 bg-blue-500/60 rounded-t-sm"
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.conversions / maxLeads) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 + 0.1 }}
                      className="w-5 bg-emerald-500/60 rounded-t-sm"
                    />
                  </div>
                </div>
                <span className="text-[11px] text-zinc-500">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-500/60" />
              <span className="text-xs text-zinc-500">Leads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
              <span className="text-xs text-zinc-500">Conversions</span>
            </div>
          </div>
        </motion.div>

        {/* Lead Sources */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6"
        >
          <h2 className="text-base font-semibold text-zinc-100 mb-5">Lead Sources</h2>
          <div className="space-y-3">
            {sourceData.map((source) => (
              <div key={source.source}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-zinc-300">{source.source}</span>
                  <span className="text-xs text-zinc-500 tabular-nums">{source.leads} ({source.percentage}%)</span>
                </div>
                <div className="h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${source.percentage}%` }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className={cn('h-full rounded-full', source.color)}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
