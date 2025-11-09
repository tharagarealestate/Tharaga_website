"use client"

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Download, Plus, Users, Search, Filter, ChevronLeft, ChevronRight, Layers } from 'lucide-react'
import { Select, Slider } from '@/components/ui'
import { LeadCard, LeadCardSkeleton, Lead } from './_components/LeadCard'
import { LeadsTable } from './_components/LeadsTable'
import { ExportModal } from './_components/ExportModal'
import { BulkOperationsModal } from './_components/BulkOperationsModal'

interface LeadFilters {
  page: number
  limit: number
  score_min?: number
  score_max?: number
  category?: string
  budget_min?: number
  budget_max?: number
  location?: string
  property_type?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  created_after?: string
  created_before?: string
  last_active_after?: string
  last_active_before?: string
  has_interactions?: boolean
  no_response?: boolean
}

async function fetchLeads(filters: LeadFilters) {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  })
  
  const res = await fetch(`/api/leads?${params.toString()}`, { 
    next: { revalidate: 0 } as any 
  })
  if (!res.ok) throw new Error('Failed to load leads')
  const j = await res.json()
  return j.data as {
    leads: any[]
    pagination: {
      page: number
      limit: number
      total: number
      total_pages: number
      has_next: boolean
      has_prev: boolean
    }
    stats: {
      total_leads: number
      hot_leads: number
      warm_leads: number
      developing_leads: number
      cold_leads: number
      average_score: number
      pending_interactions: number
      no_response_leads: number
    }
  }
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
  const [filters, setFilters] = useState<LeadFilters>({
    page: 1,
    limit: 20,
    score_min: undefined,
    score_max: undefined,
    category: undefined,
    search: undefined,
    sort_by: 'score',
    sort_order: 'desc',
  })
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showBulkOperations, setShowBulkOperations] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => fetchLeads(filters),
  })

  const leads = leadsData?.leads || []
  const pagination = leadsData?.pagination
  const stats = leadsData?.stats
  const count = leads.length

  // Trigger sidebar refresh when leads data changes
  useEffect(() => {
    if (leadsData && !isLoading) {
      // Dispatch custom event to refresh sidebar count
      window.dispatchEvent(new CustomEvent('leadCountRefresh'))
    }
  }, [leadsData, isLoading])

  // Get selected leads objects
  const selectedLeads = useMemo(() => {
    return leads.filter(lead => selectedLeadIds.includes(lead.id))
  }, [leads, selectedLeadIds])

  // Handle bulk operation success
  function handleBulkOperationSuccess() {
    // Refresh leads data
    window.location.reload() // Simple refresh for now, could use query invalidation
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Leads Management</h1>
          <p className="text-sm text-fgMuted">AI-powered lead scoring, filtering, and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedLeadIds.length > 0 && (
            <button
              onClick={() => setShowBulkOperations(true)}
              className="px-4 py-2 bg-[#6e0d25] hover:bg-[#8c1630] text-white rounded text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Layers className="w-4 h-4" />
              Bulk Operations ({selectedLeadIds.length})
            </button>
          )}
          <ViewToggle view={view} onChange={setView} />
          <Link href="/builder/leads/pipeline" className="px-3 py-2 border border-border rounded text-sm hover:bg-muted/40 transition-colors">
            Pipeline
          </Link>
          <button 
            onClick={() => setShowExportModal(true)}
            className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm inline-flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="overflow-auto border border-border rounded">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left p-3">Metric</th>
                <th className="text-left p-3">Total</th>
                <th className="text-left p-3">Hot</th>
                <th className="text-left p-3">Warm</th>
                <th className="text-left p-3">Developing</th>
                <th className="text-left p-3">Cold</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Leads</td>
                <td className="p-3">{stats.total_leads}</td>
                <td className="p-3">{stats.hot_leads}</td>
                <td className="p-3">{stats.warm_leads}</td>
                <td className="p-3">{stats.developing_leads}</td>
                <td className="p-3">{stats.cold_leads}</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Average Score</td>
                <td className="p-3">{stats.average_score.toFixed(1)}</td>
                <td className="p-3">—</td>
                <td className="p-3">—</td>
                <td className="p-3">—</td>
                <td className="p-3">—</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3 font-medium">Pending Interactions</td>
                <td className="p-3">{stats.pending_interactions}</td>
                <td className="p-3">—</td>
                <td className="p-3">—</td>
                <td className="p-3">—</td>
                <td className="p-3">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Filters */}
      <div className="border border-border rounded p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </h2>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-xs text-fgMuted hover:text-foreground"
          >
            {showAdvancedFilters ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined, page: 1 })}
                className="w-full pl-10 pr-3 py-2 border border-border rounded text-sm"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
            <Select 
              value={filters.category || 'all'} 
              onChange={(e) => setFilters({ ...filters, category: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
            >
              <option value="all">All Categories</option>
              <option value="Hot Lead">Hot Lead</option>
              <option value="Warm Lead">Warm Lead</option>
              <option value="Developing Lead">Developing Lead</option>
              <option value="Cold Lead">Cold Lead</option>
              <option value="Low Quality">Low Quality</option>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Sort By</label>
            <Select 
              value={filters.sort_by || 'score'} 
              onChange={(e) => setFilters({ ...filters, sort_by: e.target.value, page: 1 })}
            >
              <option value="score">Score</option>
              <option value="created_at">Date Created</option>
              <option value="last_activity">Last Activity</option>
              <option value="budget">Budget</option>
            </Select>
          </div>

          {/* Score Range */}
          {showAdvancedFilters && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Score Range</label>
                <Slider
                  value={[filters.score_min || 0, filters.score_max || 10]}
                  onValueChange={([min, max]) => setFilters({ ...filters, score_min: min, score_max: max, page: 1 })}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{filters.score_min || 0}</span>
                  <span>{filters.score_max || 10}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={filters.location || ''}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value || undefined, page: 1 })}
                  className="w-full px-3 py-2 border border-border rounded text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Property Type</label>
                <input
                  type="text"
                  placeholder="Filter by property type..."
                  value={filters.property_type || ''}
                  onChange={(e) => setFilters({ ...filters, property_type: e.target.value || undefined, page: 1 })}
                  className="w-full px-3 py-2 border border-border rounded text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Interaction Status</label>
                <Select 
                  value={filters.has_interactions === true ? 'has' : filters.no_response === true ? 'no' : 'all'} 
                  onChange={(e) => {
                    const val = e.target.value
                    setFilters({ 
                      ...filters, 
                      has_interactions: val === 'has' ? true : undefined,
                      no_response: val === 'no' ? true : undefined,
                      page: 1 
                    })
                  }}
                >
                  <option value="all">All</option>
                  <option value="has">Has Interactions</option>
                  <option value="no">No Response</option>
                </Select>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({ page: 1, limit: 20, sort_by: 'score', sort_order: 'desc' })}
            className="px-4 py-2 border border-border rounded hover:bg-muted/40 transition-colors text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Count + Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-fgMuted">
          Showing <span className="font-semibold text-foreground">{count}</span> of <span className="font-semibold text-foreground">{pagination?.total || 0}</span> leads
        </div>
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
              disabled={!pagination.has_prev}
              className="p-2 border border-border rounded hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-fgMuted">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => setFilters({ ...filters, page: Math.min(pagination.total_pages, filters.page + 1) })}
              disabled={!pagination.has_next}
              className="p-2 border border-border rounded hover:bg-muted/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <LeadCardSkeleton key={i} />)}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads?.map((lead: any) => (
            <LeadCard 
              key={lead.id} 
              lead={lead}
              isSelected={selectedLeadIds.includes(lead.id)}
              onSelect={(selected) => {
                if (selected) {
                  setSelectedLeadIds([...selectedLeadIds, lead.id])
                } else {
                  setSelectedLeadIds(selectedLeadIds.filter(id => id !== lead.id))
                }
              }}
            />
          ))}
        </div>
      ) : (
        <LeadsTable 
          leads={leads as any}
          selectedLeads={selectedLeadIds}
          onSelectionChange={setSelectedLeadIds}
        />
      )}

      {/* Empty State */}
      {!isLoading && count === 0 && (
        <div className="border border-border rounded p-12 text-center bg-white">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No leads found</h3>
          <p className="text-sm text-fgMuted mb-6">Try adjusting your filters or list more properties to attract leads</p>
          <Link href="/builder/properties/add" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-semibold">
            <Plus className="w-5 h-5" />
            List Your First Property
          </Link>
        </div>
      )}
      
      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          filters={filters}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Bulk Operations Modal */}
      {showBulkOperations && (
        <BulkOperationsModal
          isOpen={showBulkOperations}
          onClose={() => {
            setShowBulkOperations(false)
            setSelectedLeadIds([]) // Clear selection after closing
          }}
          selectedLeads={selectedLeads}
          onSuccess={handleBulkOperationSuccess}
        />
      )}
    </main>
  )
}
