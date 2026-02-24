"use client"

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Filter, Plus, LayoutGrid, List,
  Phone, Mail, Eye, Target,
  CheckCircle2, XCircle, DollarSign,
  Star, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderDataContext, useRealtimeData, formatINR, timeAgo } from '../hooks/useBuilderData'

interface LeadsPipelineProps {
  onNavigate?: (section: string) => void
}

type ViewMode = 'kanban' | 'list'

// Real pipeline item from /api/leads/pipeline
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
  { id: 'new', label: 'New Leads', color: 'border-blue-500/30', dotColor: 'bg-blue-500', icon: Users },
  { id: 'contacted', label: 'Contacted', color: 'border-cyan-500/30', dotColor: 'bg-cyan-500', icon: Phone },
  { id: 'qualified', label: 'Qualified', color: 'border-purple-500/30', dotColor: 'bg-purple-500', icon: CheckCircle2 },
  { id: 'site_visit_scheduled', label: 'Visit Scheduled', color: 'border-orange-500/30', dotColor: 'bg-orange-500', icon: Eye },
  { id: 'site_visit_completed', label: 'Visit Done', color: 'border-yellow-500/30', dotColor: 'bg-yellow-500', icon: Eye },
  { id: 'negotiation', label: 'Negotiation', color: 'border-violet-500/30', dotColor: 'bg-violet-500', icon: DollarSign },
  { id: 'offer_made', label: 'Offer Made', color: 'border-pink-500/30', dotColor: 'bg-pink-500', icon: Target },
  { id: 'closed_won', label: 'Closed Won', color: 'border-emerald-500/30', dotColor: 'bg-emerald-500', icon: CheckCircle2 },
  { id: 'closed_lost', label: 'Closed Lost', color: 'border-red-500/30', dotColor: 'bg-red-500', icon: XCircle },
]

export function LeadsPipelineSection({ onNavigate }: LeadsPipelineProps) {
  const { isAdmin } = useBuilderDataContext()
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<PipelineItem | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)

  // Real pipeline data from Supabase (supports admin access)
  const { data: pipelineResponse, isLoading, refetch } = useRealtimeData<{
    success: boolean
    data: PipelineItem[]
    total: number
    is_admin: boolean
    isEmpty: boolean
  }>('/api/leads/pipeline', { refreshInterval: 15000 })

  const pipelineItems = pipelineResponse?.data || []
  const totalLeads = pipelineResponse?.total || pipelineItems.length

  // Group leads by stage
  const stageGroups = STAGE_CONFIG.map(config => {
    const leads = pipelineItems.filter(item => item.stage === config.id)
    return { ...config, leads }
  })

  // Search filter
  const filteredStageGroups = stageGroups.map(group => ({
    ...group,
    leads: searchQuery
      ? group.leads.filter(item => {
          const name = item.lead?.user?.full_name || ''
          const email = item.lead?.user?.email || ''
          const phone = item.lead?.user?.phone || ''
          const q = searchQuery.toLowerCase()
          return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || phone.includes(q)
        })
      : group.leads,
  }))

  const allLeadsFlat = filteredStageGroups.flatMap(g => g.leads)

  // Drag & drop with REAL API update
  const handleDrop = useCallback(async (targetStageId: string) => {
    if (!draggedId) return
    const item = pipelineItems.find(p => p.id === draggedId)
    if (!item || item.stage === targetStageId) {
      setDraggedId(null)
      setDragOverStage(null)
      return
    }

    // Optimistic update
    setDraggedId(null)
    setDragOverStage(null)

    try {
      const res = await fetch('/api/leads/update-stage', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline_id: item.id,
          new_stage: targetStageId,
        }),
      })
      if (res.ok) {
        refetch()
      } else {
        console.error('[Pipeline] Stage update failed')
        refetch()
      }
    } catch (err) {
      console.error('[Pipeline] Stage update error:', err)
      refetch()
    }
  }, [draggedId, pipelineItems, refetch])

  // Pipeline value stats
  const totalPipelineValue = pipelineItems.reduce((sum, p) => sum + (p.deal_value || 0), 0)
  const wonValue = pipelineItems.filter(p => p.stage === 'closed_won').reduce((sum, p) => sum + (p.deal_value || 0), 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-72 flex-shrink-0 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 animate-pulse">
              <div className="h-5 w-24 bg-zinc-800 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-20 bg-zinc-800 rounded" />
                <div className="h-20 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100">Leads & Pipeline</h1>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400 font-medium">
                <Shield className="w-3 h-3" /> All Builders
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            {totalLeads} leads — Pipeline value: {formatINR(totalPipelineValue)}
            {wonValue > 0 && <span className="text-emerald-400"> — Won: {formatINR(wonValue)}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                viewMode === 'kanban' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Kanban */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
          {filteredStageGroups.map((stage) => (
            <div
              key={stage.id}
              className={cn(
                'w-72 flex-shrink-0 bg-zinc-900/40 border rounded-xl snap-start transition-colors',
                dragOverStage === stage.id ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-800/60'
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id) }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className="px-4 py-3 border-b border-zinc-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', stage.dotColor)} />
                    <span className="text-sm font-medium text-zinc-200">{stage.label}</span>
                  </div>
                  <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full tabular-nums">
                    {stage.leads.length}
                  </span>
                </div>
              </div>
              <div className="p-2 space-y-2 min-h-[100px] max-h-[calc(100vh-320px)] overflow-y-auto">
                {stage.leads.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-600">No leads</div>
                ) : (
                  stage.leads.map((item) => {
                    const name = item.lead?.user?.full_name || item.lead?.user?.email || 'Unknown'
                    const score = item.lead?.score || 0
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        draggable
                        onDragStart={() => setDraggedId(item.id)}
                        onDragEnd={() => { setDraggedId(null); setDragOverStage(null) }}
                        onClick={() => setSelectedItem(item)}
                        className={cn(
                          'bg-zinc-900/80 border border-zinc-800/50 rounded-lg p-3 cursor-grab active:cursor-grabbing',
                          'hover:border-zinc-700/60 transition-all group',
                          draggedId === item.id && 'opacity-50'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-zinc-200 truncate flex-1">{name}</h4>
                          {score >= 70 && <Star className="w-3 h-3 text-amber-400 fill-amber-400 ml-1" />}
                        </div>
                        {item.deal_value > 0 && (
                          <p className="text-xs text-amber-400 font-medium mb-1">{formatINR(item.deal_value)}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-zinc-600">
                            {item.days_in_stage != null ? `${item.days_in_stage}d in stage` : ''}
                          </span>
                          <div className={cn(
                            'w-5 h-5 rounded flex items-center justify-center',
                            score >= 70 ? 'bg-emerald-500/15' : score >= 40 ? 'bg-amber-500/15' : 'bg-zinc-800'
                          )}>
                            <span className={cn(
                              'text-[9px] font-bold',
                              score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-zinc-500'
                            )}>
                              {score}
                            </span>
                          </div>
                        </div>
                        {item.probability > 0 && (
                          <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500/60 rounded-full"
                              style={{ width: `${item.probability}%` }}
                            />
                          </div>
                        )}
                      </motion.div>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_120px_100px_80px_80px] gap-4 px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/40">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Lead</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Stage</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Deal Value</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Probability</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Score</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Days</span>
          </div>
          <div className="divide-y divide-zinc-800/30">
            {allLeadsFlat.length === 0 ? (
              <div className="text-center py-12 text-sm text-zinc-600">No leads in pipeline</div>
            ) : (
              allLeadsFlat.map((item) => {
                const name = item.lead?.user?.full_name || item.lead?.user?.email || 'Unknown'
                const score = item.lead?.score || 0
                const stageConfig = STAGE_CONFIG.find(s => s.id === item.stage)
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="grid grid-cols-[1fr_100px_120px_100px_80px_80px] gap-4 px-4 py-3 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{name}</p>
                      <p className="text-xs text-zinc-500 truncate">{item.lead?.user?.email || ''}</p>
                    </div>
                    <div className="self-center">
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-zinc-800/50 text-zinc-300">
                        <div className={cn('w-1.5 h-1.5 rounded-full', stageConfig?.dotColor || 'bg-zinc-500')} />
                        {stageConfig?.label || item.stage}
                      </span>
                    </div>
                    <span className="text-xs text-amber-400 font-medium self-center">
                      {item.deal_value > 0 ? formatINR(item.deal_value) : '—'}
                    </span>
                    <span className="text-xs text-zinc-400 self-center">{item.probability > 0 ? `${item.probability}%` : '—'}</span>
                    <div className="self-center">
                      <span className={cn(
                        'text-xs font-semibold px-2 py-1 rounded',
                        score >= 70 ? 'bg-emerald-500/15 text-emerald-400' :
                        score >= 40 ? 'bg-amber-500/15 text-amber-400' :
                        'bg-zinc-800 text-zinc-500'
                      )}>{score}</span>
                    </div>
                    <span className="text-xs text-zinc-500 self-center tabular-nums">
                      {item.days_in_stage != null ? `${item.days_in_stage}d` : '—'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Lead Detail Drawer */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[2000]"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-[2001] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-zinc-100">
                    {selectedItem.lead?.user?.full_name || selectedItem.lead?.user?.email || 'Lead Details'}
                  </h2>
                  <button onClick={() => setSelectedItem(null)} className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                    <XCircle className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>

                {/* Score */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    (selectedItem.lead?.score || 0) >= 70 ? 'bg-emerald-500/15' : (selectedItem.lead?.score || 0) >= 40 ? 'bg-amber-500/15' : 'bg-zinc-800'
                  )}>
                    <span className={cn(
                      'text-lg font-bold',
                      (selectedItem.lead?.score || 0) >= 70 ? 'text-emerald-400' : (selectedItem.lead?.score || 0) >= 40 ? 'text-amber-400' : 'text-zinc-500'
                    )}>{selectedItem.lead?.score || 0}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Lead Score</p>
                    <p className="text-xs text-zinc-500">
                      {(selectedItem.lead?.score || 0) >= 70 ? 'Hot' : (selectedItem.lead?.score || 0) >= 40 ? 'Warm' : 'Cold'} — {selectedItem.lead?.category || 'Uncategorized'}
                    </p>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-3 mb-6">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contact</h3>
                  <div className="space-y-2">
                    {selectedItem.lead?.user?.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-300">{selectedItem.lead.user.email}</span>
                      </div>
                    )}
                    {selectedItem.lead?.user?.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-300">{selectedItem.lead.user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pipeline Details */}
                <div className="space-y-3 mb-6">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pipeline Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-[11px] text-zinc-500 mb-1">Stage</p>
                      <p className="text-sm text-zinc-300 capitalize">{selectedItem.stage.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-[11px] text-zinc-500 mb-1">Deal Value</p>
                      <p className="text-sm text-amber-400 font-medium">{selectedItem.deal_value > 0 ? formatINR(selectedItem.deal_value) : '—'}</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-[11px] text-zinc-500 mb-1">Probability</p>
                      <p className="text-sm text-zinc-300">{selectedItem.probability > 0 ? `${selectedItem.probability}%` : '—'}</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-[11px] text-zinc-500 mb-1">Days in Stage</p>
                      <p className="text-sm text-zinc-300">{selectedItem.days_in_stage ?? '—'}</p>
                    </div>
                    {selectedItem.expected_close_date && (
                      <div className="bg-zinc-900/50 rounded-lg p-3 col-span-2">
                        <p className="text-[11px] text-zinc-500 mb-1">Expected Close</p>
                        <p className="text-sm text-zinc-300">{new Date(selectedItem.expected_close_date).toLocaleDateString('en-IN')}</p>
                      </div>
                    )}
                    {selectedItem.notes && (
                      <div className="bg-zinc-900/50 rounded-lg p-3 col-span-2">
                        <p className="text-[11px] text-zinc-500 mb-1">Notes</p>
                        <p className="text-sm text-zinc-300">{selectedItem.notes}</p>
                      </div>
                    )}
                    {selectedItem.loss_reason && (
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 col-span-2">
                        <p className="text-[11px] text-red-400 mb-1">Loss Reason</p>
                        <p className="text-sm text-zinc-300">{selectedItem.loss_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/15 transition-colors">
                    <Phone className="w-4 h-4" /> Call
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/15 transition-colors">
                    <Mail className="w-4 h-4" /> Email
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/15 transition-colors">
                    <Eye className="w-4 h-4" /> Visit
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
