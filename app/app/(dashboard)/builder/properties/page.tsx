'use client'

import { useState } from 'react'
import { Building2, Search, Plus, ArrowRight, BarChart3 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { BuilderPageWrapper } from '../_components/BuilderPageWrapper'

async function fetchProperties() {
  const res = await fetch('/api/builder/properties', { cache: 'no-store' })
  if (!res.ok) return []
  const j = await res.json()
  return (j.items || j.properties || []) as Array<{
    id: string
    title: string
    locality?: string
    city?: string
    price?: number
    bedrooms?: number
    status?: string
    view_count?: number
  }>
}

function EmptyPropertiesState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
        <Building2 className="w-8 h-8 text-amber-400" />
      </div>
      <h3 className="text-xl font-bold text-zinc-100 mb-2">No properties yet</h3>
      <p className="text-zinc-400 max-w-sm mb-8">
        Add your first property to start generating leads and tracking performance.
      </p>
      <Link
        href="/builder/properties/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20"
      >
        <Plus className="w-4 h-4" /> Add Property
      </Link>
    </div>
  )
}

export default function PropertiesPage() {
  const [search, setSearch] = useState('')

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['builder-properties-list'],
    queryFn: fetchProperties,
  })

  const filtered = properties.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.locality?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <BuilderPageWrapper title="Properties" description="Manage your property listings">
      {/* Top Actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search properties…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/builder/properties/performance"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 text-sm font-medium transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Performance
          </Link>
          <Link
            href="/builder/properties/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-all"
          >
            <Plus className="w-4 h-4" /> Add Property
          </Link>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="property-card p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse">
              <div className="h-32 bg-zinc-800 rounded-xl mb-4" />
              <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyPropertiesState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(prop => (
            <Link
              key={prop.id}
              href={`/builder/properties/${prop.id}`}
              className="property-card glass-card p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 transition-all group"
              data-testid="property-card"
            >
              <div className="h-32 bg-zinc-800 rounded-xl mb-4 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="font-semibold text-zinc-100 mb-1 group-hover:text-amber-300 transition-colors truncate">{prop.title}</h3>
              {prop.locality && <p className="text-xs text-zinc-500 mb-1">{prop.locality}{prop.city ? `, ${prop.city}` : ''}</p>}
              <div className="flex items-center justify-between mt-3">
                {prop.price && <span className="text-sm font-bold text-amber-400">₹{(prop.price / 100000).toFixed(1)}L</span>}
                {prop.view_count !== undefined && (
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    {prop.view_count} views
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </BuilderPageWrapper>
  )
}
