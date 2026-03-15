'use client'

/**
 * AI Engine Section — WhatsApp Priya state machine + Distribution tiers + Live convos
 * Signature: Priya state machine flowchart with animated lead-flow
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, MessageSquare, Calendar, Users, ChevronRight, Zap, Clock, CheckCircle2, ArrowRight } from 'lucide-react'
import { ClassBadge, SlaTimer, GlassCard, MOCK_LEADS, PRIYA_STAGES, type PriyaStage, type Classification } from './AgenticShared'

// ─── Priya state machine config ───────────────────────────────────────────────

const STAGE_CONFIG: { stage: PriyaStage; icon: string; label: string; color: string; ring: string; count: number; dropRate: number; avgMin: number }[] = [
  { stage: 'GREETING',           icon: '👋', label: 'Greeting',    color: 'bg-zinc-700/60 border-zinc-600/40',           ring: 'border-zinc-500',        count: 3,  dropRate: 5,  avgMin: 2  },
  { stage: 'QUALIFICATION',      icon: '🎯', label: 'Qualify',     color: 'bg-blue-500/10 border-blue-500/20',          ring: 'border-blue-400',        count: 4,  dropRate: 12, avgMin: 8  },
  { stage: 'BUDGET_CHECK',       icon: '💰', label: 'Budget',      color: 'bg-yellow-500/10 border-yellow-500/20',      ring: 'border-yellow-400',      count: 2,  dropRate: 18, avgMin: 12 },
  { stage: 'TIMELINE_CHECK',     icon: '📅', label: 'Timeline',    color: 'bg-amber-500/10 border-amber-500/20',        ring: 'border-amber-400',       count: 3,  dropRate: 8,  avgMin: 10 },
  { stage: 'OBJECTION_HANDLING', icon: '🔄', label: 'Objections',  color: 'bg-orange-500/10 border-orange-500/20',      ring: 'border-orange-400',      count: 1,  dropRate: 22, avgMin: 20 },
  { stage: 'BOOKING',            icon: '✅', label: 'Booking',     color: 'bg-emerald-500/10 border-emerald-500/20',    ring: 'border-emerald-400',     count: 2,  dropRate: 2,  avgMin: 6  },
]

// ─── Distribution tiers ───────────────────────────────────────────────────────

const DIST_TIERS = [
  {
    type: 'LION',
    emoji: '🦁',
    label: 'Hot — Top Exec',
    slaLabel: '15-min SLA',
    color: 'border-amber-500/30 bg-amber-500/5',
    headerColor: 'text-amber-400',
    ring: 'ring-amber-500/20',
    leads: MOCK_LEADS.filter(l => l.classification === 'LION').slice(0, 3),
  },
  {
    type: 'MONKEY',
    emoji: '🐒',
    label: 'Warm — Round Robin',
    slaLabel: '2-hr SLA',
    color: 'border-yellow-500/25 bg-yellow-500/3',
    headerColor: 'text-yellow-400',
    ring: 'ring-yellow-500/15',
    leads: MOCK_LEADS.filter(l => l.classification === 'MONKEY').slice(0, 3),
  },
  {
    type: 'DOG',
    emoji: '🐕',
    label: 'Cold — Partners',
    slaLabel: '8-hr SLA',
    color: 'border-zinc-600/40 bg-zinc-800/20',
    headerColor: 'text-zinc-400',
    ring: '',
    leads: MOCK_LEADS.filter(l => l.classification === 'DOG'),
  },
]

// ─── Live conversations ───────────────────────────────────────────────────────

const LIVE_CONVOS = [
  {
    lead: 'Rajesh Kumar', cls: 'LION' as Classification, stage: 'BOOKING',
    messages: [
      { from: 'lead', text: 'Yes I can come for site visit this Saturday.', time: '2m' },
      { from: 'priya', text: 'Great! I have confirmed your slot for Saturday 11 AM. Our team will WhatsApp you the address and QR code. 🏠', time: '1m' },
    ],
  },
  {
    lead: 'Meena Krishnan', cls: 'MONKEY' as Classification, stage: 'BUDGET_CHECK',
    messages: [
      { from: 'lead', text: 'My budget is around 50 lakhs.', time: '8m' },
      { from: 'priya', text: 'Perfect! We have great options in that range. Are you looking for immediate possession or ready to wait 2 years?', time: '7m' },
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function AutomationsSection() {
  const [activeStage, setActiveStage] = useState<number>(0)

  useEffect(() => {
    const t = setInterval(() => setActiveStage(s => (s + 1) % STAGE_CONFIG.length), 2000)
    return () => clearInterval(t)
  }, [])

  const leadsAtStage = (stage: PriyaStage) => MOCK_LEADS.filter(l => l.priyaStage === stage).length
  const totalActive = MOCK_LEADS.filter(l => l.priyaStage !== 'BOOKING').length
  const bookings = MOCK_LEADS.filter(l => l.priyaStage === 'BOOKING').length

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">AI Engine</h1>
          <p className="text-xs text-zinc-500">WhatsApp Priya · Lead Distribution · SLA Enforcement</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-400">AI Active</span>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Convos',   value: String(totalActive), icon: <MessageSquare className="w-4 h-4" />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Booked Today',    value: String(bookings),    icon: <Calendar className="w-4 h-4" />,       color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'       },
          { label: 'Lions Qualified', value: String(MOCK_LEADS.filter(l => l.classification === 'LION').length), icon: <Zap className="w-4 h-4" />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        ].map(s => (
          <GlassCard key={s.label} className="p-5">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-bold text-zinc-100 mb-1">{s.value}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* ── Priya State Machine ─────────────────────────────────────────────── */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-200">WhatsApp Priya — 6-Stage Qualification</h2>
          </div>
          <span className="text-[11px] text-zinc-500">Avg 58 min to booking</span>
        </div>

        {/* Stage nodes — desktop horizontal, mobile vertical */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
          {STAGE_CONFIG.map((cfg, i) => {
            const count = leadsAtStage(cfg.stage)
            const isActive = activeStage === i
            const isPast = activeStage > i
            return (
              <div key={cfg.stage} className="flex sm:flex-col items-center gap-2 sm:gap-0 flex-1 min-w-0">
                {/* Node */}
                <motion.div
                  animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ duration: 1.2, repeat: isActive ? Infinity : 0 }}
                  className={`relative w-16 h-16 sm:w-14 sm:h-14 rounded-2xl border-2 flex flex-col items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-300 ${isActive ? `${cfg.color} ${cfg.ring} shadow-lg` : isPast ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.03] border-white/[0.08]'}`}
                >
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-zinc-950 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
                    </div>
                  )}
                  <span className="text-lg leading-none">{isPast && !isActive ? '✓' : cfg.icon}</span>
                  {count > 0 && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-zinc-950 leading-none">
                      {count}
                    </span>
                  )}
                </motion.div>

                {/* Label + stats */}
                <div className="sm:text-center sm:mt-2 sm:px-1">
                  <p className="text-[11px] font-semibold text-zinc-300 sm:text-center">{cfg.label}</p>
                  <p className="text-[10px] text-zinc-600">~{cfg.avgMin}m avg</p>
                  {cfg.dropRate > 0 && <p className="text-[10px] text-red-500/70">{cfg.dropRate}% drop</p>}
                </div>

                {/* Arrow connector */}
                {i < STAGE_CONFIG.length - 1 && (
                  <div className="hidden sm:flex flex-col items-center justify-center w-4 flex-shrink-0">
                    <ArrowRight className="w-3 h-3 text-zinc-600" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Stage progress bar */}
        <div className="mt-6 flex h-2 rounded-full overflow-hidden gap-0.5">
          {STAGE_CONFIG.map((cfg, i) => (
            <motion.div
              key={cfg.stage}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
              className={`flex-1 rounded-full ${i <= activeStage ? 'bg-amber-500' : 'bg-white/[0.06]'} origin-left`}
            />
          ))}
        </div>
        <p className="text-[11px] text-zinc-500 mt-2 text-center">Stage {activeStage + 1} of 6 — {STAGE_CONFIG[activeStage].label}</p>
      </GlassCard>

      {/* ── Distribution Engine + Live Convos ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Distribution tiers */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-zinc-200">Distribution Engine</h2>
            <span className="ml-auto text-[11px] text-zinc-500">Auto-assign by score</span>
          </div>
          <div className="space-y-4">
            {DIST_TIERS.map(tier => (
              <div key={tier.type} className={`rounded-xl border p-4 ${tier.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{tier.emoji}</span>
                    <span className={`text-xs font-bold ${tier.headerColor}`}>{tier.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-zinc-600" />
                    <span className="text-[11px] text-zinc-500">{tier.slaLabel}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {tier.leads.map(lead => (
                    <div key={lead.id} className="flex items-center gap-2 text-[11px]">
                      <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-zinc-300">{lead.name[0]}</span>
                      </div>
                      <span className="text-zinc-300 flex-1 truncate">{lead.name}</span>
                      <span className="text-zinc-500">{lead.assignedTo}</span>
                      <SlaTimer deadline={lead.slaDeadline} classification={lead.classification} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Live conversations */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-bold text-zinc-200">Live Conversations</h2>
            <span className="ml-auto text-[11px] text-zinc-500">Priya AI</span>
          </div>
          <div className="space-y-4">
            {LIVE_CONVOS.map((convo, ci) => (
              <div key={ci} className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                {/* Convo header */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-emerald-400">{convo.lead[0]}</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-200">{convo.lead}</span>
                  <ClassBadge classification={convo.cls} showEmoji={false} />
                  <span className="ml-auto text-[10px] text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded-full">
                    {convo.stage.replace(/_/g, ' ')}
                  </span>
                </div>
                {/* Messages */}
                <div className="px-3 py-3 space-y-2">
                  {convo.messages.map((msg, mi) => (
                    <div key={mi} className={`flex gap-2 ${msg.from === 'priya' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-[11px] leading-relaxed ${msg.from === 'priya' ? 'bg-emerald-500/15 border border-emerald-500/20 text-zinc-200' : 'bg-white/[0.05] border border-white/[0.08] text-zinc-300'}`}>
                        {msg.from === 'priya' && <span className="block text-[9px] font-bold text-emerald-400 mb-0.5 uppercase tracking-wide">Priya AI</span>}
                        {msg.text}
                        <span className="block text-[9px] text-zinc-600 mt-0.5 text-right">{msg.time} ago</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 hover:bg-amber-500/10 transition-all">
            View all conversations <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </GlassCard>
      </div>
    </div>
  )
}
