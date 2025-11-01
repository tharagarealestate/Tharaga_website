"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Download, Plus, Users } from 'lucide-react'
import { Select, Slider } from '@/components/ui'
import { LeadCard, LeadCardSkeleton } from './_components/LeadCard'
import { LeadsTable } from './_components/LeadsTable'

async function fetchLeads(filters: any) {
  const params = new URLSearchParams({
    status: filters.status,
    scoreMin: String(filters.scoreMin),
    scoreMax: String(filters.scoreMax),
    source: filters.source,
    dateRange: filters.dateRange,
  })
  const res = await fetch(`/api/builder/leads?${params.toString()}`, { next: { revalidate: 0 } as any })
  if (!res.ok) throw new Error('Failed to load leads')
  const j = await res.json()
  return j.items as any[]
}

function ViewToggle({ view, onChange }: { view: 'grid' | 'table'; onChange: (v: 'grid' | 'table') => void }){
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden">
      <button onClick={() => onChange('grid')} className={`px-3 py-2 text-sm ${view==='grid' ? 'bg-gray-100 font-semibold' : ''}`}>Grid</button>
      <button onClick={() => onChange('table')} className={`px-3 py-2 text-sm ${view==='table' ? 'bg-gray-100 font-semibold' : ''}`}>Table</button>
    </div>
  )
}

export default function BuilderLeadsPage() {
  const [filters, setFilters] = useState({
    status: 'all',
    scoreMin: 0,
    scoreMax: 10,
    source: 'all',
    dateRange: '30days'
  })
  const [view, setView] = useState<'grid' | 'table'>('grid')

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => fetchLeads(filters),
  })

  const count = leads?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Manage and track all inquiries</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          <Link href="/builder/leads/pipeline" className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Pipeline
          </Link>
          <button className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm inline-flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-xl bg-white border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
            <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="site_visit">Site Visit</option>
              <option value="negotiation">Negotiation</option>
              <option value="closed_won">Closed Won</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Lead Score</label>
            <Slider
              value={[filters.scoreMin, filters.scoreMax]}
              onValueChange={([min, max]) => setFilters({ ...filters, scoreMin: min, scoreMax: max })}
              min={0}
              max={10}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{filters.scoreMin}</span>
              <span>{filters.scoreMax}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Source</label>
            <Select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}>
              <option value="all">All Sources</option>
              <option value="organic">Organic Search</option>
              <option value="google_ads">Google Ads</option>
              <option value="referral">Referral</option>
              <option value="direct">Direct</option>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Date Range</label>
            <Select value={filters.dateRange} onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="all">All Time</option>
            </Select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: 'all', scoreMin: 0, scoreMax: 10, source: 'all', dateRange: '30days' })}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Count + Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{count}</span> leads
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            Mark as Contacted
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            Assign to Team
          </button>
        </div>
      </div>

      {/* Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <LeadCardSkeleton key={i} />)}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads?.map((lead: any) => <LeadCard key={lead.id} lead={lead} />)}
        </div>
      ) : (
        <LeadsTable leads={leads as any} />
      )}

      {/* Empty State */}
      {!isLoading && count === 0 && (
        <div className="glass-card p-12 rounded-2xl text-center bg-white border border-gray-200">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No leads found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your filters or list more properties to attract leads</p>
          <Link href="/builder/properties/add" className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-primary-950 rounded-lg font-semibold">
            <Plus className="w-5 h-5" />
            List Your First Property
          </Link>
        </div>
      )}
    </div>
  )
}
