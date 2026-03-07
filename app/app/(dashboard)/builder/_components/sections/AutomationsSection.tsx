"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Workflow, Zap, Users, Target, Eye, Phone,
  Mail, CheckCircle2, Clock,
  Play, Pause, Settings, Plus,
  TrendingUp, Activity, Sparkles, Bot,
  ChevronRight, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderDataContext, useRealtimeData, timeAgo } from '../hooks/useBuilderData'

interface AutomationsProps {
  onNavigate?: (section: string) => void
}

// Pipeline item from real API
interface PipelineItem {
  id: string
  lead_id: string
  builder_id: string
  stage: string
  stage_order: number
  deal_value: number
  last_activity_at: string
  last_activity_type: string
  lead?: {
    id: string
    category: string
    score: number
    user?: { full_name: string; email: string }
  }
}

const PIPELINE_STAGES = [
  { id: 'new', label: 'Lead Capture', icon: Users, color: 'text-blue-400' },
  { id: 'contacted', label: 'Contacted', icon: Phone, color: 'text-cyan-400' },
  { id: 'qualified', label: 'Qualified', icon: CheckCircle2, color: 'text-purple-400' },
  { id: 'site_visit_scheduled', label: 'Visit Scheduled', icon: Eye, color: 'text-orange-400' },
  { id: 'site_visit_completed', label: 'Visit Done', icon: Eye, color: 'text-yellow-400' },
  { id: 'negotiation', label: 'Negotiation', icon: Target, color: 'text-violet-400' },
  { id: 'closed_won', label: 'Closed Won', icon: TrendingUp, color: 'text-emerald-400' },
]

export function AutomationsSection({ onNavigate }: AutomationsProps) {
  const { isAdmin } = useBuilderDataContext()
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Real pipeline data
  const { data: pipelineResponse } = useRealtimeData<{
    success: boolean
    data: PipelineItem[]
    total: number
  }>('/api/leads/pipeline', { refreshInterval: 15000 })

  const pipelineItems = pipelineResponse?.data || []

  // Compute real counts per stage
  const stageCounts = PIPELINE_STAGES.map(stage => ({
    ...stage,
    count: pipelineItems.filter(p => p.stage === stage.id).length,
  }))

  // Recent activity from pipeline (most recent changes)
  const recentActivity = pipelineItems
    .filter(item => item.last_activity_at)
    .sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime())
    .slice(0, 8)
    .map(item => ({
      id: item.id,
      message: `${item.lead?.user?.full_name || item.lead?.user?.email || 'Lead'} → ${
        PIPELINE_STAGES.find(s => s.id === item.stage)?.label || item.stage
      }${item.last_activity_type ? ` (${item.last_activity_type})` : ''}`,
      type: item.stage.includes('visit') ? 'visit' : item.stage === 'contacted' ? 'call' : item.stage === 'new' ? 'lead' : 'automation',
      time: item.last_activity_at ? timeAgo(item.last_activity_at) : '',
    }))

  // Animate pipeline flow nodes periodically
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const idx = Math.floor(Math.random() * PIPELINE_STAGES.length)
      const nodeId = PIPELINE_STAGES[idx].id
      setActiveNodes(prev => {
        const next = new Set(prev)
        next.add(nodeId)
        setTimeout(() => {
          setActiveNodes(p => { const n = new Set(p); n.delete(nodeId); return n })
        }, 1500)
        return next
      })
    }, 2500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const totalLeadsInPipeline = pipelineItems.length
  const closedWon = pipelineItems.filter(p => p.stage === 'closed_won').length
  const autoConversionRate = totalLeadsInPipeline > 0 ? ((closedWon / totalLeadsInPipeline) * 100).toFixed(1) : '0'

  const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    lead: Users, email: Mail, call: Phone, visit: Eye, automation: Bot,
  }
  const eventColors: Record<string, [string, string]> = {
    lead: ['text-blue-400', 'bg-blue-500/10'],
    email: ['text-amber-400', 'bg-amber-500/10'],
    call: ['text-purple-400', 'bg-purple-500/10'],
    visit: ['text-cyan-400', 'bg-cyan-500/10'],
    automation: ['text-emerald-400', 'bg-emerald-500/10'],
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100">AI Automations</h1>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400 font-medium">
                <Shield className="w-3 h-3" /> All Builders
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-1">Real-time pipeline automation & lead flow</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Live</span>
          </div>
        </div>
      </div>

      {/* Pipeline Flow */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Lead Pipeline Flow</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{totalLeadsInPipeline} leads across {stageCounts.filter(s => s.count > 0).length} active stages</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Real-time Supabase</span>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-2 px-2">
          {stageCounts.map((node, i) => {
            const Icon = node.icon
            const isActive = activeNodes.has(node.id)
            return (
              <div key={node.id} className="flex items-center">
                <motion.div
                  animate={isActive ? {
                    scale: [1, 1.05, 1],
                    boxShadow: ['0 0 0 0 rgba(251,191,36,0)', '0 0 0 8px rgba(251,191,36,0.15)', '0 0 0 0 rgba(251,191,36,0)'],
                  } : {}}
                  transition={{ duration: 1.5 }}
                  className={cn(
                    'flex-shrink-0 w-28 bg-zinc-800/50 border rounded-xl p-3 transition-all duration-300',
                    isActive ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-700/40'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', isActive ? 'bg-amber-500/15' : 'bg-zinc-700/50')}>
                      <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-amber-400' : node.color)} />
                    </div>
                    {isActive && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                  </div>
                  <p className="text-[11px] font-medium text-zinc-300 truncate">{node.label}</p>
                  <span className="text-lg font-bold text-zinc-100 tabular-nums">{node.count}</span>
                </motion.div>
                {i < stageCounts.length - 1 && (
                  <div className="flex-shrink-0 w-6 flex items-center justify-center">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}>
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </motion.div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-zinc-800/50">
          <div>
            <p className="text-[11px] text-zinc-500 mb-1">Total in Pipeline</p>
            <p className="text-lg font-bold text-zinc-100">{totalLeadsInPipeline} <span className="text-xs text-zinc-500">leads</span></p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 mb-1">Closed Won</p>
            <p className="text-lg font-bold text-emerald-400">{closedWon}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 mb-1">Conversion Rate</p>
            <p className="text-lg font-bold text-zinc-100">{autoConversionRate}%</p>
          </div>
        </div>
      </motion.div>

      {/* Live Feed */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-100">Recent Pipeline Activity</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-400">Live</span>
          </div>
        </div>
        <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-6">No recent activity</p>
          ) : (
            recentActivity.map((event) => {
              const Icon = eventIcons[event.type] || Activity
              const [textColor, bgColor] = eventColors[event.type] || ['text-zinc-400', 'bg-zinc-800']
              return (
                <div key={event.id} className="flex items-start gap-2.5">
                  <div className={cn('w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5', bgColor)}>
                    <Icon className={cn('w-3 h-3', textColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 leading-snug">{event.message}</p>
                    <span className="text-[10px] text-zinc-600">{event.time}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
