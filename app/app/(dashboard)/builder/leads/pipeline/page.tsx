"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, DragOverlay, closestCorners, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatDistanceToNow } from 'date-fns'
import { Inbox, Phone, Calendar as CalendarIcon, MessageSquare, CheckCircle, SlidersHorizontal } from 'lucide-react'
import { LeadCard, getScoreColor } from '..//_components/LeadCard'
import type { Lead as LeadType } from '../_components/LeadCard'
import { LeadsTable } from '../_components/LeadsTable'

type Lead = LeadType

async function fetchLeads() {
  const res = await fetch(`/api/builder/leads`, { next: { revalidate: 0 } as any })
  if (!res.ok) throw new Error('Failed to load leads')
  const j = await res.json()
  return (j.items || []) as Lead[]
}

async function patchLeadStatus(leadId: string, status: string) {
  const res = await fetch(`/api/builder/leads/${leadId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  if (!res.ok) throw new Error('Failed to update lead')
  return res.json()
}

const PIPELINE_STAGES = [
  { id: 'new', label: 'New Leads', color: 'bg-blue-500', icon: Inbox },
  { id: 'contacted', label: 'Contacted', color: 'bg-purple-500', icon: Phone },
  { id: 'site_visit', label: 'Site Visit', color: 'bg-amber-500', icon: CalendarIcon },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500', icon: MessageSquare },
  { id: 'closed_won', label: 'Closed', color: 'bg-emerald-500', icon: CheckCircle },
]

function ViewToggle({ view, onChange }: { view: 'board' | 'grid' | 'table'; onChange: (v: 'board' | 'grid' | 'table') => void }){
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden">
      <button onClick={() => onChange('board')} className={`px-3 py-2 text-sm ${view==='board' ? 'bg-gray-100 font-semibold' : ''}`}>Board</button>
      <button onClick={() => onChange('grid')} className={`px-3 py-2 text-sm ${view==='grid' ? 'bg-gray-100 font-semibold' : ''}`}>Grid</button>
      <button onClick={() => onChange('table')} className={`px-3 py-2 text-sm ${view==='table' ? 'bg-gray-100 font-semibold' : ''}`}>Table</button>
    </div>
  )
}

export default function PipelinePage() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [view, setView] = useState<'board' | 'grid' | 'table'>('board')
  const queryClient = useQueryClient()

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['pipeline-leads'],
    queryFn: fetchLeads,
  })

  const leadsByStage = useMemo(() => {
    const map: Record<string, Lead[]> = {}
    for (const s of PIPELINE_STAGES) map[s.id] = []
    for (const lead of leads) {
      const status = PIPELINE_STAGES.some(s => s.id === lead.status) ? lead.status : (lead.status === 'closed' ? 'closed_won' : 'new')
      map[status].push(lead)
    }
    return map
  }, [leads])

  const updateLeadStatus = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: string }) => patchLeadStatus(leadId, status),
    // optimistic update
    onMutate: async ({ leadId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['pipeline-leads'] })
      const previous = queryClient.getQueryData<Lead[]>(['pipeline-leads'])
      queryClient.setQueryData<Lead[]>(['pipeline-leads'], (old) => {
        if (!old) return old as any
        return old.map(l => (l.id === leadId ? { ...l, status } : l))
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['pipeline-leads'], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  const stageIds = PIPELINE_STAGES.map(s => s.id)

  function handleDragStart(event: any) {
    setActiveId(event.active?.id ?? null)
  }

  function handleDragEnd(event: any) {
    const { active, over } = event
    setActiveId(null)
    if (!active || !over) return

    const draggedId: string = active.id
    const overId: string = over.id

    // Determine target stage
    let newStatus: string | null = null
    if (stageIds.includes(overId)) {
      newStatus = overId
    } else {
      // dropped over another card — find the stage containing that card
      for (const s of PIPELINE_STAGES) {
        if (leadsByStage[s.id]?.some(l => l.id === overId)) {
          newStatus = s.id
          break
        }
      }
    }
    if (!newStatus) return

    const current = (leads as Lead[]).find(l => l.id === draggedId)
    if (!current || current.status === newStatus) return

    updateLeadStatus.mutate({ leadId: draggedId, status: newStatus })
  }

  if (isLoading) return <PipelineSkeleton />

  return (
    <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
            <p className="text-gray-600 mt-1">Drag & drop leads to update their status</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <SlidersHorizontal className="w-5 h-5 inline mr-2" />
              Filters
            </button>
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {/* Conversion Stats */}
        <div className="glass-card p-4 rounded-xl bg-white border border-gray-200">
          <div className="flex items-center justify-around text-center">
            {PIPELINE_STAGES.map((stage, index) => {
              const count = leadsByStage[stage.id]?.length || 0
              const prevCount = index > 0 ? (leadsByStage[PIPELINE_STAGES[index - 1].id]?.length || 0) : null
              const conversionRate = typeof prevCount === 'number' && prevCount > 0 ? Math.round((count / prevCount) * 100) : null
              const Icon = stage.icon as any
              return (
                <div key={stage.id}>
                  <div className={`w-12 h-12 ${stage.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600">{stage.label}</div>
                  {typeof conversionRate === 'number' && (
                    <div className="text-xs text-emerald-600 font-semibold mt-1">{conversionRate}% conversion</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        {view === 'board' ? (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {PIPELINE_STAGES.map(stage => (
              <PipelineColumn key={stage.id} stage={stage} leads={leadsByStage[stage.id] || []} />
            ))}
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(leads as Lead[]).map((lead) => (
              <LeadCard key={lead.id} lead={lead as any} />
            ))}
          </div>
        ) : (
          <LeadsTable leads={leads as any} />
        )}
      </div>

      <DragOverlay>{activeId ? <LeadCardDragging lead={(leads as Lead[]).find(l => l.id === activeId)!} /> : null}</DragOverlay>
    </DndContext>
  )
}

function PipelineColumn({ stage, leads }: { stage: { id: string; label: string; color: string; icon: any }; leads: Lead[] }) {
  const { setNodeRef } = useDroppable({ id: stage.id })
  return (
    <div className="flex-shrink-0 w-80 snap-start">
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 ${stage.color} rounded-full`} />
          <h3 className="font-bold text-gray-900">{stage.label}</h3>
          <span className="ml-auto px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">{leads.length}</span>
        </div>
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${stage.color} transition-all duration-300`} style={{ width: `${Math.min((leads.length / 10) * 100, 100)}%` }} />
        </div>
      </div>

      {/* Droppable Area */}
      <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} id={stage.id} className="min-h-[600px] bg-gray-50 rounded-xl p-3 space-y-3">
          {leads.map(lead => (
            <DraggableLeadCard key={lead.id} lead={lead} />
          ))}

          {leads.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No leads in this stage</div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

function DraggableLeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id })
  const style: any = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-move">
      {/* Score Badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="px-2 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: getScoreColor(lead.score) }}>
          {lead.score?.toFixed?.(1)}
        </div>
        <div className="text-xs text-gray-500">{formatDistanceToNow(new Date(lead.created_at))} ago</div>
      </div>

      {/* Lead Info */}
      <h4 className="font-semibold text-gray-900 mb-1">{lead.name}</h4>
      <div className="text-sm text-gray-600 mb-2 truncate">{lead.phone}</div>

      {/* Property */}
      <div className="text-xs text-gray-500 mb-3 truncate">
        Interested in: <span className="font-medium text-gray-700">{lead.property?.title || '-'}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="flex-1 py-1 px-2 text-xs bg-primary-50 text-primary-700 rounded hover:bg-primary-100 transition-colors">
          <Phone className="w-3 h-3 inline mr-1" />
          Call
        </a>
        <Link href={`/builder/leads/${lead.id}`} className="py-1 px-2 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors" onClick={(e) => e.stopPropagation()}>
          Details
        </Link>
      </div>
    </div>
  )
}

function LeadCardDragging({ lead }: { lead: Lead }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md opacity-80 w-80">
      <div className="flex items-start justify-between mb-3">
        <div className="px-2 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: getScoreColor(lead.score) }}>
          {lead.score?.toFixed?.(1)}
        </div>
        <div className="text-xs text-gray-400">Moving…</div>
      </div>
      <h4 className="font-semibold text-gray-900 mb-1 truncate">{lead.name}</h4>
      <div className="text-sm text-gray-600 truncate">{lead.phone}</div>
    </div>
  )
}

function PipelineSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
        <div className="h-10 w-56 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 min-h-[600px]">
            <div className="h-5 w-32 bg-gray-200 rounded mb-3" />
            <div className="space-y-3">
              {[1, 2, 3].map(j => (
                <div key={j} className="h-24 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
