/**
 * ToolPageShell — Server Component
 *
 * Architecture:
 *   ToolPageShell (Server)           — renders hero, meta, background via CSS
 *     └─ ToolCard (Client)           — framer-motion card entrance + glassmorphism
 *          └─ {children}             — the calculator ('use client' internally)
 *
 * Benefits:
 *  • Shell HTML arrives in first server response → no white flash, instant dark bg
 *  • Zero extra JS for title / stats / background
 *  • Calculator hydrates independently; React streaming keeps TTI fast
 */
import { type ReactNode, type ComponentType } from 'react'
import Link from 'next/link'
import { ArrowLeft, Brain, Shield, Zap, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import ToolCard from './ToolCard'

// ─── Accent map ───────────────────────────────────────────────────────────────
const ACCENT = {
  amber: {
    icon:  'text-amber-400',
    ring:  'ring-amber-500/30 shadow-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    orb1:  'bg-amber-500/8',
    orb2:  'bg-amber-500/5',
  },
  emerald: {
    icon:  'text-emerald-400',
    ring:  'ring-emerald-500/30 shadow-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    orb1:  'bg-emerald-500/8',
    orb2:  'bg-emerald-500/5',
  },
  blue: {
    icon:  'text-blue-400',
    ring:  'ring-blue-500/30 shadow-blue-500/20',
    badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    orb1:  'bg-blue-500/8',
    orb2:  'bg-blue-500/5',
  },
  purple: {
    icon:  'text-purple-400',
    ring:  'ring-purple-500/30 shadow-purple-500/20',
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    orb1:  'bg-purple-500/8',
    orb2:  'bg-purple-500/5',
  },
}

// ─── CSS-only neural background ───────────────────────────────────────────────
function NeuralBg({ accent }: { accent: keyof typeof ACCENT }) {
  const col = ACCENT[accent]
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
      {/* Base */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black" />
      {/* Amber grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(251,191,36,1) 1px,transparent 1px),' +
            'linear-gradient(90deg,rgba(251,191,36,1) 1px,transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      {/* Top radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(ellipse,rgba(251,191,36,0.06) 0%,transparent 70%)' }}
      />
      {/* CSS-animated orbs — no JS needed */}
      <div
        className={cn('absolute w-80 h-80 rounded-full blur-3xl', col.orb1)}
        style={{ top: '14%', left: '8%', animation: 'tool-orb-1 18s ease-in-out infinite' }}
      />
      <div
        className={cn('absolute w-64 h-64 rounded-full blur-3xl bg-purple-500/5')}
        style={{ bottom: '18%', right: '10%', animation: 'tool-orb-2 22s ease-in-out infinite' }}
      />
    </div>
  )
}

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
      <span className="text-lg font-black text-amber-400 tabular-nums leading-none">{value}</span>
      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ToolPageShellProps {
  /** Lucide icon component — e.g. Calculator, TrendingUp */
  icon: ComponentType<{ size?: number; className?: string }>
  /** Short pill label */
  badge: string
  title: string
  subtitle: string
  description: string
  stats?: Array<{ label: string; value: string }>
  accent?: keyof typeof ACCENT
  backHref?: string
  children: ReactNode
}

// ─── Shell ────────────────────────────────────────────────────────────────────
export default function ToolPageShell({
  icon: Icon,
  badge,
  title,
  subtitle,
  description,
  stats = [],
  accent = 'amber',
  backHref = '/',
  children,
}: ToolPageShellProps) {
  const col = ACCENT[accent]

  // Split title: last word gets accent colour
  const words = title.split(' ')
  const last = words.pop() ?? ''
  const rest = words.join(' ')

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <NeuralBg accent={accent} />

      {/* ── Back nav ── */}
      <nav className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-amber-400 text-sm transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
      </nav>

      {/* ── Hero ── */}
      <header className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-10 text-center">
        <div className="flex flex-col items-center gap-5">
          {/* Icon + badge */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-2xl backdrop-blur-xl bg-white/8 border shadow-xl',
              'ring-1 flex items-center justify-center',
              col.ring,
            )}>
              <Icon size={22} className={col.icon} />
            </div>
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
              col.badge,
            )}>
              <Brain size={11} className="opacity-70" />
              {badge}
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              {rest && <span className="text-white">{rest} </span>}
              <span className={col.icon}>{last}</span>
            </h1>
            <p className="mt-1 text-sm font-semibold text-amber-500/60 uppercase tracking-widest">
              {subtitle}
            </p>
          </div>

          {/* Description */}
          <p className="max-w-xl text-zinc-400 text-base leading-relaxed">{description}</p>

          {/* Stats */}
          {stats.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {stats.map(s => <StatChip key={s.label} {...s} />)}
            </div>
          )}
        </div>
      </header>

      {/* ── Card (client — handles entrance animation) ── */}
      <ToolCard accent={accent}>
        {children}
      </ToolCard>
    </div>
  )
}
