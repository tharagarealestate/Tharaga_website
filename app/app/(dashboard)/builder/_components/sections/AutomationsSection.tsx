"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Workflow, Zap, Users, Target, Eye, Phone,
  Mail, MessageSquare, CheckCircle2, Clock,
  ArrowRight, Play, Pause, Settings, Plus,
  TrendingUp, Activity, Sparkles, Bot,
  ChevronRight, AlertCircle, BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutomationsProps {
  onNavigate?: (section: string) => void
}

interface PipelineNode {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  count: number
  activeCount: number
  color: string
  dotColor: string
}

interface Automation {
  id: string
  name: string
  trigger: string
  action: string
  status: 'active' | 'paused' | 'draft'
  executionsToday: number
  successRate: number
}

interface LiveEvent {
  id: string
  message: string
  type: 'lead' | 'email' | 'call' | 'visit' | 'automation'
  time: string
}

export function AutomationsSection({ onNavigate }: AutomationsProps) {
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([])
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set())
  const [flowPulse, setFlowPulse] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const pipelineNodes: PipelineNode[] = [
    { id: 'capture', label: 'Lead Capture', icon: Users, count: 45, activeCount: 3, color: 'text-blue-400', dotColor: 'bg-blue-500' },
    { id: 'enrich', label: 'AI Enrichment', icon: Sparkles, count: 42, activeCount: 5, color: 'text-purple-400', dotColor: 'bg-purple-500' },
    { id: 'score', label: 'Lead Scoring', icon: Target, count: 42, activeCount: 2, color: 'text-amber-400', dotColor: 'bg-amber-500' },
    { id: 'qualify', label: 'Qualification', icon: CheckCircle2, count: 30, activeCount: 4, color: 'text-emerald-400', dotColor: 'bg-emerald-500' },
    { id: 'outreach', label: 'Auto Outreach', icon: Mail, count: 28, activeCount: 6, color: 'text-cyan-400', dotColor: 'bg-cyan-500' },
    { id: 'followup', label: 'Follow-up', icon: Phone, count: 22, activeCount: 3, color: 'text-orange-400', dotColor: 'bg-orange-500' },
    { id: 'convert', label: 'Conversion', icon: TrendingUp, count: 8, activeCount: 1, color: 'text-rose-400', dotColor: 'bg-rose-500' },
  ]

  const automations: Automation[] = [
    { id: '1', name: 'Welcome Email Sequence', trigger: 'New lead created', action: 'Send 3-email drip', status: 'active', executionsToday: 12, successRate: 94 },
    { id: '2', name: 'Hot Lead Alert', trigger: 'Score > 80', action: 'Notify sales team via WhatsApp', status: 'active', executionsToday: 5, successRate: 100 },
    { id: '3', name: 'Site Visit Reminder', trigger: '24hrs before visit', action: 'Send SMS + Email', status: 'active', executionsToday: 3, successRate: 98 },
    { id: '4', name: 'Cold Lead Re-engagement', trigger: 'No activity 14 days', action: 'Send special offer email', status: 'paused', executionsToday: 0, successRate: 67 },
    { id: '5', name: 'Price Drop Notification', trigger: 'Property price updated', action: 'Notify interested leads', status: 'active', executionsToday: 8, successRate: 89 },
  ]

  // Simulate live pipeline flow
  useEffect(() => {
    const sampleEvents: Omit<LiveEvent, 'id' | 'time'>[] = [
      { message: 'New lead captured from Google Ads', type: 'lead' },
      { message: 'AI scored Priya Kumar at 87/100', type: 'automation' },
      { message: 'Welcome email sent to Rajesh M.', type: 'email' },
      { message: 'Follow-up call scheduled for Arun S.', type: 'call' },
      { message: 'Site visit confirmed for Plot #42', type: 'visit' },
      { message: 'Lead enriched: Budget ₹45L-60L', type: 'automation' },
      { message: 'Hot lead alert sent to sales team', type: 'automation' },
      { message: 'SMS reminder sent for tomorrow\'s visit', type: 'email' },
    ]

    let eventIndex = 0

    // Initial events
    setLiveEvents(
      sampleEvents.slice(0, 4).map((e, i) => ({
        ...e,
        id: `init-${i}`,
        time: `${i + 1} min ago`,
      }))
    )

    timerRef.current = setInterval(() => {
      const event = sampleEvents[eventIndex % sampleEvents.length]
      setLiveEvents(prev => [
        { ...event, id: `live-${Date.now()}`, time: 'Just now' },
        ...prev.slice(0, 7),
      ])

      // Pulse random pipeline nodes
      const nodeIndex = Math.floor(Math.random() * pipelineNodes.length)
      setActiveNodes(prev => {
        const next = new Set(prev)
        next.add(pipelineNodes[nodeIndex].id)
        setTimeout(() => {
          setActiveNodes(p => {
            const n = new Set(p)
            n.delete(pipelineNodes[nodeIndex].id)
            return n
          })
        }, 1500)
        return next
      })

      setFlowPulse(p => p + 1)
      eventIndex++
    }, 3000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">AI Automations</h1>
          <p className="text-sm text-zinc-500 mt-1">Real-time pipeline automation & lead flow</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Live</span>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            New Automation
          </button>
        </div>
      </div>

      {/* Real-time Pipeline Flow Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Lead Generation Pipeline</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Real-time automation flow across stages</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{automations.filter(a => a.status === 'active').length} automations running</span>
          </div>
        </div>

        {/* Pipeline flow diagram */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-2 px-2">
          {pipelineNodes.map((node, i) => {
            const Icon = node.icon
            const isActive = activeNodes.has(node.id)
            return (
              <div key={node.id} className="flex items-center">
                <motion.div
                  animate={isActive ? {
                    scale: [1, 1.05, 1],
                    boxShadow: ['0 0 0 0 rgba(251, 191, 36, 0)', '0 0 0 8px rgba(251, 191, 36, 0.15)', '0 0 0 0 rgba(251, 191, 36, 0)'],
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
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-amber-400 animate-ping"
                      />
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-zinc-300 truncate">{node.label}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-bold text-zinc-100 tabular-nums">{node.count}</span>
                    {node.activeCount > 0 && (
                      <span className="text-[10px] text-emerald-400 font-medium">+{node.activeCount}</span>
                    )}
                  </div>
                </motion.div>
                {i < pipelineNodes.length - 1 && (
                  <div className="flex-shrink-0 w-6 flex items-center justify-center">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    >
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </motion.div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Flow stats */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-zinc-800/50">
          <div>
            <p className="text-[11px] text-zinc-500 mb-1">Daily Throughput</p>
            <p className="text-lg font-bold text-zinc-100">127 <span className="text-xs text-emerald-400">leads/day</span></p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 mb-1">Avg. Pipeline Time</p>
            <p className="text-lg font-bold text-zinc-100">4.2 <span className="text-xs text-zinc-500">days</span></p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 mb-1">Auto-conversion Rate</p>
            <p className="text-lg font-bold text-zinc-100">18% <span className="text-xs text-amber-400">↑ 3.2%</span></p>
          </div>
        </div>
      </motion.div>

      {/* Automations + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Automations */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">Active Automations</h2>
          {automations.map((auto) => (
            <motion.div
              key={auto.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700/60 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    auto.status === 'active' ? 'bg-emerald-500/10' : 'bg-zinc-800'
                  )}>
                    <Workflow className={cn(
                      'w-4 h-4',
                      auto.status === 'active' ? 'text-emerald-400' : 'text-zinc-500'
                    )} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-200">{auto.name}</h3>
                    <p className="text-xs text-zinc-500">{auto.trigger} → {auto.action}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {auto.status === 'active' ? (
                    <button className="p-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors" title="Pause">
                      <Pause className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  ) : (
                    <button className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors" title="Resume">
                      <Play className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  )}
                  <button className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors" title="Settings">
                    <Settings className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800/30">
                <span className="text-[11px] text-zinc-500">Today: <span className="text-zinc-300 font-medium">{auto.executionsToday} runs</span></span>
                <span className="text-[11px] text-zinc-500">Success: <span className={cn(
                  'font-medium',
                  auto.successRate >= 90 ? 'text-emerald-400' : auto.successRate >= 70 ? 'text-amber-400' : 'text-red-400'
                )}>{auto.successRate}%</span></span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live Event Feed */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-100">Live Feed</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-emerald-400">Live</span>
            </div>
          </div>
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
            <AnimatePresence>
              {liveEvents.map((event) => {
                const Icon = eventIcons[event.type] || Activity
                const [textColor, bgColor] = eventColors[event.type] || ['text-zinc-400', 'bg-zinc-800']
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-2.5"
                  >
                    <div className={cn('w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5', bgColor)}>
                      <Icon className={cn('w-3 h-3', textColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 leading-snug">{event.message}</p>
                      <span className="text-[10px] text-zinc-600">{event.time}</span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
