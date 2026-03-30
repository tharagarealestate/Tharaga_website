'use client'

/**
 * /tools — Single-Page AI Intelligence Suite
 *
 * Layout:
 *   Sticky TabBar  (6 tabs, framer layoutId sliding pill)
 *   AnimatePresence panel per tab:
 *     Desktop: 300px info sidebar (sticky) | right: raw calculator (no wrapper card)
 *     Mobile:  compact hero row → calculator stacked below
 */

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  TrendingUp, Calculator, PiggyBank, Building2, MapPin, BarChart3,
  Brain, Zap, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Calculators ───────────────────────────────────────────────────────────────
import { ROICalculator }             from '@/components/lead-capture/ROICalculator'
import { EMICalculator }             from '@/components/lead-capture/EMICalculator'
import { BudgetPlanner }             from '@/components/lead-capture/BudgetPlanner'
import { LoanEligibilityCalculator } from '@/components/lead-capture/LoanEligibilityCalculator'
import { NeighborhoodFinder }        from '@/components/lead-capture/NeighborhoodFinder'
import { PropertyValuation }         from '@/components/lead-capture/PropertyValuation'

// ── Accent tokens ─────────────────────────────────────────────────────────────
type AccentKey = 'amber' | 'emerald' | 'blue' | 'purple'

const ACCENT: Record<AccentKey, {
  icon: string; badge: string; stat: string; ring: string;
  tabActive: string; tabBg: string; orb: string; divider: string;
}> = {
  amber: {
    icon:      'text-amber-400',
    badge:     'bg-amber-500/10 text-amber-300 border-amber-500/20',
    stat:      'text-amber-400',
    ring:      'ring-amber-500/20 shadow-amber-500/10',
    tabActive: 'text-amber-300',
    tabBg:     'bg-amber-500/10 border-amber-500/20',
    orb:       'bg-amber-500/[0.07]',
    divider:   'from-transparent via-amber-500/20 to-transparent',
  },
  emerald: {
    icon:      'text-emerald-400',
    badge:     'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    stat:      'text-emerald-400',
    ring:      'ring-emerald-500/20 shadow-emerald-500/10',
    tabActive: 'text-emerald-300',
    tabBg:     'bg-emerald-500/10 border-emerald-500/20',
    orb:       'bg-emerald-500/[0.06]',
    divider:   'from-transparent via-emerald-500/20 to-transparent',
  },
  blue: {
    icon:      'text-blue-400',
    badge:     'bg-blue-500/10 text-blue-300 border-blue-500/20',
    stat:      'text-blue-400',
    ring:      'ring-blue-500/20 shadow-blue-500/10',
    tabActive: 'text-blue-300',
    tabBg:     'bg-blue-500/10 border-blue-500/20',
    orb:       'bg-blue-500/[0.06]',
    divider:   'from-transparent via-blue-500/20 to-transparent',
  },
  purple: {
    icon:      'text-purple-400',
    badge:     'bg-purple-500/10 text-purple-300 border-purple-500/20',
    stat:      'text-purple-400',
    ring:      'ring-purple-500/20 shadow-purple-500/10',
    tabActive: 'text-purple-300',
    tabBg:     'bg-purple-500/10 border-purple-500/20',
    orb:       'bg-purple-500/[0.06]',
    divider:   'from-transparent via-purple-500/20 to-transparent',
  },
}

// ── Tool config ───────────────────────────────────────────────────────────────
interface ToolConfig {
  id: string
  shortLabel: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge: string
  title: string
  subtitle: string
  description: string
  stats: Array<{ label: string; value: string }>
  trust: string[]
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
    description: 'Calculate rental yield, capital appreciation, and total returns — powered by live Chennai market data across 2,400+ transactions.',
    stats: [
      { label: 'Properties Analyzed', value: '2,400+' },
      { label: 'Avg Chennai Yield',   value: '4.1%'   },
      { label: 'Cities Covered',      value: '12'      },
    ],
    trust: ['RERA Compliant', 'Real-time data', 'No sign-up required'],
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
    description: 'Calculate EMI, total interest payable, and get a full amortization schedule with live rate comparisons from 12+ banks.',
    stats: [
      { label: 'Lowest SBI Rate', value: '8.40%'  },
      { label: 'Banks Compared',  value: '12+'     },
      { label: 'Avg Tenure',      value: '20 Yrs'  },
    ],
    trust: ['Live bank rates', 'Amortization table', 'Instant results'],
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
    description: 'Plan your property budget — calculate max loan eligibility, stamp duty, registration costs, and find properties in your range.',
    stats: [
      { label: 'Avg Down Payment',  value: '20%'   },
      { label: 'Properties Listed', value: '234+'  },
      { label: 'TN Stamp Duty',     value: '7%'    },
    ],
    trust: ['TN registration rates', 'Budget matching', 'Instant estimate'],
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
    description: 'Check eligibility across Tamil Nadu banks and PMAY schemes. Get your pre-approval readiness score in under 60 seconds.',
    stats: [
      { label: 'Banks Integrated',  value: '8'       },
      { label: 'PMAY Subsidy',      value: '₹2.67L'  },
      { label: 'Avg Approval Time', value: '7 Days'  },
    ],
    trust: ['PMAY subsidy check', '8 banks', 'Pre-approval score'],
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
    description: 'Discover the perfect neighborhood based on lifestyle, commute, schools, and budget — scored across 12 Tamil Nadu data points.',
    stats: [
      { label: 'Localities Scored', value: '180+'  },
      { label: 'Data Points',       value: '12'    },
      { label: 'Cities Covered',    value: '8'     },
    ],
    trust: ['School proximity', 'Commute scoring', '180+ localities'],
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
    description: "Get an instant AI estimate of your property's market value using RERA-verified comparable sales and Chennai micro-market trends.",
    stats: [
      { label: 'RERA Records',    value: '1.2M+'  },
      { label: 'Accuracy Rate',   value: '94%'    },
      { label: 'Markets Tracked', value: '340+'   },
    ],
    trust: ['RERA verified data', '94% accuracy', 'Instant estimate'],
    accent: 'amber',
    Component: PropertyValuation,
  },
]

// ── CSS-only Neural Background ─────────────────────────────────────────────────
function NeuralBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-black" />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(251,191,36,1) 1px,transparent 1px),' +
            'linear-gradient(90deg,rgba(251,191,36,1) 1px,transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[320px]"
        style={{ background: 'radial-gradient(ellipse,rgba(251,191,36,0.04) 0%,transparent 65%)' }}
      />
      <div
        className="absolute w-80 h-80 rounded-full blur-3xl bg-amber-500/[0.05]"
        style={{ top: '15%', left: '3%', animation: 'tool-orb-1 20s ease-in-out infinite' }}
      />
      <div
        className="absolute w-64 h-64 rounded-full blur-3xl bg-purple-500/[0.04]"
        style={{ bottom: '20%', right: '5%', animation: 'tool-orb-2 25s ease-in-out infinite' }}
      />
    </div>
  )
}

// ── Main Hub ───────────────────────────────────────────────────────────────────
function ToolsHub() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const activeId    = searchParams.get('t') ?? 'roi'
  const activeTool  = TOOLS.find(t => t.id === activeId) ?? TOOLS[0]
  const col         = ACCENT[activeTool.accent]
  const ActiveIcon  = activeTool.icon
  const ActiveComp  = activeTool.Component

  // Split title for accent on last word
  const words    = activeTool.title.split(' ')
  const lastWord = words.pop() ?? ''
  const restWord = words.join(' ')

  function setActive(id: string) {
    router.replace(`/tools?t=${id}`, { scroll: false })
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <NeuralBg />

      {/* ── Sticky Tab Bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-zinc-950/85 border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Back nav + tabs on same row */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex-shrink-0 flex items-center gap-1 text-zinc-600 hover:text-amber-400 text-xs transition-colors py-3.5"
            >
              <ArrowLeft size={12} />
              <span className="hidden sm:inline">Home</span>
            </Link>

            <div className="w-px h-4 bg-white/[0.06] flex-shrink-0" />

            {/* Tabs */}
            <div
              className="flex gap-0.5 overflow-x-auto py-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {TOOLS.map((tool) => {
                const Icon     = tool.icon
                const isActive = tool.id === activeId
                const tCol     = ACCENT[tool.accent]

                return (
                  <button
                    key={tool.id}
                    onClick={() => setActive(tool.id)}
                    className={cn(
                      'relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium',
                      'whitespace-nowrap transition-colors flex-shrink-0 select-none',
                      isActive
                        ? tCol.tabActive
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]',
                    )}
                  >
                    <Icon size={13} className="flex-shrink-0" />
                    <span>{tool.shortLabel}</span>
                    {isActive && (
                      <motion.div
                        layoutId="tools-tab-indicator"
                        className={cn('absolute inset-0 rounded-lg border', tCol.tabBg)}
                        style={{ zIndex: -1 }}
                        transition={{ type: 'spring', bounce: 0.1, duration: 0.36 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Live badge — right */}
            <div className="ml-auto flex-shrink-0 hidden sm:flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Animated Panel ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-7xl mx-auto px-4 sm:px-6"
        >
          {/* ── Two-column split ─────────────────────────────────────────── */}
          <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-0">

            {/* ─── LEFT: Info sidebar ─────────────────────────────────────── */}
            <div className="lg:sticky lg:top-[57px] lg:self-start pt-8 pb-8 lg:pr-8 lg:border-r lg:border-white/[0.05]">

              {/* Icon ring + badge */}
              <div className="flex items-center gap-3 mb-5">
                <div className={cn(
                  'w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center',
                  'backdrop-blur-xl bg-white/[0.06] border border-white/[0.08]',
                  'shadow-xl ring-1', col.ring,
                )}>
                  <ActiveIcon size={19} className={col.icon} />
                </div>
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
                  'text-[11px] font-semibold border',
                  col.badge,
                )}>
                  <Zap size={9} className="opacity-70" />
                  {activeTool.badge}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-black tracking-tight leading-tight mb-1">
                {restWord && <span className="text-white">{restWord} </span>}
                <span className={col.icon}>{lastWord}</span>
              </h1>
              <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold mb-3">
                {activeTool.subtitle}
              </p>

              {/* Description */}
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                {activeTool.description}
              </p>

              {/* Accent divider */}
              <div className={cn('h-px mb-6 bg-gradient-to-r', col.divider)} />

              {/* Stats — vertical rows */}
              <div className="space-y-3 mb-6">
                {activeTool.stats.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">{s.label}</span>
                    <span className={cn('text-sm font-bold tabular-nums', col.stat)}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Accent divider */}
              <div className={cn('h-px mb-5 bg-gradient-to-r', col.divider)} />

              {/* Trust signals */}
              <div className="space-y-2">
                {activeTool.trust.map(t => (
                  <div key={t} className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-zinc-700 flex-shrink-0" />
                    <span className="text-xs text-zinc-600">{t}</span>
                  </div>
                ))}
              </div>

              {/* Quick-switch to other tools — mobile only (desktop has tab bar) */}
              <div className="mt-6 pt-5 border-t border-white/[0.04] lg:hidden">
                <p className="text-[10px] uppercase tracking-widest text-zinc-700 mb-2">Switch tool</p>
                <div className="flex flex-wrap gap-1.5">
                  {TOOLS.filter(t => t.id !== activeId).map(t => {
                    const TIcon = t.icon
                    const tc    = ACCENT[t.accent]
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActive(t.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium',
                          'border border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.12]',
                          'transition-colors',
                        )}
                      >
                        <TIcon size={10} />
                        {t.shortLabel}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ─── RIGHT: Raw calculator (no wrapper card) ─────────────────── */}
            <div className="py-8 lg:pl-8">
              <ActiveComp />
            </div>

          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────
export default function ToolsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
            <p className="text-sm text-zinc-500">Loading…</p>
          </div>
        </div>
      }
    >
      <ToolsHub />
    </Suspense>
  )
}
