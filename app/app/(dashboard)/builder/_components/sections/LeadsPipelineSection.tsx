"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Filter, Plus, LayoutGrid, List,
  ArrowUpRight, Phone, Mail, Eye, Clock, Target,
  CheckCircle2, XCircle, DollarSign, ChevronDown,
  MoreHorizontal, GripVertical, Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadsPipelineProps {
  onNavigate?: (section: string) => void
}

type ViewMode = 'kanban' | 'list'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  source: string
  budget: string
  stage: string
  score: number
  lastContact: string
  propertyInterest: string
  created: string
}

interface PipelineStage {
  id: string
  label: string
  color: string
  dotColor: string
  leads: Lead[]
}

const STAGE_CONFIG: { id: string; label: string; color: string; dotColor: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'new', label: 'New Leads', color: 'border-blue-500/30', dotColor: 'bg-blue-500', icon: Users },
  { id: 'contacted', label: 'Contacted', color: 'border-cyan-500/30', dotColor: 'bg-cyan-500', icon: Phone },
  { id: 'qualified', label: 'Qualified', color: 'border-purple-500/30', dotColor: 'bg-purple-500', icon: CheckCircle2 },
  { id: 'site_visit', label: 'Site Visit', color: 'border-orange-500/30', dotColor: 'bg-orange-500', icon: Eye },
  { id: 'negotiation', label: 'Negotiation', color: 'border-violet-500/30', dotColor: 'bg-violet-500', icon: DollarSign },
  { id: 'closed_won', label: 'Closed Won', color: 'border-emerald-500/30', dotColor: 'bg-emerald-500', icon: Target },
  { id: 'closed_lost', label: 'Closed Lost', color: 'border-red-500/30', dotColor: 'bg-red-500', icon: XCircle },
]

export function LeadsPipelineSection({ onNavigate }: LeadsPipelineProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [draggedLead, setDraggedLead] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)

  // Fetch leads and organize into pipeline stages
  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch('/api/builder/leads?limit=100', {
          credentials: 'include',
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          const leads = data?.data?.leads || data?.data || []

          // Map leads to pipeline stages
          const stageMap: Record<string, Lead[]> = {}
          STAGE_CONFIG.forEach(s => { stageMap[s.id] = [] })

          leads.forEach((lead: any) => {
            const stageName = (lead.pipeline_stage || lead.status || 'new').toLowerCase().replace(/ /g, '_')
            const mapped: Lead = {
              id: lead.id || lead.lead_id || String(Math.random()),
              name: lead.name || lead.full_name || 'Unknown',
              email: lead.email || '',
              phone: lead.phone || lead.phone_number || '',
              source: lead.source || lead.lead_source || 'Website',
              budget: lead.budget || lead.budget_range || 'Not specified',
              stage: stageName,
              score: lead.score || lead.lead_score || Math.floor(Math.random() * 100),
              lastContact: lead.last_contact || lead.updated_at || new Date().toISOString(),
              propertyInterest: lead.property_interest || lead.interested_property || 'General',
              created: lead.created_at || new Date().toISOString(),
            }

            // Find matching stage or default to 'new'
            const matchingStage = STAGE_CONFIG.find(s =>
              s.id === stageName ||
              s.label.toLowerCase().replace(/ /g, '_') === stageName
            )
            const stageId = matchingStage ? matchingStage.id : 'new'
            if (stageMap[stageId]) {
              stageMap[stageId].push(mapped)
            }
          })

          setStages(STAGE_CONFIG.map(config => ({
            id: config.id,
            label: config.label,
            color: config.color,
            dotColor: config.dotColor,
            leads: stageMap[config.id] || [],
          })))
        }
      } catch (error) {
        console.error('[Leads] Failed to fetch:', error)
        // Set empty stages
        setStages(STAGE_CONFIG.map(config => ({
          id: config.id,
          label: config.label,
          color: config.color,
          dotColor: config.dotColor,
          leads: [],
        })))
      } finally {
        setIsLoading(false)
      }
    }
    fetchLeads()
  }, [])

  // Drag and drop handlers
  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setDragOverStage(stageId)
  }

  const handleDrop = async (targetStageId: string) => {
    if (!draggedLead) return

    // Find the lead and move it
    const updatedStages = stages.map(stage => {
      const leadIndex = stage.leads.findIndex(l => l.id === draggedLead)
      if (leadIndex !== -1) {
        const lead = stage.leads[leadIndex]
        const newLeads = [...stage.leads]
        newLeads.splice(leadIndex, 1)
        return { ...stage, leads: newLeads }
      }
      return stage
    })

    // Find the lead object
    let movedLead: Lead | null = null
    stages.forEach(stage => {
      const found = stage.leads.find(l => l.id === draggedLead)
      if (found) movedLead = { ...found, stage: targetStageId }
    })

    if (movedLead) {
      const finalStages = updatedStages.map(stage => {
        if (stage.id === targetStageId) {
          return { ...stage, leads: [...stage.leads, movedLead!] }
        }
        return stage
      })
      setStages(finalStages)

      // Update pipeline stage via API
      try {
        await fetch(`/api/leads/${draggedLead}/pipeline-stage`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: targetStageId }),
        })
      } catch (error) {
        console.error('[Pipeline] Failed to update stage:', error)
      }
    }

    setDraggedLead(null)
    setDragOverStage(null)
  }

  const totalLeads = stages.reduce((sum, s) => sum + s.leads.length, 0)

  // Filter leads by search
  const filteredStages = stages.map(stage => ({
    ...stage,
    leads: searchQuery
      ? stage.leads.filter(l =>
          l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.phone.includes(searchQuery)
        )
      : stage.leads,
  }))

  // All leads flat for list view
  const allLeads = filteredStages.flatMap(s => s.leads)

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
          <h1 className="text-2xl font-bold text-zinc-100">Leads & Pipeline</h1>
          <p className="text-sm text-zinc-500 mt-1">{totalLeads} leads across {stages.length} stages</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                viewMode === 'kanban' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-semibold transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Search & Filter bar */}
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
        <button className="flex items-center gap-1.5 px-3 py-2 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors">
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
          {filteredStages.map((stage) => {
            const config = STAGE_CONFIG.find(s => s.id === stage.id)
            return (
              <div
                key={stage.id}
                className={cn(
                  'w-72 flex-shrink-0 bg-zinc-900/40 border rounded-xl snap-start transition-colors',
                  dragOverStage === stage.id ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-800/60'
                )}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Stage header */}
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

                {/* Lead cards */}
                <div className="p-2 space-y-2 min-h-[100px] max-h-[calc(100vh-320px)] overflow-y-auto">
                  {stage.leads.length === 0 ? (
                    <div className="text-center py-8 text-xs text-zinc-600">
                      No leads in this stage
                    </div>
                  ) : (
                    stage.leads.map((lead) => (
                      <motion.div
                        key={lead.id}
                        layout
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        onDragEnd={() => { setDraggedLead(null); setDragOverStage(null) }}
                        onClick={() => setSelectedLead(lead)}
                        className={cn(
                          'bg-zinc-900/80 border border-zinc-800/50 rounded-lg p-3 cursor-grab active:cursor-grabbing',
                          'hover:border-zinc-700/60 transition-all group',
                          draggedLead === lead.id && 'opacity-50'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-zinc-200 truncate flex-1">{lead.name}</h4>
                          <div className="flex items-center gap-1 ml-2">
                            {lead.score >= 70 && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          </div>
                        </div>
                        <p className="text-xs text-zinc-500 truncate mb-2">{lead.propertyInterest}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-zinc-600">{lead.source}</span>
                          <div className="flex items-center gap-1">
                            <div className={cn(
                              'w-5 h-5 rounded flex items-center justify-center',
                              lead.score >= 70 ? 'bg-emerald-500/15' : lead.score >= 40 ? 'bg-amber-500/15' : 'bg-zinc-800'
                            )}>
                              <span className={cn(
                                'text-[9px] font-bold',
                                lead.score >= 70 ? 'text-emerald-400' : lead.score >= 40 ? 'text-amber-400' : 'text-zinc-500'
                              )}>
                                {lead.score}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_120px_100px_80px_80px] gap-4 px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/40">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Source</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Stage</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Budget</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Score</span>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</span>
          </div>
          {/* Table rows */}
          <div className="divide-y divide-zinc-800/30">
            {allLeads.length === 0 ? (
              <div className="text-center py-12 text-sm text-zinc-600">No leads found</div>
            ) : (
              allLeads.map((lead) => {
                const stageConfig = STAGE_CONFIG.find(s => s.id === lead.stage)
                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="grid grid-cols-[1fr_120px_120px_100px_80px_80px] gap-4 px-4 py-3 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{lead.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{lead.email}</p>
                    </div>
                    <span className="text-xs text-zinc-400 self-center">{lead.source}</span>
                    <div className="self-center">
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-zinc-800/50 text-zinc-300">
                        <div className={cn('w-1.5 h-1.5 rounded-full', stageConfig?.dotColor || 'bg-zinc-500')} />
                        {stageConfig?.label || lead.stage}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 self-center">{lead.budget}</span>
                    <div className="self-center">
                      <span className={cn(
                        'text-xs font-semibold px-2 py-1 rounded',
                        lead.score >= 70 ? 'bg-emerald-500/15 text-emerald-400' :
                        lead.score >= 40 ? 'bg-amber-500/15 text-amber-400' :
                        'bg-zinc-800 text-zinc-500'
                      )}>
                        {lead.score}
                      </span>
                    </div>
                    <div className="self-center flex items-center gap-1">
                      <button className="p-1 rounded hover:bg-zinc-700/50 transition-colors" title="Call">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      </button>
                      <button className="p-1 rounded hover:bg-zinc-700/50 transition-colors" title="Email">
                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Lead Detail Drawer */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[2000]"
              onClick={() => setSelectedLead(null)}
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
                  <h2 className="text-lg font-bold text-zinc-100">{selectedLead.name}</h2>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>

                {/* Lead score */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    selectedLead.score >= 70 ? 'bg-emerald-500/15' : selectedLead.score >= 40 ? 'bg-amber-500/15' : 'bg-zinc-800'
                  )}>
                    <span className={cn(
                      'text-lg font-bold',
                      selectedLead.score >= 70 ? 'text-emerald-400' : selectedLead.score >= 40 ? 'text-amber-400' : 'text-zinc-500'
                    )}>
                      {selectedLead.score}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Lead Score</p>
                    <p className="text-xs text-zinc-500">
                      {selectedLead.score >= 70 ? 'Hot Lead' : selectedLead.score >= 40 ? 'Warm Lead' : 'Cold Lead'}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contact Information</h3>
                  <div className="space-y-2">
                    {selectedLead.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-300">{selectedLead.email}</span>
                      </div>
                    )}
                    {selectedLead.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-300">{selectedLead.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-6">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-[11px] text-zinc-500 mb-1">Source</p>
                      <p className="text-sm text-zinc-300">{selectedLead.source}</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-[11px] text-zinc-500 mb-1">Budget</p>
                      <p className="text-sm text-zinc-300">{selectedLead.budget}</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-[11px] text-zinc-500 mb-1">Interest</p>
                      <p className="text-sm text-zinc-300">{selectedLead.propertyInterest}</p>
                    </div>
                    <div className="bg-zinc-900/50 rounded-lg p-3">
                      <p className="text-[11px] text-zinc-500 mb-1">Stage</p>
                      <p className="text-sm text-zinc-300 capitalize">{selectedLead.stage.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/15 transition-colors">
                    <Phone className="w-4 h-4" />
                    Call
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/15 transition-colors">
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/15 transition-colors">
                    <Eye className="w-4 h-4" />
                    Schedule Visit
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
