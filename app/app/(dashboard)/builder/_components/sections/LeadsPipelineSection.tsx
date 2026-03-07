"use client"

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, LayoutGrid, List, BarChart2,
  Phone, Mail, Calendar, Eye, Target, Clock,
  CheckCircle2, XCircle, DollarSign, Shield,
  X, ExternalLink, SlidersHorizontal,
  Flame, Thermometer, Snowflake, AlertTriangle,
  Activity, TrendingUp, MessageSquare,
  Sparkles, ChevronDown, Filter,
  RefreshCcw, GripVertical, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderDataContext, useRealtimeData, formatINR, timeAgo } from '../hooks/useBuilderData'

// ─── Types ──────────────────────────────────────────────────────────────────

interface LeadsPipelineProps {
  onNavigate?: (section: string) => void
}

type ViewMode = 'kanban' | 'list' | 'analytics'
type SortBy = 'newest' | 'oldest' | 'value_high' | 'value_low' | 'score_high'

interface PipelineItem {
  id: string
  lead_id: string
  builder_id: string
  stage: string
  stage_order: number
  entered_stage_at: string
  days_in_stage: number
  deal_value: number
  expected_close_date: string
  probability: number
  last_activity_at: string
  last_activity_type: string
  next_followup_date: string
  notes: string
  loss_reason: string
  created_at: string
  updated_at: string
  lead?: {
    id: string
    category: string
    score: number
    last_activity: string
    user?: {
      email: string
      full_name: string
      phone: string
    }
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

const WIP_LIMIT = 8

const STAGE_CONFIG = [
  { id: 'new', label: 'New Leads', color: 'bg-blue-500', lightBg: 'bg-blue-500/8', borderColor: 'border-blue-500/20', textColor: 'text-blue-400', icon: Users },
  { id: 'contacted', label: 'Contacted', color: 'bg-cyan-500', lightBg: 'bg-cyan-500/8', borderColor: 'border-cyan-500/20', textColor: 'text-cyan-400', icon: Phone },
  { id: 'qualified', label: 'Qualified', color: 'bg-purple-500', lightBg: 'bg-purple-500/8', borderColor: 'border-purple-500/20', textColor: 'text-purple-400', icon: CheckCircle2 },
  { id: 'site_visit_scheduled', label: 'Visit Scheduled', color: 'bg-orange-500', lightBg: 'bg-orange-500/8', borderColor: 'border-orange-500/20', textColor: 'text-orange-400', icon: Calendar },
  { id: 'site_visit_completed', label: 'Visit Done', color: 'bg-yellow-500', lightBg: 'bg-yellow-500/8', borderColor: 'border-yellow-500/20', textColor: 'text-yellow-400', icon: Eye },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-violet-500', lightBg: 'bg-violet-500/8', borderColor: 'border-violet-500/20', textColor: 'text-violet-400', icon: DollarSign },
  { id: 'offer_made', label: 'Offer Made', color: 'bg-pink-500', lightBg: 'bg-pink-500/8', borderColor: 'border-pink-500/20', textColor: 'text-pink-400', icon: Target },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-emerald-500', lightBg: 'bg-emerald-500/8', borderColor: 'border-emerald-500/20', textColor: 'text-emerald-400', icon: CheckCircle2 },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500', lightBg: 'bg-red-500/8', borderColor: 'border-red-500/20', textColor: 'text-red-400', icon: XCircle },
] as const

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getScoreConfig(score: number) {
  if (score >= 70) return { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', ringColor: '#f97316', label: 'Hot' }
  if (score >= 40) return { icon: Thermometer, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', ringColor: '#f59e0b', label: 'Warm' }
  return { icon: Snowflake, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', ringColor: '#64748b', label: 'Cold' }
}

function getDaysColor(days: number | null | undefined): string {
  if (!days || days <= 3) return 'text-emerald-400'
  if (days <= 7) return 'text-amber-400'
  return 'text-red-400'
}

// ─── Score Ring (SVG circular progress) ─────────────────────────────────────

function ScoreRing({ score, size = 38 }: { score: number; size?: number }) {
  const r = size * 0.39
  const cx = size / 2
  const circumference = 2 * Math.PI * r
  const dash = (Math.min(score, 100) / 100) * circumference
  const config = getScoreConfig(score)

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-800" />
        <motion.circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={config.ringColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('font-bold leading-none', config.color, size >= 44 ? 'text-sm' : 'text-[10px]')}>{score}</span>
      </div>
    </div>
  )
}

// ─── Lead Card ───────────────────────────────────────────────────────────────

function LeadCard({
  item,
  onSelect,
  isDragging,
}: {
  item: PipelineItem
  onSelect: () => void
  isDragging: boolean
}) {
  const [showActions, setShowActions] = useState(false)
  const name = item.lead?.user?.full_name || item.lead?.user?.email?.split('@')[0] || 'Unknown'
  const email = item.lead?.user?.email || ''
  const phone = item.lead?.user?.phone || ''
  const score = item.lead?.score || 0
  const hasDueFollowup =
    item.next_followup_date &&
    new Date(item.next_followup_date) <= new Date(Date.now() + 86400000)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{
        opacity: isDragging ? 0.35 : 1,
        y: 0,
        scale: isDragging ? 0.97 : 1,
        rotate: isDragging ? 1.5 : 0,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      onHoverStart={() => setShowActions(true)}
      onHoverEnd={() => setShowActions(false)}
      onClick={onSelect}
      className={cn(
        'group relative bg-zinc-900 border rounded-xl cursor-pointer overflow-hidden transition-all duration-150',
        isDragging
          ? 'border-amber-500/30 shadow-lg shadow-amber-500/5'
          : 'border-zinc-800/70 hover:border-zinc-700/80 hover:shadow-md hover:shadow-black/25'
      )}
    >
      {/* Followup urgency strip */}
      {hasDueFollowup && (
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
      )}

      <div className="p-3.5">
        {/* Top: Avatar + Info + Score Ring */}
        <div className="flex items-start gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0 ring-1 ring-zinc-700/50">
            {getInitials(name)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[12.5px] font-semibold text-zinc-100 truncate">{name}</h4>
            <p className="text-[11px] text-zinc-600 truncate">{email || phone}</p>
          </div>
          <ScoreRing score={score} size={34} />
        </div>

        {/* Category + Deal Value */}
        <div className="flex items-center gap-2 mb-2.5">
          {item.lead?.category && (
            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800/80 border border-zinc-700/50 rounded-md text-zinc-500 font-medium truncate max-w-[80px]">
              {item.lead.category}
            </span>
          )}
          {item.deal_value > 0 && (
            <span className="text-[11px] font-semibold text-amber-400 ml-auto tabular-nums">
              {formatINR(item.deal_value)}
            </span>
          )}
        </div>

        {/* Probability bar */}
        {item.probability > 0 && (
          <div className="mb-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-zinc-700">Close probability</span>
              <span className="text-[10px] text-zinc-600 font-medium tabular-nums">{item.probability}%</span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.probability}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                className={cn(
                  'h-full rounded-full',
                  item.probability >= 70
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                    : item.probability >= 40
                    ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                    : 'bg-zinc-600'
                )}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {item.days_in_stage != null && (
              <span className={cn('flex items-center gap-1 text-[10.5px] font-medium', getDaysColor(item.days_in_stage))}>
                <Clock className="w-3 h-3" />
                {item.days_in_stage}d
              </span>
            )}
            {item.last_activity_at && (
              <span className="text-[10.5px] text-zinc-700">{timeAgo(item.last_activity_at)}</span>
            )}
          </div>
          {hasDueFollowup && (
            <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
              <Bell className="w-3 h-3" />
              Due
            </span>
          )}
        </div>
      </div>

      {/* Hover quick-actions overlay */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-0 left-0 right-0 flex border-t border-zinc-800/60 bg-zinc-950/95 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {[
              { icon: Phone, label: 'Call', href: phone ? `tel:${phone}` : null },
              { icon: Mail, label: 'Email', href: email ? `mailto:${email}` : null },
              { icon: Calendar, label: 'Schedule', href: null },
            ].map((action) => (
              <button
                key={action.label}
                onClick={(e) => {
                  e.stopPropagation()
                  if (action.href) window.open(action.href)
                }}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors text-[10px]"
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Stage Column ─────────────────────────────────────────────────────────────

function StageColumn({
  stage,
  leads,
  onSelect,
  draggedId,
  dragOverStage,
  onDragOver,
  onDragLeave,
  onDrop,
  setDraggedId,
  setDragOverStage,
}: {
  stage: typeof STAGE_CONFIG[number]
  leads: PipelineItem[]
  onSelect: (item: PipelineItem) => void
  draggedId: string | null
  dragOverStage: string | null
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: () => void
  setDraggedId: (id: string | null) => void
  setDragOverStage: (id: string | null) => void
}) {
  const isDragTarget = dragOverStage === stage.id
  const isOverWipLimit = leads.length >= WIP_LIMIT
  const stageValue = leads.reduce((sum, l) => sum + (l.deal_value || 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'w-[272px] flex-shrink-0 flex flex-col rounded-2xl border transition-all duration-200 snap-start',
        isDragTarget
          ? 'border-amber-500/40 bg-amber-500/[0.04] shadow-[0_0_20px_-5px] shadow-amber-500/20 ring-1 ring-amber-500/20'
          : 'border-zinc-800/50 bg-zinc-900/15'
      )}
      onDragOver={(e) => { e.preventDefault(); onDragOver() }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column Header */}
      <div className="px-3.5 pt-3.5 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 mb-0.5">
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', stage.color)} />
          <span className="text-[12.5px] font-semibold text-zinc-200 truncate flex-1">{stage.label}</span>
          <span
            className={cn(
              'text-[10.5px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums min-w-[22px] text-center transition-colors flex-shrink-0',
              isOverWipLimit
                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                : 'bg-zinc-800/80 text-zinc-500'
            )}
          >
            {leads.length}
          </span>
          {isOverWipLimit && (
            <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" title={`WIP limit (${WIP_LIMIT}) exceeded`} />
          )}
        </div>
        {stageValue > 0 && (
          <p className="text-[10.5px] text-zinc-600 pl-4 tabular-nums">{formatINR(stageValue)}</p>
        )}
      </div>

      {/* Drop zone indicator */}
      {isDragTarget && (
        <div className="mx-3 mb-2 h-9 border-2 border-dashed border-amber-500/40 rounded-xl flex items-center justify-center">
          <span className="text-[11px] text-amber-500/70 font-medium">Drop here</span>
        </div>
      )}

      {/* Cards Container */}
      <div className="flex-1 px-2 pb-3 space-y-2 overflow-y-auto max-h-[calc(100vh-360px)] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {leads.length === 0 && !isDragTarget ? (
          <div className="flex flex-col items-center justify-center py-8 mx-1 rounded-xl border border-dashed border-zinc-800/40">
            <stage.icon className={cn('w-5 h-5 mb-2 opacity-20', stage.textColor)} />
            <span className="text-[11px] text-zinc-700">No leads</span>
          </div>
        ) : (
          leads.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggedId(item.id)}
              onDragEnd={() => { setDraggedId(null); setDragOverStage(null) }}
            >
              <LeadCard
                item={item}
                onSelect={() => onSelect(item)}
                isDragging={draggedId === item.id}
              />
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}

// ─── Analytics View ───────────────────────────────────────────────────────────

function AnalyticsView({
  stageGroups,
  totalPipelineValue,
  items,
}: {
  stageGroups: (typeof STAGE_CONFIG[number] & { leads: PipelineItem[] })[]
  totalPipelineValue: number
  items: PipelineItem[]
}) {
  const maxLeads = Math.max(...stageGroups.map((s) => s.leads.length), 1)
  const activeItems = items.filter((i) => i.deal_value > 0)
  const avgDeal = activeItems.length > 0 ? Math.round(totalPipelineValue / activeItems.length) : 0
  const winRate =
    stageGroups[0].leads.length > 0
      ? Math.round((stageGroups[7].leads.length / stageGroups[0].leads.length) * 100)
      : 0
  const avgDays =
    items.length > 0
      ? Math.round(items.reduce((s, i) => s + (i.days_in_stage || 0), 0) / items.length)
      : 0
  const activeStages = stageGroups.filter(
    (s) => s.leads.length > 0 && !['closed_won', 'closed_lost'].includes(s.id)
  ).length

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Win Rate', value: `${winRate}%`, color: 'text-emerald-400', bg: 'bg-emerald-500/6 border-emerald-500/12' },
          { label: 'Avg Deal Size', value: formatINR(avgDeal), color: 'text-amber-400', bg: 'bg-amber-500/6 border-amber-500/12' },
          { label: 'Avg Days/Stage', value: `${avgDays}d`, color: 'text-blue-400', bg: 'bg-blue-500/6 border-blue-500/12' },
          { label: 'Active Stages', value: String(activeStages), color: 'text-violet-400', bg: 'bg-violet-500/6 border-violet-500/12' },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn('border rounded-2xl px-4 py-3', metric.bg)}
          >
            <p className="text-[10.5px] text-zinc-600 uppercase tracking-wide mb-1">{metric.label}</p>
            <p className={cn('text-[20px] font-bold tabular-nums', metric.color)}>{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Funnel chart */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
        <h3 className="text-[13px] font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-zinc-500" />
          Pipeline Funnel
        </h3>
        <div className="space-y-2">
          {stageGroups.map((stage, i) => {
            const conversionRate =
              i === 0
                ? 100
                : stageGroups[0].leads.length > 0
                ? Math.round((stage.leads.length / stageGroups[0].leads.length) * 100)
                : 0
            const widthPct = (stage.leads.length / maxLeads) * 100

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3"
              >
                <div className="w-28 flex-shrink-0">
                  <span className="text-[11px] text-zinc-500 truncate block">{stage.label}</span>
                </div>
                <div className="flex-1 relative h-7 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800/40">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(widthPct, stage.leads.length > 0 ? 3 : 0)}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
                    className={cn('absolute left-0 top-0 bottom-0 rounded-lg opacity-60', stage.color)}
                  />
                  <div className="absolute inset-0 flex items-center px-3 justify-between">
                    <span className="text-[11px] font-semibold text-zinc-200 z-10 tabular-nums">
                      {stage.leads.length}
                    </span>
                    <span className="text-[10px] text-zinc-500 z-10 tabular-nums">
                      {formatINR(stage.leads.reduce((s, l) => s + (l.deal_value || 0), 0))}
                    </span>
                  </div>
                </div>
                <div className="w-10 text-right flex-shrink-0">
                  <span className="text-[11px] text-zinc-600 tabular-nums">{conversionRate}%</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── AI Insights Panel ────────────────────────────────────────────────────────

function AIInsightsPanel({ items, onClose }: { items: PipelineItem[]; onClose: () => void }) {
  const hotLeads = items.filter((i) => (i.lead?.score || 0) >= 70).slice(0, 5)
  const staleLeads = items.filter((i) => (i.days_in_stage || 0) > 10).slice(0, 3)
  const highValueLeads = items
    .filter((i) => i.deal_value > 0)
    .sort((a, b) => b.deal_value - a.deal_value)
    .slice(0, 3)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1998]"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-[310px] bg-zinc-950/98 border-l border-zinc-800/80 z-[1999] overflow-y-auto backdrop-blur-xl"
      >
        <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/50 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500/30 to-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-[13px] font-semibold text-zinc-100">AI Insights</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Hot Leads */}
          {hotLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[10.5px] font-semibold text-zinc-500 uppercase tracking-wider">Hot Leads</span>
              </div>
              <div className="space-y-2">
                {hotLeads.map((item) => {
                  const name =
                    item.lead?.user?.full_name ||
                    item.lead?.user?.email?.split('@')[0] ||
                    'Unknown'
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2.5 bg-orange-500/5 border border-orange-500/15 rounded-xl"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0">
                        {getInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-zinc-200 truncate">{name}</p>
                        <p className="text-[10.5px] text-zinc-600">
                          {STAGE_CONFIG.find((s) => s.id === item.stage)?.label}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-orange-400 tabular-nums">
                        {item.lead?.score}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stale Leads Alert */}
          {staleLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10.5px] font-semibold text-zinc-500 uppercase tracking-wider">Needs Attention</span>
              </div>
              <div className="space-y-2">
                {staleLeads.map((item) => {
                  const name =
                    item.lead?.user?.full_name ||
                    item.lead?.user?.email?.split('@')[0] ||
                    'Unknown'
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0">
                        {getInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-zinc-200 truncate">{name}</p>
                        <p className="text-[10.5px] text-zinc-600">{item.days_in_stage}d in stage</p>
                      </div>
                      <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top Value Leads */}
          {highValueLeads.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10.5px] font-semibold text-zinc-500 uppercase tracking-wider">Top Value</span>
              </div>
              <div className="space-y-2">
                {highValueLeads.map((item) => {
                  const name =
                    item.lead?.user?.full_name ||
                    item.lead?.user?.email?.split('@')[0] ||
                    'Unknown'
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0">
                        {getInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-zinc-200 truncate">{name}</p>
                        <p className="text-[10.5px] text-zinc-600">
                          {STAGE_CONFIG.find((s) => s.id === item.stage)?.label}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-amber-400 tabular-nums">
                        {formatINR(item.deal_value)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-[13px] text-zinc-600">No insights yet</p>
              <p className="text-[11px] text-zinc-700 mt-1">Add leads to get AI-powered suggestions</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ─── Lead Detail Drawer ────────────────────────────────────────────────────────

function LeadDetailDrawer({
  item,
  onClose,
  stageConfig,
}: {
  item: PipelineItem
  onClose: () => void
  stageConfig: typeof STAGE_CONFIG[number] | undefined
}) {
  const name = item.lead?.user?.full_name || item.lead?.user?.email || 'Lead Details'
  const email = item.lead?.user?.email || ''
  const phone = item.lead?.user?.phone || ''
  const score = item.lead?.score || 0
  const scoreConfig = getScoreConfig(score)
  const currentStageIdx = STAGE_CONFIG.findIndex((s) => s.id === item.stage)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000]"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-zinc-950 border-l border-zinc-800/80 z-[2001] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/60 px-5 py-4 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-200 ring-1 ring-zinc-700">
                {getInitials(name)}
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-zinc-100">{name}</h2>
                {stageConfig && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md mt-0.5',
                      stageConfig.lightBg,
                      stageConfig.textColor
                    )}
                  >
                    <div className={cn('w-1.5 h-1.5 rounded-full', stageConfig.color)} />
                    {stageConfig.label}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-800/70 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Score card */}
          <div
            className={cn(
              'flex items-center gap-4 p-4 rounded-2xl border',
              scoreConfig.bg,
              scoreConfig.border
            )}
          >
            <ScoreRing score={score} size={52} />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <scoreConfig.icon className={cn('w-4 h-4', scoreConfig.color)} />
                <span className={cn('text-[13px] font-bold', scoreConfig.color)}>
                  {scoreConfig.label} Lead
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                {item.lead?.category || 'General Inquiry'}
                {item.probability > 0 && ` · ${item.probability}% close probability`}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                icon: Phone,
                label: 'Call',
                color: 'text-blue-400',
                bg: 'bg-blue-500/8 hover:bg-blue-500/12 border-blue-500/15',
                href: phone ? `tel:${phone}` : null,
              },
              {
                icon: Mail,
                label: 'Email',
                color: 'text-amber-400',
                bg: 'bg-amber-500/8 hover:bg-amber-500/12 border-amber-500/15',
                href: email ? `mailto:${email}` : null,
              },
              {
                icon: MessageSquare,
                label: 'WhatsApp',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/8 hover:bg-emerald-500/12 border-emerald-500/15',
                href: phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : null,
              },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href || '#'}
                onClick={(e) => { if (!action.href) e.preventDefault() }}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors',
                  action.bg
                )}
              >
                <action.icon className={cn('w-4 h-4', action.color)} />
                <span className="text-[11px] font-medium text-zinc-300">{action.label}</span>
              </a>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[10.5px] font-semibold text-zinc-600 uppercase tracking-wider mb-2.5">Contact</h3>
            <div className="space-y-2">
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/60 border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-colors"
                >
                  <Mail className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <span className="text-[13px] text-zinc-300 truncate flex-1">{email}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0" />
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/60 border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-colors"
                >
                  <Phone className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <span className="text-[13px] text-zinc-300 flex-1">{phone}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0" />
                </a>
              )}
            </div>
          </div>

          {/* Pipeline Details */}
          <div>
            <h3 className="text-[10.5px] font-semibold text-zinc-600 uppercase tracking-wider mb-2.5">Pipeline Details</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: 'Deal Value',
                  value: item.deal_value > 0 ? formatINR(item.deal_value) : '—',
                  valueClass: 'text-amber-400',
                },
                {
                  label: 'Probability',
                  value: item.probability > 0 ? `${item.probability}%` : '—',
                  valueClass: '',
                },
                {
                  label: 'Days in Stage',
                  value: item.days_in_stage != null ? `${item.days_in_stage}d` : '—',
                  valueClass: getDaysColor(item.days_in_stage),
                },
                {
                  label: 'Last Activity',
                  value: item.last_activity_at ? timeAgo(item.last_activity_at) : '—',
                  valueClass: '',
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-3"
                >
                  <p className="text-[9.5px] text-zinc-700 uppercase tracking-wide mb-1">{metric.label}</p>
                  <p className={cn('text-[13px] font-semibold', metric.valueClass || 'text-zinc-200')}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Close */}
          {item.expected_close_date && (
            <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-zinc-500 flex-shrink-0" />
              <div>
                <p className="text-[9.5px] text-zinc-700 uppercase tracking-wide">Expected Close</p>
                <p className="text-[13px] font-semibold text-zinc-200 mt-0.5">
                  {new Date(item.expected_close_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
              <p className="text-[9.5px] text-zinc-700 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-[13px] text-zinc-300 leading-relaxed">{item.notes}</p>
            </div>
          )}

          {/* Loss Reason */}
          {item.loss_reason && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <p className="text-[9.5px] text-red-400 uppercase tracking-wide font-semibold">Loss Reason</p>
              </div>
              <p className="text-[13px] text-zinc-300">{item.loss_reason}</p>
            </div>
          )}

          {/* Stage Journey */}
          <div>
            <h3 className="text-[10.5px] font-semibold text-zinc-600 uppercase tracking-wider mb-3">Stage Journey</h3>
            <div className="relative pl-5">
              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-zinc-800" />
              {STAGE_CONFIG.map((s, i) => {
                const isCurrent = s.id === item.stage
                const isPast = currentStageIdx > i
                return (
                  <div key={s.id} className="flex items-center gap-3 py-1.5">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 z-10 -ml-[1px] flex-shrink-0 transition-all',
                        isCurrent
                          ? `${s.color} border-zinc-950 ring-2 ring-offset-1 ring-offset-zinc-950`
                          : isPast
                          ? 'bg-zinc-600 border-zinc-700'
                          : 'bg-zinc-900 border-zinc-800'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[12px]',
                        isCurrent
                          ? 'text-zinc-100 font-semibold'
                          : isPast
                          ? 'text-zinc-600'
                          : 'text-zinc-800'
                      )}
                    >
                      {s.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-zinc-600 ml-auto">← current</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LeadsPipelineSection({ onNavigate }: LeadsPipelineProps) {
  const { isAdmin } = useBuilderDataContext()
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PipelineItem | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [optimisticStages, setOptimisticStages] = useState<Record<string, string>>({})

  const sortMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const { data: pipelineResponse, isLoading, refetch } = useRealtimeData<{
    success: boolean
    data: PipelineItem[]
    total: number
    is_admin: boolean
    isEmpty: boolean
  }>('/api/leads/pipeline', { refreshInterval: 15000 })

  const rawItems: PipelineItem[] = pipelineResponse?.data || []

  // Apply optimistic stage overrides
  const pipelineItems = useMemo(
    () =>
      rawItems.map((item) =>
        optimisticStages[item.id] ? { ...item, stage: optimisticStages[item.id] } : item
      ),
    [rawItems, optimisticStages]
  )

  const totalLeads = pipelineResponse?.total || pipelineItems.length

  // Close sort menu on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false)
      }
    }
    if (showSortMenu) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showSortMenu])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'b' || e.key === 'B') setViewMode('kanban')
      if (e.key === 'l' || e.key === 'L') setViewMode('list')
      if (e.key === 'a' || e.key === 'A') setViewMode('analytics')
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'Escape') {
        setSelectedItem(null)
        setShowInsights(false)
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Sorting
  const sortedItems = useMemo(() => {
    const items = [...pipelineItems]
    switch (sortBy) {
      case 'newest': return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'oldest': return items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'value_high': return items.sort((a, b) => (b.deal_value || 0) - (a.deal_value || 0))
      case 'value_low': return items.sort((a, b) => (a.deal_value || 0) - (b.deal_value || 0))
      case 'score_high': return items.sort((a, b) => (b.lead?.score || 0) - (a.lead?.score || 0))
      default: return items
    }
  }, [pipelineItems, sortBy])

  // Group by stage with search filter
  const stageGroups = useMemo(
    () =>
      STAGE_CONFIG.map((config) => {
        let leads = sortedItems.filter((item) => item.stage === config.id)
        if (searchQuery) {
          const q = searchQuery.toLowerCase()
          leads = leads.filter((item) => {
            const name = item.lead?.user?.full_name || ''
            const email = item.lead?.user?.email || ''
            const phone = item.lead?.user?.phone || ''
            return (
              name.toLowerCase().includes(q) ||
              email.toLowerCase().includes(q) ||
              phone.includes(q)
            )
          })
        }
        return { ...config, leads }
      }),
    [sortedItems, searchQuery]
  )

  const allLeadsFlat = stageGroups.flatMap((g) => g.leads)

  // Stats
  const totalPipelineValue = pipelineItems.reduce((sum, p) => sum + (p.deal_value || 0), 0)
  const wonValue = pipelineItems
    .filter((p) => p.stage === 'closed_won')
    .reduce((sum, p) => sum + (p.deal_value || 0), 0)
  const hotLeadsCount = pipelineItems.filter((p) => (p.lead?.score || 0) >= 70).length
  const avgDays =
    pipelineItems.length > 0
      ? Math.round(
          pipelineItems.reduce((sum, p) => sum + (p.days_in_stage || 0), 0) / pipelineItems.length
        )
      : 0

  // Optimistic drag & drop
  const handleDrop = useCallback(
    async (targetStageId: string) => {
      if (!draggedId) return
      const item = pipelineItems.find((p) => p.id === draggedId)
      if (!item || item.stage === targetStageId) {
        setDraggedId(null)
        setDragOverStage(null)
        return
      }

      // Optimistic update
      setOptimisticStages((prev) => ({ ...prev, [draggedId]: targetStageId }))
      setDraggedId(null)
      setDragOverStage(null)

      try {
        const res = await fetch('/api/leads/update-stage', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pipeline_id: item.id, new_stage: targetStageId }),
        })
        if (!res.ok) throw new Error('Failed')
        setOptimisticStages((prev) => {
          const next = { ...prev }
          delete next[item.id]
          return next
        })
        refetch()
      } catch {
        // Rollback on error
        setOptimisticStages((prev) => {
          const next = { ...prev }
          delete next[item.id]
          return next
        })
      }
    },
    [draggedId, pipelineItems, refetch]
  )

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-44 bg-zinc-800/50 rounded-xl animate-pulse" />
            <div className="h-4 w-64 bg-zinc-800/30 rounded-lg animate-pulse" />
          </div>
          <div className="h-9 w-28 bg-zinc-800/40 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[72px] bg-zinc-900/50 border border-zinc-800/40 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-[272px] flex-shrink-0 bg-zinc-900/20 border border-zinc-800/30 rounded-2xl p-3 space-y-2.5"
            >
              <div className="h-4 w-24 bg-zinc-800/40 rounded-lg animate-pulse" />
              {[...Array(2)].map((_, j) => (
                <div key={j} className="h-[120px] bg-zinc-800/25 rounded-xl animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Leads & Pipeline</h1>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-400 font-semibold">
                <Shield className="w-3 h-3" /> All Builders
              </span>
            )}
          </div>
          <p className="text-[13px] text-zinc-500 mt-1">
            {totalLeads} leads{' '}
            <span className="text-zinc-700">·</span>{' '}
            {formatINR(totalPipelineValue)} pipeline
            {wonValue > 0 && (
              <span className="text-emerald-400"> · {formatINR(wonValue)} won</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Insights toggle */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowInsights(!showInsights)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12.5px] font-medium transition-all',
              showInsights
                ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Insights
          </motion.button>

          {/* View Toggle */}
          <div className="flex items-center bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-0.5">
            {(
              [
                { mode: 'kanban' as ViewMode, icon: LayoutGrid, label: 'Board', key: 'B' },
                { mode: 'list' as ViewMode, icon: List, label: 'List', key: 'L' },
                { mode: 'analytics' as ViewMode, icon: BarChart2, label: 'Stats', key: 'A' },
              ] as const
            ).map(({ mode, icon: Icon, label, key }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={`${label} (${key})`}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                  viewMode === mode
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-400'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-all"
            title="Refresh"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: String(totalLeads), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/6 border-blue-500/12' },
          { label: 'Hot Leads', value: String(hotLeadsCount), icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/6 border-orange-500/12' },
          { label: 'Pipeline Value', value: formatINR(totalPipelineValue), icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/6 border-amber-500/12' },
          { label: 'Avg Days/Stage', value: `${avgDays}d`, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/6 border-emerald-500/12' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
            className={cn('border rounded-2xl px-4 py-3', stat.bg)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-zinc-500 font-medium">{stat.label}</span>
              <stat.icon className={cn('w-3.5 h-3.5', stat.color)} />
            </div>
            <p className="text-[20px] font-bold text-zinc-100 tabular-nums">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Search & Sort ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads… (/)"
            className="w-full pl-9 pr-9 py-2 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-[13px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-zinc-800 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          )}
        </div>

        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-[12.5px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Sort
            <ChevronDown className={cn('w-3 h-3 transition-transform', showSortMenu && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {showSortMenu && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute right-0 top-full mt-1.5 w-44 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl shadow-black/40 overflow-hidden z-50"
              >
                {(
                  [
                    { id: 'newest', label: 'Newest first' },
                    { id: 'oldest', label: 'Oldest first' },
                    { id: 'value_high', label: 'Highest value' },
                    { id: 'value_low', label: 'Lowest value' },
                    { id: 'score_high', label: 'Highest score' },
                  ] as { id: SortBy; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setSortBy(opt.id); setShowSortMenu(false) }}
                    className={cn(
                      'w-full text-left px-3.5 py-2.5 text-[12.5px] transition-colors flex items-center justify-between',
                      sortBy === opt.id
                        ? 'bg-zinc-800 text-zinc-100 font-medium'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                    )}
                  >
                    {opt.label}
                    {sortBy === opt.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── View Content ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {viewMode === 'kanban' && (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
          >
            {stageGroups.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                leads={stage.leads}
                onSelect={setSelectedItem}
                draggedId={draggedId}
                dragOverStage={dragOverStage}
                onDragOver={() => setDragOverStage(stage.id)}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={() => handleDrop(stage.id)}
                setDraggedId={setDraggedId}
                setDragOverStage={setDragOverStage}
              />
            ))}
          </motion.div>
        )}

        {viewMode === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden"
          >
            <div className="grid grid-cols-[1fr_120px_110px_80px_56px_64px] gap-4 px-5 py-3 border-b border-zinc-800/40 bg-zinc-900/60">
              {['Lead', 'Stage', 'Value', 'Prob.', 'Score', 'Days'].map((h) => (
                <span key={h} className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                  {h}
                </span>
              ))}
            </div>
            <div className="divide-y divide-zinc-800/20">
              {allLeadsFlat.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <Users className="w-8 h-8 text-zinc-700" />
                  <p className="text-[13px] text-zinc-500">No leads found</p>
                </div>
              ) : (
                allLeadsFlat.map((item, idx) => {
                  const name =
                    item.lead?.user?.full_name ||
                    item.lead?.user?.email?.split('@')[0] ||
                    'Unknown'
                  const email = item.lead?.user?.email || ''
                  const score = item.lead?.score || 0
                  const stage = STAGE_CONFIG.find((s) => s.id === item.stage)
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => setSelectedItem(item)}
                      className="grid grid-cols-[1fr_120px_110px_80px_56px_64px] gap-4 px-5 py-3.5 hover:bg-zinc-800/20 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0 ring-1 ring-zinc-700/50">
                          {getInitials(name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-zinc-200 truncate">{name}</p>
                          <p className="text-[11px] text-zinc-600 truncate">{email}</p>
                        </div>
                      </div>
                      <div className="self-center">
                        {stage && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md',
                              stage.lightBg,
                              stage.textColor
                            )}
                          >
                            <div className={cn('w-1.5 h-1.5 rounded-full', stage.color)} />
                            {stage.label}
                          </span>
                        )}
                      </div>
                      <span className="text-[13px] text-amber-400 font-semibold self-center tabular-nums">
                        {item.deal_value > 0 ? formatINR(item.deal_value) : '—'}
                      </span>
                      <span className="text-[13px] text-zinc-400 self-center tabular-nums">
                        {item.probability > 0 ? `${item.probability}%` : '—'}
                      </span>
                      <div className="self-center">
                        <ScoreRing score={score} size={32} />
                      </div>
                      <span className={cn('text-[13px] self-center tabular-nums', getDaysColor(item.days_in_stage))}>
                        {item.days_in_stage != null ? `${item.days_in_stage}d` : '—'}
                      </span>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}

        {viewMode === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <AnalyticsView
              stageGroups={stageGroups}
              totalPipelineValue={totalPipelineValue}
              items={pipelineItems}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lead Detail Drawer ───────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedItem && (
          <LeadDetailDrawer
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            stageConfig={STAGE_CONFIG.find((s) => s.id === selectedItem.stage)}
          />
        )}
      </AnimatePresence>

      {/* ── AI Insights Panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showInsights && (
          <AIInsightsPanel
            items={pipelineItems}
            onClose={() => setShowInsights(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
