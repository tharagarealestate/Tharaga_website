'use client'

/**
 * AI Engine — Tharaga AI 6-stage WhatsApp qualification engine.
 * Real data: stage counts + tier distribution from useDashboardData.
 * No WhatsApp conversation data available yet → ComingSoonEmpty.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, MessageSquare, Calendar, Users, Zap, Clock, ArrowRight } from 'lucide-react'
import {
  TierBadge, SlaTimer, GlassCard, DashboardSkeleton, EmptyState, ErrorDisplay, ComingSoonEmpty,
  AI_STAGES, AI_STAGE_LABELS, TIER_CONFIG, useDashboardData,
  type AIStage,
} from './AgenticShared'
import { useBuilderAuth } from '../BuilderAuthProvider'

// ─── Stage config (static — timing benchmarks only) ───────────────────────────

const STAGE_META: Record<AIStage, { icon: string; avgMin: number; dropRate: number }> = {
  GREETING:           { icon: '👋', avgMin: 2,  dropRate: 5  },
  QUALIFICATION:      { icon: '🎯', avgMin: 8,  dropRate: 12 },
  BUDGET_CHECK:       { icon: '💰', avgMin: 12, dropRate: 18 },
  TIMELINE_CHECK:     { icon: '📅', avgMin: 10, dropRate: 8  },
  OBJECTION_HANDLING: { icon: '🔄', avgMin: 20, dropRate: 22 },
  BOOKING:            { icon: '✅', avgMin: 6,  dropRate: 2  },
}

const STAGE_COLORS: Record<AIStage, string> = {
  GREETING:           'bg-zinc-700/60   border-zinc-600/40',
  QUALIFICATION:      'bg-blue-500/10   border-blue-500/20',
  BUDGET_CHECK:       'bg-yellow-500/10 border-yellow-500/20',
  TIMELINE_CHECK:     'bg-amber-500/10  border-amber-500/20',
  OBJECTION_HANDLING: 'bg-orange-500/10 border-orange-500/20',
  BOOKING:            'bg-emerald-500/10 border-emerald-500/20',
}

const TIER_DIST_CONFIG = {
  HOT:  { label: 'Hot — Top Exec',      slaLabel: '15-min SLA', color: 'border-red-500/30 bg-red-500/5',      headerColor: 'text-red-400'    },
  WARM: { label: 'Warm — Round Robin',  slaLabel: '2-hr SLA',   color: 'border-amber-500/25 bg-amber-500/3',  headerColor: 'text-amber-400'  },
  COOL: { label: 'Cool — Nurture Pool', slaLabel: '8-hr SLA',   color: 'border-zinc-600/40 bg-zinc-800/20',   headerColor: 'text-zinc-400'   },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AutomationsSection() {
  const { builderId, builderProfile } = useBuilderAuth()
  const isAdmin = builderProfile?.email === 'tharagarealestate@gmail.com'
  const { leads, stats, loading, error, refetch } = useDashboardData(builderId, isAdmin)

  const [activeStage, setActiveStage] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActiveStage(s => (s + 1) % AI_STAGES.length), 2000)
    return () => clearInterval(t)
  }, [])

  if (loading) return <DashboardSkeleton rows={5} />
  if (error)   return <ErrorDisplay message={error} onRetry={refetch} />

  if (leads.length === 0) return (
    <EmptyState
      title="Tharaga AI not active yet"
      description="Once leads start flowing in through WhatsApp or Meta Ads, the AI qualification engine will appear here."
      primaryAction={{ label: 'Connect WhatsApp', onClick: () => {} }}
    />
  )

  const totalActive = leads.filter(l => l.ai_stage !== null && l.ai_stage !== 'BOOKING').length
  const bookings    = leads.filter(l => l.ai_stage === 'BOOKING').length
  const hotCount    = stats.hot

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">AI Engine</h1>
          <p className="text-xs text-zinc-500">Tharaga AI · Lead Distribution · SLA Enforcement</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-400">AI Active</span>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Convos',  value: String(totalActive), icon: <MessageSquare className="w-4 h-4" />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Booked Today',   value: String(bookings),    icon: <Calendar className="w-4 h-4" />,      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'       },
          { label: 'HOT Qualified',  value: String(hotCount),    icon: <Zap className="w-4 h-4" />,           color: 'text-red-400 bg-red-500/10 border-red-500/20'             },
        ].map(s => (
          <GlassCard key={s.label} className="p-5">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-bold text-zinc-100 mb-1">{s.value}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* ── Tharaga AI State Machine ─────────────────────────────────────────── */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-200">Tharaga AI — 6-Stage WhatsApp Qualification</h2>
          </div>
          <span className="text-[11px] text-zinc-500">Live stage counts</span>
        </div>

        {/* Stage nodes */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
          {AI_STAGES.map((stage, i) => {
            const meta    = STAGE_META[stage]
            const count   = stats.stageCounts[stage] ?? 0
            const isActive = activeStage === i
            const isPast   = activeStage > i
            return (
              <div key={stage} className="flex sm:flex-col items-center gap-2 sm:gap-0 flex-1 min-w-0">
                {/* Node */}
                <motion.div
                  animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ duration: 1.2, repeat: isActive ? Infinity : 0 }}
                  className={`relative w-16 h-16 sm:w-14 sm:h-14 rounded-2xl border-2 flex flex-col items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-300 ${isActive ? `${STAGE_COLORS[stage]} shadow-lg` : isPast ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.03] border-white/[0.08]'}`}
                >
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-zinc-950" />
                  )}
                  <span className="text-lg leading-none">{isPast && !isActive ? '✓' : meta.icon}</span>
                  {count > 0 && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-zinc-950 leading-none">
                      {count}
                    </span>
                  )}
                </motion.div>

                {/* Label */}
                <div className="sm:text-center sm:mt-2 sm:px-1">
                  <p className="text-[11px] font-semibold text-zinc-300 sm:text-center">{AI_STAGE_LABELS[stage]}</p>
                  <p className="text-[10px] text-zinc-600">~{meta.avgMin}m avg</p>
                  {meta.dropRate > 0 && <p className="text-[10px] text-red-500/70">{meta.dropRate}% drop</p>}
                </div>

                {/* Arrow */}
                {i < AI_STAGES.length - 1 && (
                  <div className="hidden sm:flex items-center justify-center w-4 flex-shrink-0">
                    <ArrowRight className="w-3 h-3 text-zinc-600" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6 flex h-2 rounded-full overflow-hidden gap-0.5">
          {AI_STAGES.map((_, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
              className={`flex-1 rounded-full ${i <= activeStage ? 'bg-amber-500' : 'bg-white/[0.06]'} origin-left`}
            />
          ))}
        </div>
        <p className="text-[11px] text-zinc-500 mt-2 text-center">
          Stage {activeStage + 1} of 6 — {AI_STAGE_LABELS[AI_STAGES[activeStage]]}
        </p>
      </GlassCard>

      {/* ── Distribution Engine + Live Conversations ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Distribution tiers — real data */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-zinc-200">Distribution Engine</h2>
            <span className="ml-auto text-[11px] text-zinc-500">Auto-assign by score</span>
          </div>
          <div className="space-y-4">
            {(['HOT', 'WARM', 'COOL'] as const).map(tier => {
              const cfg       = TIER_DIST_CONFIG[tier]
              const tierLeads = leads.filter(l => l.tier === tier).slice(0, 3)
              return (
                <div key={tier} className={`rounded-xl border p-4 ${cfg.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{TIER_CONFIG[tier].emoji}</span>
                      <span className={`text-xs font-bold ${cfg.headerColor}`}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      <span className="text-[11px] text-zinc-500">{cfg.slaLabel}</span>
                    </div>
                  </div>
                  {tierLeads.length === 0 ? (
                    <p className="text-[11px] text-zinc-600">No {tier.toLowerCase()} leads yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {tierLeads.map(lead => (
                        <div key={lead.id} className="flex items-center gap-2 text-[11px]">
                          <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-bold text-zinc-300">{lead.name[0]}</span>
                          </div>
                          <span className="text-zinc-300 flex-1 truncate">{lead.name}</span>
                          <span className="text-zinc-500 truncate">{lead.assigned_to ?? 'Unassigned'}</span>
                          <SlaTimer deadline={lead.sla_deadline} tier={lead.tier} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </GlassCard>

        {/* Live conversations — no API data yet */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-zinc-500" />
            <h2 className="text-sm font-bold text-zinc-200">Live Conversations</h2>
            <span className="ml-auto text-[11px] text-zinc-500">Tharaga AI</span>
          </div>
          <ComingSoonEmpty
            title="WhatsApp integration pending"
            description="Live conversation feed will appear here once Tharaga AI WhatsApp is connected to your account."
          />
        </GlassCard>
      </div>
    </div>
  )
}
