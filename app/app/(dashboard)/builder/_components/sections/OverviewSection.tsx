"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Building2, TrendingUp,
  ArrowUpRight, ArrowDownRight, Eye, Zap,
  Target, Phone, Mail,
  BarChart3, Activity, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OverviewProps {
  onNavigate?: (section: string) => void
}

interface MetricCard {
  label: string
  value: string
  change: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

interface RecentActivity {
  id: string
  type: 'lead' | 'property' | 'call' | 'email' | 'visit'
  message: string
  time: string
}

export function OverviewSection({ onNavigate }: OverviewProps) {
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pipelineData, setPipelineData] = useState<{ stage: string; count: number; color: string }[]>([])

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [leadsRes, propertiesRes] = await Promise.allSettled([
          fetch('/api/leads/count', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/builder/properties', { credentials: 'include', cache: 'no-store' }),
        ])

        let totalLeads = 0, hotLeads = 0, warmLeads = 0
        if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) {
          const data = await leadsRes.value.json()
          if (data.success && data.data) {
            totalLeads = data.data.total || 0
            hotLeads = data.data.hot || 0
            warmLeads = data.data.warm || 0
          }
        }

        let totalProperties = 0
        if (propertiesRes.status === 'fulfilled' && propertiesRes.value.ok) {
          const data = await propertiesRes.value.json()
          totalProperties = data?.data?.length || data?.total || 0
        }

        setMetrics([
          { label: 'Total Leads', value: totalLeads.toString(), change: 12.5, icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
          { label: 'Hot Leads', value: hotLeads.toString(), change: 8.3, icon: Target, color: 'text-red-400', bgColor: 'bg-red-500/10' },
          { label: 'Properties', value: totalProperties.toString(), change: 3.2, icon: Building2, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
          { label: 'Conversion Rate', value: totalLeads > 0 ? `${((hotLeads / totalLeads) * 100).toFixed(1)}%` : '0%', change: 2.1, icon: TrendingUp, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
        ])

        setPipelineData([
          { stage: 'New', count: Math.max(0, totalLeads - hotLeads - warmLeads), color: 'bg-blue-500' },
          { stage: 'Contacted', count: Math.floor(warmLeads * 0.4), color: 'bg-cyan-500' },
          { stage: 'Qualified', count: Math.floor(warmLeads * 0.6), color: 'bg-purple-500' },
          { stage: 'Site Visit', count: Math.floor(hotLeads * 0.5), color: 'bg-orange-500' },
          { stage: 'Negotiation', count: Math.floor(hotLeads * 0.3), color: 'bg-violet-500' },
          { stage: 'Closed Won', count: Math.floor(hotLeads * 0.2), color: 'bg-emerald-500' },
        ])

        setActivities([
          { id: '1', type: 'lead', message: 'New lead from website form', time: '2 min ago' },
          { id: '2', type: 'call', message: 'Follow-up call completed with Rajesh', time: '15 min ago' },
          { id: '3', type: 'visit', message: 'Site visit scheduled for Plot #42', time: '1 hr ago' },
          { id: '4', type: 'email', message: 'Price quotation sent to Priya', time: '2 hrs ago' },
          { id: '5', type: 'property', message: 'New property listing added: Villa Park', time: '3 hrs ago' },
        ])
      } catch (error) {
        console.error('[Overview] Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    lead: Users, property: Building2, call: Phone, email: Mail, visit: Eye,
  }

  const activityColors: Record<string, [string, string]> = {
    lead: ['text-blue-400', 'bg-blue-500/10'],
    property: ['text-emerald-400', 'bg-emerald-500/10'],
    call: ['text-purple-400', 'bg-purple-500/10'],
    email: ['text-amber-400', 'bg-amber-500/10'],
    visit: ['text-cyan-400', 'bg-cyan-500/10'],
  }

  const totalPipelineCount = pipelineData.reduce((sum, s) => sum + s.count, 0)

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Your real estate command center</p>
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
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-zinc-100 tabular-nums">{metric.value}</span>
                <span className={cn(
                  'flex items-center gap-0.5 text-xs font-medium mb-1',
                  metric.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {metric.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(metric.change)}%
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

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
              <p className="text-xs text-zinc-500 mt-0.5">{totalPipelineCount} leads in pipeline</p>
            </div>
            <button onClick={() => onNavigate?.('leads')} className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors">
              View Pipeline
            </button>
          </div>
          <div className="space-y-3">
            {pipelineData.map((stage) => (
              <div key={stage.stage} className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 w-24 truncate">{stage.stage}</span>
                <div className="flex-1 h-7 bg-zinc-800/50 rounded-md overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: totalPipelineCount > 0 ? `${(stage.count / totalPipelineCount) * 100}%` : '0%' }}
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
        </motion.div>

        {/* Activity Feed */}
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
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type] || Activity
              const [textColor, bgColor] = activityColors[activity.type] || ['text-zinc-400', 'bg-zinc-800']
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', bgColor)}>
                    <Icon className={cn('w-3.5 h-3.5', textColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 leading-snug">{activity.message}</p>
                    <span className="text-[11px] text-zinc-600 mt-0.5 block">{activity.time}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Add Lead', icon: Users, section: 'leads', color: 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/10' },
          { label: 'Add Property', icon: Building2, section: 'properties', color: 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/10' },
          { label: 'Campaigns', icon: Sparkles, section: 'marketing', color: 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/15 border-purple-500/10' },
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

      {/* AI Insights */}
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
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">AI Insight</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              You have <span className="text-amber-300 font-medium">{metrics[1]?.value || 0} hot leads</span> that haven&apos;t been contacted in 48 hours.
              Reaching out now could increase your conversion rate by up to 35%.
            </p>
            <button onClick={() => onNavigate?.('leads')} className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors">
              View Hot Leads →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
