"use client"

import { useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, LayoutGrid, List, GripVertical,
  Phone, Mail, Eye, Target, Clock, ArrowUpRight,
  CheckCircle2, XCircle, DollarSign, Calendar,
  Star, Shield, ChevronRight, X, ExternalLink,
  SlidersHorizontal, ArrowDownAZ, ArrowUpAZ,
  Flame, Thermometer, Snowflake, MoreHorizontal,
  Activity, TrendingUp, Zap, MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderDataContext, useRealtimeData, formatINR, timeAgo } from '../hooks/useBuilderData'

interface LeadsPipelineProps {
  onNavigate?: (section: string) => void
}

type ViewMode = 'kanban' | 'list'
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

const STAGE_CONFIG = [
  { id: 'new', label: 'New Leads', color: 'bg-blue-500', lightBg: 'bg-blue-500/8', borderColor: 'border-blue-500/20', textColor: 'text-blue-400', icon: Users, emoji: '' },
  { id: 'contacted', label: 'Contacted', color: 'bg-cyan-500', lightBg: 'bg-cyan-500/8', borderColor: 'border-cyan-500/20', textColor: 'text-cyan-400', icon: Phone, emoji: '' },
  { id: 'qualified', label: 'Qualified', color: 'bg-purple-500', lightBg: 'bg-purple-500/8', borderColor: 'border-purple-500/20', textColor: 'text-purple-400', icon: CheckCircle2, emoji: '' },
  { id: 'site_visit_scheduled', label: 'Visit Scheduled', color: 'bg-orange-500', lightBg: 'bg-orange-500/8', borderColor: 'border-orange-500/20', textColor: 'text-orange-400', icon: Calendar, emoji: '' },
  { id: 'site_visit_completed', label: 'Visit Done', color: 'bg-yellow-500', lightBg: 'bg-yellow-500/8', borderColor: 'border-yellow-500/20', textColor: 'text-yellow-400', icon: Eye, emoji: '' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-violet-500', lightBg: 'bg-violet-500/8', borderColor: 'border-violet-500/20', textColor: 'text-violet-400', icon: DollarSign, emoji: '' },
  { id: 'offer_made', label: 'Offer Made', color: 'bg-pink-500', lightBg: 'bg-pink-500/8', borderColor: 'border-pink-500/20', textColor: 'text-pink-400', icon: Target, emoji: '' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-emerald-500', lightBg: 'bg-emerald-500/8', borderColor: 'border-emerald-500/20', textColor: 'text-emerald-400', icon: CheckCircle2, emoji: '' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500', lightBg: 'bg-red-500/8', borderColor: 'border-red-500/20', textColor: 'text-red-400', icon: XCircle, emoji: '' },
]

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getScoreConfig(score: number) {
  if (score >= 70) return { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Hot' }
  if (score >= 40) return { icon: Thermometer, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Warm' }
  return { icon: Snowflake, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: 'Cold' }
}

function getDaysColor(days: number | null): string {
  if (!days || days <= 3) return 'text-emerald-400'
  if (days <= 7) return 'text-amber-400'
  return 'text-red-400'
}

// ─── Kanban Lead Card ─────────────────────────────────────────────────
function LeadCard({ item, onSelect, isDragging }: { item: PipelineItem; onSelect: () => void; isDragging: boolean }) {
  const name = item.lead?.user?.full_name || item.lead?.user?.email?.split('@')[0] || 'Unknown'
  const email = item.lead?.user?.email || ''
  const score = item.lead?.score || 0
  const scoreConfig = getScoreConfig(score)
  const ScoreIcon = scoreConfig.icon

  return (
    <motion.div
      layout
      layoutId={item.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onSelect}
      className={cn(
        'group relative bg-zinc-900/90 border border-zinc-800/70 rounded-xl p-3.5 cursor-pointer transition-all duration-200',
        'hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-lg hover:shadow-black/20',
        isDragging && 'opacity-40 scale-95 rotate-1'
      )}
    >
      {/* Drag handle (visible on hover) */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3.5 h-3.5 text-zinc-600" />
      </div>

      {/* Top: Avatar + Name + Score */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-300 flex-shrink-0 ring-1 ring-zinc-700/50">
          {getInitials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-zinc-100 truncate leading-tight">{name}</h4>
          <p className="text-[11px] text-zinc-500 truncate mt-0.5">{email}</p>
        </div>
        <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold', scoreConfig.bg, scoreConfig.border, 'border')}>
          <ScoreIcon className={cn('w-3 h-3', scoreConfig.color)} />
          <span className={scoreConfig.color}>{score}</span>
        </div>
      </div>

      {/* Deal Value & Probability */}
      {(item.deal_value > 0 || item.probability > 0) && (
        <div className="flex items-center gap-2 mb-3">
          {item.deal_value > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/8 border border-amber-500/15 rounded-lg text-[11px] font-semibold text-amber-400">
              <DollarSign className="w-3 h-3" />
              {formatINR(item.deal_value)}
            </span>
          )}
          {item.probability > 0 && (
            <span className="text-[11px] text-zinc-500">{item.probability}% likely</span>
          )}
        </div>
      )}

      {/* Probability Bar */}
      {item.probability > 0 && (
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${item.probability}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              item.probability >= 70 ? 'bg-emerald-500' : item.probability >= 40 ? 'bg-amber-500' : 'bg-zinc-600'
            )}
          />
        </div>
      )}

      {/* Footer: Days + Activity + Arrow */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {item.days_in_stage != null && (
            <span className={cn('flex items-center gap-1 text-[11px]', getDaysColor(item.days_in_stage))}>
              <Clock className="w-3 h-3" />
              {item.days_in_stage}d
            </span>
          )}
          {item.last_activity_at && (
            <span className="text-[11px] text-zinc-600">
              {timeAgo(item.last_activity_at)}
            </span>
          )}
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
      </div>

      {/* Followup indicator */}
      {item.next_followup_date && new Date(item.next_followup_date) <= new Date(Date.now() + 86400000) && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-zinc-950 animate-pulse" />
      )}
    </motion.div>
  )
}

// ─── Stage Column ──────────────────────────────────────────────────────
function StageColumn({ stage, leads, onSelect, draggedId, dragOverStage, onDragOver, onDragLeave, onDrop, setDraggedId, setDragOverStage }: {
  stage: typeof STAGE_CONFIG[0]
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
  const stageValue = leads.reduce((sum, l) => sum + (l.deal_value || 0), 0)
  const isDragTarget = dragOverStage === stage.id

  return (
    <div
      className={cn(
        'w-[300px] flex-shrink-0 flex flex-col rounded-xl transition-all duration-200 snap-start',
        isDragTarget
          ? 'bg-amber-500/5 ring-1 ring-amber-500/30'
          : 'bg-zinc-900/20'
      )}
      onDragOver={(e) => { e.preventDefault(); onDragOver() }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column Header */}
      <div className="px-3 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={cn('w-2.5 h-2.5 rounded-full', stage.color)} />
            <span className="text-[13px] font-semibold text-zinc-200">{stage.label}</span>
            <span className="text-[11px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded-full font-medium tabular-nums min-w-[24px] text-center">
              {leads.length}
            </span>
          </div>
          <button className="p-1 rounded-md hover:bg-zinc-800/80 transition-colors opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="w-3.5 h-3.5 text-zinc-600" />
          </button>
        </div>
        {stageValue > 0 && (
          <p className="text-[11px] text-zinc-600 ml-[18px]">{formatINR(stageValue)}</p>
        )}
      </div>

      {/* Cards Container */}
      <div className="flex-1 px-2 pb-2 space-y-2 min-h-[80px] max-h-[calc(100vh-340px)] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {leads.length === 0 ? (
          <div className={cn(
            'flex flex-col items-center justify-center py-10 rounded-xl border border-dashed transition-colors',
            isDragTarget ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-800/50'
          )}>
            <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center mb-2">
              <stage.icon className={cn('w-4 h-4', stage.textColor, 'opacity-40')} />
            </div>
            <span className="text-[11px] text-zinc-600">
              {isDragTarget ? 'Drop here' : 'No leads'}
            </span>
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
    </div>
  )
}

// ─── Lead Detail Drawer ────────────────────────────────────────────────
function LeadDetailDrawer({ item, onClose, stageConfig }: { item: PipelineItem; onClose: () => void; stageConfig: typeof STAGE_CONFIG[0] | undefined }) {
  const name = item.lead?.user?.full_name || item.lead?.user?.email || 'Lead Details'
  const email = item.lead?.user?.email || ''
  const phone = item.lead?.user?.phone || ''
  const score = item.lead?.score || 0
  const scoreConfig = getScoreConfig(score)
  const ScoreIcon = scoreConfig.icon

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[440px] bg-zinc-950 border-l border-zinc-800/80 z-[2001] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/60 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-200 ring-1 ring-zinc-700">
                {getInitials(name)}
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100">{name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {stageConfig && (
                    <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded', stageConfig.lightBg, stageConfig.textColor)}>
                      <div className={cn('w-1.5 h-1.5 rounded-full', stageConfig.color)} />
                      {stageConfig.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800/80 transition-colors">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Score Card */}
          <div className={cn('flex items-center gap-4 p-4 rounded-xl border', scoreConfig.bg, scoreConfig.border)}>
            <div className="w-14 h-14 rounded-xl bg-zinc-950/50 flex items-center justify-center">
              <span className={cn('text-2xl font-bold', scoreConfig.color)}>{score}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <ScoreIcon className={cn('w-4 h-4', scoreConfig.color)} />
                <span className={cn('text-sm font-semibold', scoreConfig.color)}>{scoreConfig.label} Lead</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {item.lead?.category || 'Uncategorized'} {item.probability > 0 ? `\u2022 ${item.probability}% close probability` : ''}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Phone, label: 'Call', color: 'text-blue-400', bg: 'bg-blue-500/8 hover:bg-blue-500/15 border-blue-500/15' },
              { icon: Mail, label: 'Email', color: 'text-amber-400', bg: 'bg-amber-500/8 hover:bg-amber-500/15 border-amber-500/15' },
              { icon: MessageSquare, label: 'WhatsApp', color: 'text-emerald-400', bg: 'bg-emerald-500/8 hover:bg-emerald-500/15 border-emerald-500/15' },
            ].map(action => (
              <button key={action.label} className={cn('flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors', action.bg)}>
                <action.icon className={cn('w-4.5 h-4.5', action.color)} />
                <span className="text-[11px] font-medium text-zinc-300">{action.label}</span>
              </button>
            ))}
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Contact</h3>
            <div className="space-y-2">
              {email && (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800/50">
                  <Mail className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <span className="text-sm text-zinc-300 truncate">{email}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-600 ml-auto flex-shrink-0" />
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800/50">
                  <Phone className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <span className="text-sm text-zinc-300">{phone}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-600 ml-auto flex-shrink-0" />
                </div>
              )}
            </div>
          </div>

          {/* Pipeline Metrics */}
          <div>
            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Pipeline Details</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Deal Value', value: item.deal_value > 0 ? formatINR(item.deal_value) : '\u2014', highlight: item.deal_value > 0, color: 'text-amber-400' },
                { label: 'Probability', value: item.probability > 0 ? `${item.probability}%` : '\u2014' },
                { label: 'Days in Stage', value: item.days_in_stage != null ? `${item.days_in_stage} days` : '\u2014', color: getDaysColor(item.days_in_stage) },
                { label: 'Last Activity', value: item.last_activity_at ? timeAgo(item.last_activity_at) : '\u2014' },
              ].map(metric => (
                <div key={metric.label} className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-3">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wide mb-1">{metric.label}</p>
                  <p className={cn('text-sm font-semibold', metric.color || 'text-zinc-200')}>{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Close Date */}
          {item.expected_close_date && (
            <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <p className="text-[10px] text-zinc-600 uppercase tracking-wide">Expected Close</p>
              </div>
              <p className="text-sm font-semibold text-zinc-200 ml-6">
                {new Date(item.expected_close_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{item.notes}</p>
            </div>
          )}

          {/* Loss Reason */}
          {item.loss_reason && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <p className="text-[10px] text-red-400 uppercase tracking-wide font-semibold">Loss Reason</p>
              </div>
              <p className="text-sm text-zinc-300">{item.loss_reason}</p>
            </div>
          )}

          {/* Stage Timeline */}
          <div>
            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Stage Timeline</h3>
            <div className="relative pl-4">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-800" />
              {STAGE_CONFIG.map((s, i) => {
                const isCurrent = s.id === item.stage
                const isPast = STAGE_CONFIG.findIndex(c => c.id === item.stage) > i
                return (
                  <div key={s.id} className="flex items-center gap-3 py-1.5 relative">
                    <div className={cn(
                      'w-3.5 h-3.5 rounded-full border-2 z-10 -ml-[3px]',
                      isCurrent ? `${s.color} border-zinc-950 ring-2 ring-offset-1 ring-offset-zinc-950 ring-${s.id === 'closed_won' ? 'emerald' : s.id === 'closed_lost' ? 'red' : 'zinc'}-500/30` :
                      isPast ? 'bg-zinc-600 border-zinc-700' :
                      'bg-zinc-900 border-zinc-800'
                    )} />
                    <span className={cn(
                      'text-xs',
                      isCurrent ? 'text-zinc-100 font-semibold' : isPast ? 'text-zinc-500' : 'text-zinc-700'
                    )}>
                      {s.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-zinc-600 ml-auto">Current</span>
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

// ─── Main Component ────────────────────────────────────────────────────
export function LeadsPipelineSection({ onNavigate }: LeadsPipelineProps) {
  const { isAdmin } = useBuilderDataContext()
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PipelineItem | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)

  const { data: pipelineResponse, isLoading, refetch } = useRealtimeData<{
    success: boolean
    data: PipelineItem[]
    total: number
    is_admin: boolean
    isEmpty: boolean
  }>('/api/leads/pipeline', { refreshInterval: 15000 })

  const pipelineItems = pipelineResponse?.data || []
  const totalLeads = pipelineResponse?.total || pipelineItems.length

  // Sort leads
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

  // Group by stage
  const stageGroups = STAGE_CONFIG.map(config => {
    let leads = sortedItems.filter(item => item.stage === config.id)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      leads = leads.filter(item => {
        const name = item.lead?.user?.full_name || ''
        const email = item.lead?.user?.email || ''
        const phone = item.lead?.user?.phone || ''
        return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || phone.includes(q)
      })
    }
    return { ...config, leads }
  })

  const allLeadsFlat = stageGroups.flatMap(g => g.leads)

  // Pipeline stats
  const totalPipelineValue = pipelineItems.reduce((sum, p) => sum + (p.deal_value || 0), 0)
  const wonValue = pipelineItems.filter(p => p.stage === 'closed_won').reduce((sum, p) => sum + (p.deal_value || 0), 0)
  const hotLeads = pipelineItems.filter(p => (p.lead?.score || 0) >= 70).length
  const avgDays = pipelineItems.length > 0
    ? Math.round(pipelineItems.reduce((sum, p) => sum + (p.days_in_stage || 0), 0) / pipelineItems.length)
    : 0

  // Drag & drop
  const handleDrop = useCallback(async (targetStageId: string) => {
    if (!draggedId) return
    const item = pipelineItems.find(p => p.id === draggedId)
    if (!item || item.stage === targetStageId) {
      setDraggedId(null)
      setDragOverStage(null)
      return
    }
    setDraggedId(null)
    setDragOverStage(null)

    try {
      const res = await fetch('/api/leads/update-stage', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_id: item.id, new_stage: targetStageId }),
      })
      refetch()
    } catch (err) {
      console.error('[Pipeline] Stage update error:', err)
      refetch()
    }
  }, [draggedId, pipelineItems, refetch])

  // ─── Loading State ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-48 bg-zinc-800/60 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-zinc-800/40 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-zinc-800/60 rounded-lg animate-pulse" />
        </div>
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-zinc-900/50 border border-zinc-800/40 rounded-xl animate-pulse" />
          ))}
        </div>
        {/* Skeleton columns */}
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-[300px] flex-shrink-0 rounded-xl bg-zinc-900/20 p-3 space-y-3">
              <div className="h-5 w-28 bg-zinc-800/40 rounded animate-pulse" />
              <div className="h-28 bg-zinc-800/30 rounded-xl animate-pulse" />
              <div className="h-28 bg-zinc-800/30 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Leads & Pipeline</h1>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-[10px] text-amber-400 font-semibold">
                <Shield className="w-3 h-3" /> All Builders
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            {totalLeads} leads \u00b7 Pipeline: {formatINR(totalPipelineValue)}
            {wonValue > 0 && <span className="text-emerald-400"> \u00b7 Won: {formatINR(wonValue)}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-zinc-900/80 border border-zinc-800/60 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                viewMode === 'kanban' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                viewMode === 'list' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/8', borderColor: 'border-blue-500/12' },
          { label: 'Hot Leads', value: hotLeads, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/8', borderColor: 'border-orange-500/12' },
          { label: 'Pipeline Value', value: formatINR(totalPipelineValue), icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/8', borderColor: 'border-amber-500/12' },
          { label: 'Avg Days/Stage', value: `${avgDays}d`, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/8', borderColor: 'border-emerald-500/12' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={cn('border rounded-xl px-4 py-3', stat.bg, stat.borderColor)}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-medium">{stat.label}</span>
              <stat.icon className={cn('w-4 h-4', stat.color)} />
            </div>
            <p className="text-xl font-bold text-zinc-100 mt-1 tabular-nums">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Search & Sort Bar ──────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/60 border border-zinc-800/60 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900/80 transition-all"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-zinc-800/60 rounded-lg text-xs text-zinc-400 hover:text-zinc-300 hover:border-zinc-700 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Sort
          </button>
          <AnimatePresence>
            {showSortMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl shadow-black/30 overflow-hidden z-50"
              >
                {([
                  { id: 'newest', label: 'Newest first' },
                  { id: 'oldest', label: 'Oldest first' },
                  { id: 'value_high', label: 'Highest value' },
                  { id: 'value_low', label: 'Lowest value' },
                  { id: 'score_high', label: 'Highest score' },
                ] as { id: SortBy; label: string }[]).map(option => (
                  <button
                    key={option.id}
                    onClick={() => { setSortBy(option.id); setShowSortMenu(false) }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs transition-colors',
                      sortBy === option.id ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-300'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Kanban Board ───────────────────────────────────────────── */}
      {viewMode === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
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
        </div>
      )}

      {/* ── List View ──────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_110px_110px_90px_70px_70px] gap-4 px-5 py-3 border-b border-zinc-800/40 bg-zinc-900/50">
            {['Lead', 'Stage', 'Deal Value', 'Probability', 'Score', 'Days'].map(h => (
              <span key={h} className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">{h}</span>
            ))}
          </div>
          {/* Table Body */}
          <div className="divide-y divide-zinc-800/20">
            {allLeadsFlat.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/40 flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-500 font-medium">No leads in pipeline</p>
                <p className="text-xs text-zinc-600 mt-1">Leads will appear here once added</p>
              </div>
            ) : (
              allLeadsFlat.map((item) => {
                const name = item.lead?.user?.full_name || item.lead?.user?.email?.split('@')[0] || 'Unknown'
                const email = item.lead?.user?.email || ''
                const score = item.lead?.score || 0
                const scoreConfig = getScoreConfig(score)
                const stageConfig = STAGE_CONFIG.find(s => s.id === item.stage)
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedItem(item)}
                    className="grid grid-cols-[1fr_110px_110px_90px_70px_70px] gap-4 px-5 py-3.5 hover:bg-zinc-800/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0 ring-1 ring-zinc-700/50">
                        {getInitials(name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{name}</p>
                        <p className="text-[11px] text-zinc-600 truncate">{email}</p>
                      </div>
                    </div>
                    <div className="self-center">
                      <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md', stageConfig?.lightBg, stageConfig?.textColor)}>
                        <div className={cn('w-1.5 h-1.5 rounded-full', stageConfig?.color)} />
                        {stageConfig?.label || item.stage}
                      </span>
                    </div>
                    <span className="text-sm text-amber-400 font-semibold self-center tabular-nums">
                      {item.deal_value > 0 ? formatINR(item.deal_value) : '\u2014'}
                    </span>
                    <span className="text-sm text-zinc-400 self-center tabular-nums">{item.probability > 0 ? `${item.probability}%` : '\u2014'}</span>
                    <div className="self-center">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md border',
                        scoreConfig.bg, scoreConfig.border, scoreConfig.color
                      )}>
                        {score}
                      </span>
                    </div>
                    <span className={cn('text-sm self-center tabular-nums', getDaysColor(item.days_in_stage))}>
                      {item.days_in_stage != null ? `${item.days_in_stage}d` : '\u2014'}
                    </span>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ── Lead Detail Drawer ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedItem && (
          <LeadDetailDrawer
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            stageConfig={STAGE_CONFIG.find(s => s.id === selectedItem.stage)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
