'use client'

/**
 * /tools — Single-Page AI Intelligence Suite
 *
 * Architecture:
 *   ToolsPage (default export)  — thin Suspense boundary
 *     └─ ToolsHub (Client)      — tab state + URL sync via ?t=
 *          ├─ NeuralBg          — CSS-only background (zero JS)
 *          ├─ Sticky TabBar     — framer layoutId sliding indicator
 *          └─ AnimatePresence   — smooth crossfade between tool panels
 *               └─ ToolPanel    — per-tool hero + glassmorphism card
 */

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  TrendingUp, Calculator, PiggyBank, Building2, MapPin, BarChart3,
  Brain, Sparkles, Zap, Shield, Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Calculators ─────────────────────────────────────────────────────────────
import { ROICalculator }            from '@/components/lead-capture/ROICalculator'
import { EMICalculator }            from '@/components/lead-capture/EMICalculator'
import { BudgetPlanner }            from '@/components/lead-capture/BudgetPlanner'
import { LoanEligibilityCalculator } from '@/components/lead-capture/LoanEligibilityCalculator'
import { NeighborhoodFinder }       from '@/components/lead-capture/NeighborhoodFinder'
import { PropertyValuation }        from '@/components/lead-capture/PropertyValuation'

// ── Accent map ───────────────────────────────────────────────────────────────
type AccentKey = 'amber' | 'emerald' | 'blue' | 'purple'

const ACCENT = {
  amber: {
    icon:      'text-amber-400',
    badge:     'bg-amber-500/10 text-amber-300 border-amber-500/20',
    stat:      'text-amber-400',
    ring:      'ring-amber-500/25 shadow-amber-500/15',
    glow:      'rgba(251,191,36,0.06)',
    tabActive: 'text-amber-300',
    tabBg:     'bg-amber-500/10 border-amber-500/20',
  },
  emerald: {
    icon:      'text-emerald-400',
    badge:     'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    stat:      'text-emerald-400',
    ring:      'ring-emerald-500/25 shadow-emerald-500/15',
    glow:      'rgba(52,211,153,0.06)',
    tabActive: 'text-emerald-300',
    tabBg:     'bg-emerald-500/10 border-emerald-500/20',
  },
  blue: {
    icon:      'text-blue-400',
    badge:     'bg-blue-500/10 text-blue-300 border-blue-500/20',
    stat:      'text-blue-400',
    ring:      'ring-blue-500/25 shadow-blue-500/15',
    glow:      'rgba(96,165,250,0.06)',
    tabActive: 'text-blue-300',
    tabBg:     'bg-blue-500/10 border-blue-500/20',
  },
  purple: {
    icon:      'text-purple-400',
    badge:     'bg-purple-500/10 text-purple-300 border-purple-500/20',
    stat:      'text-purple-400',
    ring:      'ring-purple-500/25 shadow-purple-500/15',
    glow:      'rgba(167,139,250,0.06)',
    tabActive: 'text-purple-300',
    tabBg:     'bg-purple-500/10 border-purple-500/20',
  },
} satisfies Record<AccentKey, Record<string, string>>

// ── Tool config ──────────────────────────────────────────────────────────────
interface ToolConfig {
  id: string
  shortLabel: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge: string
  title: string
  subtitle: string
  description: string
  stats: Array<{ label: string; value: string }>
  accent: AccentKey
  Component: React.ComponentType
}

const TOOLS: ToolConfig[] = [
  {
    id: 'roi',
    shortLabel: 'ROI',
    icon: TrendingUp,
    badge: 'Investment Intelligence',
    title: 'ROI Calculator',
    subtitle: 'AI-Powered Returns Analysis',
    description: 'Calculate rental yield, capital appreciation, and total investment returns — powered by live Chennai market data across 2,400+ transactions.',
    stats: [
      { label: 'Properties Analyzed', value: '2,400+' },
      { label: 'Avg Chennai Yield',   value: '4.1%'   },
      { label: 'Cities Covered',      value: '12'      },
    ],
    accent: 'amber',
    Component: ROICalculator,
  },
  {
    id: 'emi',
    shortLabel: 'EMI',
    icon: Calculator,
    badge: 'Loan Intelligence',
    title: 'EMI Calculator',
    subtitle: 'AI-Powered Loan Analysis',
    description: 'Calculate home loan EMI, total interest payable, and unlock a full amortization schedule with live rate comparisons from 12+ banks.',
    stats: [
      { label: 'Lowest SBI Rate', value: '8.40%' },
      { label: 'Banks Compared',  value: '12+'   },
      { label: 'Avg Tenure',      value: '20 Yrs' },
    ],
    accent: 'amber',
    Component: EMICalculator,
  },
  {
    id: 'budget',
    shortLabel: 'Budget',
    icon: PiggyBank,
    badge: 'Budget Intelligence',
    title: 'Budget Planner',
    subtitle: 'AI-Powered Affordability Analysis',
    description: 'Plan your property budget intelligently — calculate max loan eligibility, stamp duty, registration costs, and browse properties that fit your numbers.',
    stats: [
      { label: 'Avg Down Payment', value: '20%'  },
      { label: 'Properties Listed', value: '234+' },
      { label: 'TN Stamp Duty',    value: '7%'   },
    ],
    accent: 'emerald',
    Component: BudgetPlanner,
  },
  {
    id: 'loan',
    shortLabel: 'Loan',
    icon: Building2,
    badge: 'Credit Intelligence',
    title: 'Loan Eligibility',
    subtitle: 'AI-Powered Bank Matching',
    description: 'Check your home loan eligibility across Tamil Nadu banks and PMAY schemes. Get pre-approval readiness score in under 60 seconds.',
    stats: [
      { label: 'Banks Integrated',  value: '8'      },
      { label: 'PMAY Subsidy',      value: '₹2.67L' },
      { label: 'Avg Approval Time', value: '7 Days' },
    ],
    accent: 'blue',
    Component: LoanEligibilityCalculator,
  },
  {
    id: 'neighborhood',
    shortLabel: 'Locality',
    icon: MapPin,
    badge: 'Area Intelligence',
    title: 'Neighborhood Finder',
    subtitle: 'AI-Powered Location Matching',
    description: 'Discover the perfect neighborhood based on your lifestyle, commute, schools, and budget — scored across 12 Tamil Nadu data points.',
    stats: [
      { label: 'Localities Scored', value: '180+' },
      { label: 'Data Points',       value: '12'   },
      { label: 'Cities Covered',    value: '8'    },
    ],
    accent: 'purple',
    Component: NeighborhoodFinder,
  },
  {
    id: 'valuation',
    shortLabel: 'Valuation',
    icon: BarChart3,
    badge: 'Valuation Intelligence',
    title: 'Property Valuation',
    subtitle: 'AI-Powered RERA Analysis',
    description: "Get an instant AI estimate of your property's market value using RERA-verified comparable sales data and Chennai micro-market trends.",
    stats: [
      { label: 'RERA Records',    value: '1.2M+' },
      { label: 'Accuracy Rate',   value: '94%'   },
      { label: 'Markets Tracked', value: '340+'  },
    ],
    accent: 'amber',
    Component: PropertyValuation,
  },
]

// ── CSS-only Neural Background ────────────────────────────────────────────────
function NeuralBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black" />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(251,191,36,1) 1px,transparent 1px),' +
            'linear-gradient(90deg,rgba(251,191,36,1) 1px,transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      {/* Top radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(ellipse,rgba(251,191,36,0.05) 0%,transparent 70%)' }}
      />
      {/* CSS-animated orbs */}
      <div
        className="absolute w-72 h-72 rounded-full blur-3xl bg-amber-500/[0.06]"
        style={{ top: '12%', left: '6%', animation: 'tool-orb-1 18s ease-in-out infinite' }}
      />
      <div
        className="absolute w-56 h-56 rounded-full blur-3xl bg-purple-500/[0.05]"
        style={{ bottom: '20%', right: '8%', animation: 'tool-orb-2 22s ease-in-out infinite' }}
      />
    </div>
  )
}

// ── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({ label, value, accent }: { label: string; value: string; accent: AccentKey }) {
  const col = ACCENT[accent]
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl backdrop-blur-xl bg-white/[0.04] border border-white/[0.08]">
      <span className={cn('text-lg font-black tabular-nums leading-none', col.stat)}>{value}</span>
      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest whitespace-nowrap">{label}</span>
    </div>
  )
}

// ── Main Hub Client ───────────────────────────────────────────────────────────
function ToolsHub() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const activeId = searchParams.get('t') ?? 'roi'
  const activeTool = TOOLS.find(t => t.id === activeId) ?? TOOLS[0]
  const col = ACCENT[activeTool.accent]
  const ActiveIcon = activeTool.icon
  const ActiveComponent = activeTool.Component

  // Split title: last word gets accent colour
  const words = activeTool.title.split(' ')
  const lastWord = words.pop() ?? ''
  const restWords = words.join(' ')

  function setActive(id: string) {
    router.replace(`/tools?t=${id}`, { scroll: false })
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <NeuralBg />

      {/* ── Back nav ── */}
      <nav className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-amber-400 text-sm transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
      </nav>

      {/* ── Page hero ── */}
      <header className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Brain size={11} className="opacity-70" />
            AI Intelligence Suite
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            <span className="text-white">6 AI-Powered </span>
            <span className="text-amber-400">Tools</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-lg leading-relaxed">
            Smarter real estate decisions — ROI, loans, budgets, locality, and valuations in one place.
          </p>
        </div>
      </header>

      {/* ── Sticky Tab Bar ── */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-zinc-950/85 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div
            className="flex gap-1 overflow-x-auto py-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {TOOLS.map((tool) => {
              const Icon = tool.icon
              const isActive = tool.id === activeId
              const tabCol = ACCENT[tool.accent]

              return (
                <button
                  key={tool.id}
                  onClick={() => setActive(tool.id)}
                  className={cn(
                    'relative flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium',
                    'whitespace-nowrap transition-colors flex-shrink-0 select-none',
                    isActive
                      ? tabCol.tabActive
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]',
                  )}
                >
                  <Icon size={13} className="flex-shrink-0" />
                  <span>{tool.shortLabel}</span>

                  {/* Sliding pill indicator via layoutId */}
                  {isActive && (
                    <motion.div
                      layoutId="tools-tab-indicator"
                      className={cn('absolute inset-0 rounded-lg border', tabCol.tabBg)}
                      style={{ zIndex: -1 }}
                      transition={{ type: 'spring', bounce: 0.12, duration: 0.38 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Tool content (AnimatePresence) ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeId}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Tool Hero */}
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-8 text-center">
            <div className="flex flex-col items-center gap-4">
              {/* Icon + badge row */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-11 h-11 rounded-2xl backdrop-blur-xl bg-white/[0.06] border shadow-xl ring-1 flex items-center justify-center',
                  col.ring,
                )}>
                  <ActiveIcon size={20} className={col.icon} />
                </div>
                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border', col.badge)}>
                  <Zap size={10} className="opacity-70" />
                  {activeTool.badge}
                </span>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  {restWords && <span className="text-white">{restWords} </span>}
                  <span className={col.icon}>{lastWord}</span>
                </h2>
                <p className="mt-1 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                  {activeTool.subtitle}
                </p>
              </div>

              {/* Description */}
              <p className="max-w-lg text-zinc-400 text-sm leading-relaxed">{activeTool.description}</p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-2">
                {activeTool.stats.map(s => (
                  <StatChip key={s.label} {...s} accent={activeTool.accent} />
                ))}
              </div>
            </div>
          </div>

          {/* Calculator Card */}
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-24">
            <div className={cn(
              'rounded-3xl backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08]',
              'shadow-2xl ring-1',
              col.ring,
            )}>
              {/* Card top strip */}
              <div className="flex items-center gap-2 px-6 py-3 border-b border-white/[0.06]">
                <Sparkles size={11} className={cn(col.icon, 'opacity-60')} />
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest select-none">
                  AI-Powered · Real-Time · Tharaga Intelligence
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[10px] text-zinc-600">Live</span>
                </div>
              </div>

              {/* Calculator */}
              <div className="p-4 sm:p-8">
                <ActiveComponent />
              </div>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-5 opacity-50">
              {['RERA Compliant', 'Real-time Data', 'Trusted by 2000+ Buyers'].map((label) => (
                <span key={label} className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-500/60 inline-block" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Page export (Suspense boundary for useSearchParams) ───────────────────────
export default function ToolsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
            <p className="text-sm text-zinc-500">Loading tools…</p>
          </div>
        </div>
      }
    >
      <ToolsHub />
    </Suspense>
  )
}
