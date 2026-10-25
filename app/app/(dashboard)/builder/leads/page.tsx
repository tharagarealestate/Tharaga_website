'use client'

import { useState } from 'react'
import { Users, Search, Filter, Plus, ArrowRight, LayoutKanban } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { BuilderPageWrapper } from '../_components/BuilderPageWrapper'

async function fetchLeads() {
  const res = await fetch('/api/builder/leads', { cache: 'no-store' })
  if (!res.ok) return []
  const j = await res.json()
  return (j.leads || j.items || []) as Array<{
    id: string
    name: string
    email?: string
    phone?: string
    score?: number
    status?: string
  }>
}

function EmptyLeadsState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
        <Users className="w-8 h-8 text-amber-400" />
      </div>
      <h3 className="text-xl font-bold text-zinc-100 mb-2">No leads found</h3>
      <p className="text-zinc-400 max-w-sm mb-8">
        Leads from your listings and campaigns will appear here. Share your property links to start capturing leads.
      </p>
      <Link
        href="/builder/properties"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20"
      >
        View Properties <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

export default function LeadsPage() {
  const [search, setSearch] = useState('')

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['builder-leads'],
    queryFn: fetchLeads,
  })

  const filtered = leads.filter(l =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <BuilderPageWrapper title="Leads" description="Manage and qualify your property leads">
      {/* Top Actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search leads…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/builder/leads/pipeline"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 text-sm font-medium transition-colors"
          >
            <LayoutKanban className="w-4 h-4" />
            Pipeline
          </Link>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-all">
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3" />
              <div className="h-3 bg-zinc-800 rounded w-1/2 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyLeadsState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(lead => (
            <Link
              key={lead.id}
              href={`/builder/leads/${lead.id}`}
              className="lead-card glass-card p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                  {lead.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                {lead.score !== undefined && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${lead.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : lead.score >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    {lead.score}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-zinc-100 mb-1 group-hover:text-amber-300 transition-colors">{lead.name}</h3>
              {lead.email && <p className="text-xs text-zinc-500 mb-1">{lead.email}</p>}
              {lead.phone && <p className="text-xs text-zinc-500">{lead.phone}</p>}
              {lead.status && (
                <span className="mt-3 inline-block text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 capitalize">{lead.status}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </BuilderPageWrapper>
  )
}
