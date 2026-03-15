'use client'

/**
 * AgenticShared — Shared AI-world components for all builder dashboard sections.
 * LION / MONKEY / DOG classification, SmartScore rings, SLA timers, Priya stages.
 */

import { useEffect, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Classification = 'LION' | 'MONKEY' | 'DOG'

export type PriyaStage =
  | 'GREETING'
  | 'QUALIFICATION'
  | 'BUDGET_CHECK'
  | 'TIMELINE_CHECK'
  | 'OBJECTION_HANDLING'
  | 'BOOKING'

export interface Lead {
  id: string
  name: string
  phone: string
  email?: string
  smartScore: number
  classification: Classification
  priyaStage: PriyaStage
  assignedTo: string
  slaDeadline: Date
  pipelineStage: string
  budget: string
  purpose: 'Own Use' | 'Investment' | 'Rental'
  source: 'Meta Ads' | 'Google' | 'Organic' | 'Referral' | 'WhatsApp'
  propertyInterest?: string
  createdAt: Date
  scoreBreakdown?: { budget: number; timeline: number; behavioral: number; intent: number }
}

// ─── Mock Leads ───────────────────────────────────────────────────────────────

const T = Date.now()

export const MOCK_LEADS: Lead[] = [
  {
    id: 'l1', name: 'Rajesh Kumar', phone: '+91 98765 43210',
    smartScore: 84, classification: 'LION', priyaStage: 'BOOKING',
    assignedTo: 'Priya S.', slaDeadline: new Date(T + 8 * 60 * 1000),
    pipelineStage: 'Site Visit Scheduled', budget: '₹80L–1.2Cr',
    purpose: 'Own Use', source: 'Meta Ads', propertyInterest: 'Prestige Enclave 3BHK',
    createdAt: new Date(T - 2 * 3600 * 1000),
    scoreBreakdown: { budget: 28, timeline: 26, behavioral: 20, intent: 10 },
  },
  {
    id: 'l2', name: 'Anitha Devi', phone: '+91 87654 32109',
    smartScore: 76, classification: 'LION', priyaStage: 'TIMELINE_CHECK',
    assignedTo: 'Arjun M.', slaDeadline: new Date(T - 5 * 60 * 1000),
    pipelineStage: 'Qualified', budget: '₹60L–80L',
    purpose: 'Investment', source: 'Google',
    createdAt: new Date(T - 4 * 3600 * 1000),
    scoreBreakdown: { budget: 22, timeline: 24, behavioral: 18, intent: 12 },
  },
  {
    id: 'l3', name: 'Suresh Babu', phone: '+91 76543 21098',
    smartScore: 71, classification: 'LION', priyaStage: 'OBJECTION_HANDLING',
    assignedTo: 'Kavya R.', slaDeadline: new Date(T + 3 * 60 * 1000),
    pipelineStage: 'Negotiation', budget: '₹1Cr–1.5Cr',
    purpose: 'Own Use', source: 'Referral', propertyInterest: 'Park View 4BHK',
    createdAt: new Date(T - 6 * 3600 * 1000),
    scoreBreakdown: { budget: 24, timeline: 20, behavioral: 17, intent: 10 },
  },
  {
    id: 'l4', name: 'Meena Krishnan', phone: '+91 65432 10987',
    smartScore: 58, classification: 'MONKEY', priyaStage: 'BUDGET_CHECK',
    assignedTo: 'Ravi T.', slaDeadline: new Date(T + 45 * 60 * 1000),
    pipelineStage: 'New Lead', budget: '₹40L–60L',
    purpose: 'Investment', source: 'Meta Ads',
    createdAt: new Date(T - 1 * 3600 * 1000),
    scoreBreakdown: { budget: 16, timeline: 18, behavioral: 14, intent: 10 },
  },
  {
    id: 'l5', name: 'Venkat Raman', phone: '+91 54321 09876',
    smartScore: 52, classification: 'MONKEY', priyaStage: 'QUALIFICATION',
    assignedTo: 'Priya S.', slaDeadline: new Date(T + 90 * 60 * 1000),
    pipelineStage: 'Contacted', budget: '₹50L–70L',
    purpose: 'Own Use', source: 'Google',
    createdAt: new Date(T - 3 * 3600 * 1000),
    scoreBreakdown: { budget: 14, timeline: 16, behavioral: 13, intent: 9 },
  },
  {
    id: 'l6', name: 'Lakshmi Priya', phone: '+91 43210 98765',
    smartScore: 44, classification: 'MONKEY', priyaStage: 'GREETING',
    assignedTo: 'Arjun M.', slaDeadline: new Date(T + 70 * 60 * 1000),
    pipelineStage: 'New Lead', budget: '₹35L–55L',
    purpose: 'Rental', source: 'Organic',
    createdAt: new Date(T - 30 * 60 * 1000),
    scoreBreakdown: { budget: 10, timeline: 14, behavioral: 12, intent: 8 },
  },
  {
    id: 'l7', name: 'Karthik Selvam', phone: '+91 32109 87654',
    smartScore: 28, classification: 'DOG', priyaStage: 'QUALIFICATION',
    assignedTo: 'Channel A', slaDeadline: new Date(T + 4 * 3600 * 1000),
    pipelineStage: 'Lead Capture', budget: 'Not Specified',
    purpose: 'Investment', source: 'Meta Ads',
    createdAt: new Date(T - 2 * 60 * 1000),
    scoreBreakdown: { budget: 6, timeline: 8, behavioral: 10, intent: 4 },
  },
  {
    id: 'l8', name: 'Divya Nair', phone: '+91 21098 76543',
    smartScore: 31, classification: 'DOG', priyaStage: 'GREETING',
    assignedTo: 'Channel B', slaDeadline: new Date(T + 5 * 3600 * 1000),
    pipelineStage: 'Lead Capture', budget: 'Not Specified',
    purpose: 'Own Use', source: 'WhatsApp',
    createdAt: new Date(T - 5 * 60 * 1000),
    scoreBreakdown: { budget: 8, timeline: 6, behavioral: 12, intent: 5 },
  },
  {
    id: 'l9', name: 'Mani Chandran', phone: '+91 11223 44556',
    smartScore: 79, classification: 'LION', priyaStage: 'BUDGET_CHECK',
    assignedTo: 'Kavya R.', slaDeadline: new Date(T + 12 * 60 * 1000),
    pipelineStage: 'Contacted', budget: '₹70L–90L',
    purpose: 'Own Use', source: 'Google',
    createdAt: new Date(T - 1.5 * 3600 * 1000),
    scoreBreakdown: { budget: 26, timeline: 22, behavioral: 19, intent: 12 },
  },
  {
    id: 'l10', name: 'Saranya Vijay', phone: '+91 99887 76655',
    smartScore: 63, classification: 'MONKEY', priyaStage: 'TIMELINE_CHECK',
    assignedTo: 'Ravi T.', slaDeadline: new Date(T + 35 * 60 * 1000),
    pipelineStage: 'Qualified', budget: '₹55L–75L',
    purpose: 'Investment', source: 'Referral',
    createdAt: new Date(T - 5 * 3600 * 1000),
    scoreBreakdown: { budget: 18, timeline: 20, behavioral: 16, intent: 9 },
  },
]

// ─── SmartScore Ring ──────────────────────────────────────────────────────────

export function SmartScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? '#F59E0B' : score >= 40 ? '#EAB308' : '#71717A'
  const glowColor = score >= 70 ? 'rgba(245,158,11,0.3)' : score >= 40 ? 'rgba(234,179,8,0.15)' : 'transparent'
  const fontSize = size < 40 ? 9 : 11

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size} height={size}
        className="-rotate-90"
        style={{ filter: score >= 70 ? `drop-shadow(0 0 6px ${glowColor})` : undefined }}
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.08} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={size * 0.08}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontSize, color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
      </div>
    </div>
  )
}

// ─── Classification Badge ─────────────────────────────────────────────────────

const CLASS_MAP: Record<Classification, { emoji: string; label: string; cls: string; dot: string }> = {
  LION:   { emoji: '🦁', label: 'Lion',   cls: 'bg-amber-500/15 border-amber-500/30 text-amber-400',  dot: 'bg-amber-400' },
  MONKEY: { emoji: '🐒', label: 'Monkey', cls: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400', dot: 'bg-yellow-400' },
  DOG:    { emoji: '🐕', label: 'Dog',    cls: 'bg-zinc-700/50  border-zinc-600/30  text-zinc-400',    dot: 'bg-zinc-500' },
}

export function ClassBadge({ classification, showEmoji = true }: { classification: Classification; showEmoji?: boolean }) {
  const { emoji, label, cls } = CLASS_MAP[classification]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      {showEmoji && emoji} {label}
    </span>
  )
}

export function ClassDot({ classification, pulse = false }: { classification: Classification; pulse?: boolean }) {
  const { dot } = CLASS_MAP[classification]
  return (
    <span className="relative inline-flex items-center justify-center w-2 h-2">
      <span className={`w-2 h-2 rounded-full ${dot} ${pulse && classification === 'LION' ? 'animate-ping opacity-75 absolute' : 'hidden'}`} />
      <span className={`w-2 h-2 rounded-full ${dot} relative`} />
    </span>
  )
}

// ─── SLA Timer ────────────────────────────────────────────────────────────────

export function SlaTimer({ deadline, classification }: { deadline: Date; classification: Classification }) {
  const [label, setLabel] = useState('')
  const [breached, setBreached] = useState(false)
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    const update = () => {
      const diff = deadline.getTime() - Date.now()
      if (diff <= 0) {
        setLabel('BREACHED')
        setBreached(true)
        setUrgent(true)
        return
      }
      const totalMins = Math.floor(diff / 60000)
      const hrs = Math.floor(totalMins / 60)
      const mins = totalMins % 60
      setLabel(hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`)
      setBreached(false)
      setUrgent(totalMins <= 20)
    }
    update()
    const t = setInterval(update, 15000)
    return () => clearInterval(t)
  }, [deadline])

  if (breached) return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse">
      ⚠ BREACHED
    </span>
  )
  return (
    <span className={`text-[11px] font-mono font-semibold ${urgent ? 'text-red-400' : 'text-zinc-500'}`}>
      ⏱ {label}
    </span>
  )
}

// ─── Priya Stage Pill ─────────────────────────────────────────────────────────

export const PRIYA_STAGES: PriyaStage[] = [
  'GREETING', 'QUALIFICATION', 'BUDGET_CHECK', 'TIMELINE_CHECK', 'OBJECTION_HANDLING', 'BOOKING',
]

const STAGE_LABELS: Record<PriyaStage, string> = {
  GREETING: 'Greeting', QUALIFICATION: 'Qualify', BUDGET_CHECK: 'Budget',
  TIMELINE_CHECK: 'Timeline', OBJECTION_HANDLING: 'Objections', BOOKING: 'Booking',
}

export function PriyaStagePill({ stage }: { stage: PriyaStage }) {
  const idx = PRIYA_STAGES.indexOf(stage)
  const pct = Math.round(((idx + 1) / PRIYA_STAGES.length) * 100)
  const color = pct >= 83 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-zinc-500'
  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-zinc-500 whitespace-nowrap">{STAGE_LABELS[stage]}</span>
    </div>
  )
}

// ─── Source Pill ──────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  'Meta Ads': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  'Google': 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  'Organic': 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  'Referral': 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  'WhatsApp': 'bg-green-500/10 border-green-500/20 text-green-400',
}

export function SourcePill({ source }: { source: string }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${SOURCE_COLORS[source] || 'bg-zinc-700/40 border-zinc-600/30 text-zinc-400'}`}>
      {source}
    </span>
  )
}

// ─── Glass Card ───────────────────────────────────────────────────────────────

export function GlassCard({ children, className = '', glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={`rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] ${glow ? 'ring-1 ring-amber-500/20 shadow-amber-500/10 shadow-lg' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

export function SectionHeader({ icon, title, subtitle, badge }: {
  icon: React.ReactNode; title: string; subtitle?: string; badge?: string
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-100">{title}</h2>
          {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {badge && (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
          {badge}
        </span>
      )}
    </div>
  )
}
