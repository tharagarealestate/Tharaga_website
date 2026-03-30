'use client'

/**
 * AgenticShared — Shared UI components for Tharaga builder dashboard.
 * HOT / WARM / COOL tier system (industry-standard, replaces animal names).
 * Tharaga AI — 6-stage WhatsApp qualification engine.
 * NO mock data — all components work with real Supabase data.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Zap, Building2, TrendingUp, MessageSquare } from 'lucide-react'

// Re-export types from hook for convenience
export type { Tier, AIStage, DashboardLead, DashboardStats } from '../hooks/useDashboardData'
export { AI_STAGES, AI_STAGE_LABELS, useDashboardData } from '../hooks/useDashboardData'

import type { Tier, AIStage } from '../hooks/useDashboardData'
import { AI_STAGES, AI_STAGE_LABELS } from '../hooks/useDashboardData'

// ─── Tier config ──────────────────────────────────────────────────────────────

export const TIER_CONFIG: Record<Tier, {
  label: string; emoji: string
  badge: string; border: string; dot: string; glow: boolean
}> = {
  HOT:  { label: 'Lion',   emoji: '🦁', badge: 'bg-red-500/15    border-red-500/30    text-red-400',    border: 'border-red-500/40',  dot: 'bg-red-400',    glow: true  },
  WARM: { label: 'Monkey', emoji: '🐒', badge: 'bg-amber-500/15  border-amber-500/30  text-amber-400',  border: 'border-amber-500/35',dot: 'bg-amber-400',  glow: false },
  COOL: { label: 'Dog',    emoji: '🐕', badge: 'bg-zinc-700/50   border-zinc-600/30   text-zinc-400',   border: 'border-zinc-700/50', dot: 'bg-zinc-500',   glow: false },
}

// ─── SmartScore Ring ──────────────────────────────────────────────────────────

export function SmartScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r       = size * 0.38
  const circ    = 2 * Math.PI * r
  const offset  = circ - (score / 100) * circ
  const tier: Tier = score >= 70 ? 'HOT' : score >= 40 ? 'WARM' : 'COOL'
  const color   = tier === 'HOT' ? '#EF4444' : tier === 'WARM' ? '#F59E0B' : '#71717A'
  const glow    = tier === 'HOT' ? `drop-shadow(0 0 6px rgba(239,68,68,0.4))` : undefined
  const fs      = size < 40 ? 9 : 11

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ filter: glow }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size*0.08} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={size*0.08}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontSize: fs, color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
      </div>
    </div>
  )
}

// ─── Tier Badge ───────────────────────────────────────────────────────────────

export function TierBadge({ tier, showEmoji = true }: { tier: Tier; showEmoji?: boolean }) {
  const cfg = TIER_CONFIG[tier]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.badge}`}>
      {showEmoji && cfg.emoji} {cfg.label}
    </span>
  )
}

// ─── SLA Timer ────────────────────────────────────────────────────────────────

export function SlaTimer({ deadline, tier }: { deadline: string | null; tier: Tier }) {
  const [label, setLabel]     = useState('—')
  const [breached, setBreached] = useState(false)
  const [urgent, setUrgent]   = useState(false)

  useEffect(() => {
    if (!deadline) { setLabel('No SLA'); return }
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) { setLabel('BREACHED'); setBreached(true); setUrgent(true); return }
      const mins = Math.floor(diff / 60000)
      const hrs  = Math.floor(mins / 60)
      setLabel(hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`)
      setBreached(false)
      setUrgent(mins <= 20)
    }
    update()
    const t = setInterval(update, 15000)
    return () => clearInterval(t)
  }, [deadline])

  if (!deadline) return <span className="text-[11px] text-zinc-700">—</span>

  if (breached) return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse">
      ⚠ BREACHED
    </span>
  )
  return (
    <span className={`text-[11px] font-mono font-semibold tabular-nums ${urgent ? 'text-red-400' : 'text-zinc-500'}`}>
      ⏱ {label}
    </span>
  )
}

// ─── Tharaga AI Stage Pill ────────────────────────────────────────────────────

export function TharagaAIStagePill({ stage }: { stage: AIStage | null }) {
  if (!stage) return <span className="text-[11px] text-zinc-700">Not started</span>
  const idx  = AI_STAGES.indexOf(stage)
  const pct  = Math.round(((idx + 1) / AI_STAGES.length) * 100)
  const color = pct >= 83 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-zinc-500'
  return (
    <div className="flex items-center gap-1.5 min-w-[90px]">
      <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-zinc-500 whitespace-nowrap">{AI_STAGE_LABELS[stage]}</span>
    </div>
  )
}

// ─── Source Pill ──────────────────────────────────────────────────────────────

const SOURCE_STYLES: Record<string, string> = {
  'Meta Ads':  'bg-blue-500/10   border-blue-500/20   text-blue-400',
  'Google':    'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  'Organic':   'bg-violet-500/10 border-violet-500/20  text-violet-400',
  'Referral':  'bg-amber-500/10  border-amber-500/20   text-amber-400',
  'WhatsApp':  'bg-green-500/10  border-green-500/20   text-green-400',
}

export function SourcePill({ source }: { source: string | null }) {
  if (!source) return null
  const cls = SOURCE_STYLES[source] ?? 'bg-zinc-700/40 border-zinc-600/30 text-zinc-400'
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${cls}`}>{source}</span>
  )
}

// ─── Glass Card ───────────────────────────────────────────────────────────────

export function GlassCard({ children, className = '', glow = false }: {
  children: React.ReactNode; className?: string; glow?: boolean
}) {
  return (
    <div className={`rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] ${glow ? 'ring-1 ring-red-500/15 shadow-red-500/10 shadow-lg' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

export function DashboardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* KPI row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-5 animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-white/[0.06] mb-4" />
            <div className="h-7 bg-white/[0.06] rounded w-2/3 mb-2" />
            <div className="h-3 bg-white/[0.04] rounded w-1/2" />
          </div>
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4 animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/[0.06] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/[0.06] rounded w-1/3" />
            <div className="h-3 bg-white/[0.04] rounded w-1/2" />
          </div>
          <div className="h-6 w-14 bg-white/[0.06] rounded-full" />
          <div className="h-6 w-12 bg-white/[0.05] rounded" />
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  primaryAction?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; href: string }
}

export function EmptyState({ icon, title, description, primaryAction, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5 text-amber-400">
        {icon ?? <Users className="w-6 h-6" />}
      </div>
      <h3 className="text-zinc-100 text-lg font-semibold mb-2">{title}</h3>
      <p className="text-zinc-500 text-sm max-w-xs mb-7 leading-relaxed">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {primaryAction && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={primaryAction.onClick}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm font-semibold hover:bg-amber-500/15 transition-colors"
          >
            <Zap className="w-4 h-4" />
            {primaryAction.label}
          </motion.button>
        )}
        {secondaryAction && (
          <a
            href={secondaryAction.href}
            target="_blank"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 text-sm font-medium hover:bg-white/[0.07] transition-colors"
          >
            {secondaryAction.label}
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Error Display ────────────────────────────────────────────────────────────

export function ErrorDisplay({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <span className="text-red-400 text-xl">⚠</span>
      </div>
      <p className="text-red-400 text-sm font-medium mb-2">Failed to load data</p>
      <p className="text-zinc-600 text-xs mb-5 max-w-xs">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs text-amber-400 hover:text-amber-300 underline transition-colors">
          Retry
        </button>
      )}
    </div>
  )
}

// ─── Quick Empty for sections with no supporting data (channels, CAPI etc.) ──

export function ComingSoonEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-10 h-10 rounded-xl bg-zinc-800/50 border border-zinc-700/40 flex items-center justify-center mb-4">
        <span className="text-zinc-400 text-lg">📡</span>
      </div>
      <p className="text-zinc-300 text-sm font-medium">{title}</p>
      <p className="text-zinc-600 text-xs mt-1 max-w-xs">{description}</p>
    </div>
  )
}
