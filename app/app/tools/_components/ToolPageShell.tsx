'use client'

import { ReactNode, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  TrendingUp, Calculator, PiggyBank, Building2,
  MapPin, BarChart3, Brain, Sparkles, ArrowLeft,
  Zap, Shield, Star,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.FC<any>> = {
  TrendingUp, Calculator, PiggyBank, Building2, MapPin, BarChart3,
}

// ─── Neural Background ────────────────────────────────────────────────────────
function NeuralBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black" />
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(251,191,36,1) 1px,transparent 1px),' +
            'linear-gradient(90deg,rgba(251,191,36,1) 1px,transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
      {/* Orbs */}
      <motion.div
        className="absolute top-[15%] left-[8%] w-80 h-80 bg-amber-500/6 rounded-full blur-3xl"
        animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-purple-500/4 rounded-full blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
      <span className="text-lg font-black text-amber-400 tabular-nums">{value}</span>
      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest whitespace-nowrap">{label}</span>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ToolPageShellProps {
  children: ReactNode
  /** Icon key from ICON_MAP */
  icon: keyof typeof ICON_MAP
  /** Amber pill text above title */
  badge: string
  title: string
  subtitle: string
  description: string
  stats?: Array<{ label: string; value: string }>
  /** Accent color variant (default: amber) */
  accent?: 'amber' | 'emerald' | 'blue' | 'purple'
  backHref?: string
}

const ACCENT: Record<NonNullable<ToolPageShellProps['accent']>, { ring: string; glow: string; icon: string; badge: string }> = {
  amber:  { ring: 'ring-amber-500/30',  glow: 'shadow-amber-500/20',  icon: 'text-amber-400',  badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  emerald:{ ring: 'ring-emerald-500/30',glow: 'shadow-emerald-500/20',icon: 'text-emerald-400',badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  blue:   { ring: 'ring-blue-500/30',   glow: 'shadow-blue-500/20',   icon: 'text-blue-400',   badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  purple: { ring: 'ring-purple-500/30', glow: 'shadow-purple-500/20', icon: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
}

// ─── Shell ────────────────────────────────────────────────────────────────────
export default function ToolPageShell({
  children,
  icon,
  badge,
  title,
  subtitle,
  description,
  stats = [],
  accent = 'amber',
  backHref = '/',
}: ToolPageShellProps) {
  const Icon = ICON_MAP[icon] || Calculator
  const col = ACCENT[accent]
  const cardRef = useRef<HTMLDivElement>(null)
  const inView = useInView(cardRef, { once: true, margin: '-60px' })

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <NeuralBackground />

      {/* ── Back nav ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-amber-400 text-sm transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
      </div>

      {/* ── Hero ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-5"
        >
          {/* Icon + badge row */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-2xl backdrop-blur-xl bg-white/8 border ring-1 flex items-center justify-center',
              col.ring, col.glow, 'shadow-xl'
            )}>
              <Icon size={22} className={col.icon} />
            </div>
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
              col.badge
            )}>
              <Brain size={11} className="opacity-70" />
              {badge}
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              <span className="text-white">{title.split(' ').slice(0, -1).join(' ')} </span>
              <span className="text-amber-400">{title.split(' ').slice(-1)[0]}</span>
            </h1>
            <p className="mt-1 text-sm font-semibold text-amber-500/70 uppercase tracking-widest">
              {subtitle}
            </p>
          </div>

          {/* Description */}
          <p className="max-w-xl text-zinc-400 text-base leading-relaxed">{description}</p>

          {/* Stats strip */}
          {stats.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {stats.map(s => <StatChip key={s.label} {...s} />)}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Calculator card ── */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-20"
      >
        <div className={cn(
          'rounded-3xl backdrop-blur-2xl bg-white/[0.04] border border-white/10 shadow-2xl',
          col.glow, 'shadow-xl ring-1', col.ring
        )}>
          {/* Top accent strip */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-white/8">
            <Sparkles size={13} className={cn(col.icon, 'opacity-70')} />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
              AI-Powered · Real-Time · Tharaga Intelligence
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-zinc-600">Live</span>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {children}
          </div>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 opacity-60">
          {[
            { Icon: Shield, label: 'RERA Compliant' },
            { Icon: Zap,    label: 'Real-time Data' },
            { Icon: Star,   label: 'Trusted by 2000+ Buyers' },
          ].map(({ Icon: I, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-500">
              <I size={12} className="text-amber-500/60" />
              {label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
