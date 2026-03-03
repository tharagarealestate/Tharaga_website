"use client"

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, MapPin, Eye, TrendingUp, Plus,
  LayoutGrid, List, Search, Users,
  Star, Shield, ArrowLeft, RefreshCw, ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderDataContext, useRealtimeData, formatINR } from '../hooks/useBuilderData'
import { AdvancedPropertyUploadForm } from '@/components/property/AdvancedPropertyUploadForm'

interface PropertiesProps {
  onNavigate?: (section: string) => void
}

type ViewMode = 'grid' | 'list'

interface PropertyItem {
  id: string
  title: string
  city: string
  locality: string
  priceINR: number | null
  image: string | null
  bedrooms: number | null
  sqft: number | null
  listed_at: string | null
  status: string
  views: number
  inquiries: number
}

export function PropertiesSection({ onNavigate }: PropertiesProps) {
  const { isAdmin } = useBuilderDataContext()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Real properties from Supabase
  const { data: propertiesResponse, isLoading } = useRealtimeData<{
    items: PropertyItem[]
  }>(`/api/builder/properties?_r=${refreshKey}`, { refreshInterval: 30000 })

  const properties = propertiesResponse?.items || []

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    available: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    active:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    sold:      { bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-500'    },
    reserved:  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-500'   },
    upcoming:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  dot: 'bg-purple-500'  },
    draft:     { bg: 'bg-zinc-800',       text: 'text-zinc-400',    dot: 'bg-zinc-500'    },
    pending:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-500'   },
  }

  const filteredProperties = searchQuery
    ? properties.filter(p =>
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.locality || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : properties

  const stats = {
    total: properties.length,
    active: properties.filter(p => ['available', 'active'].includes((p.status || '').toLowerCase())).length,
    sold: properties.filter(p => (p.status || '').toLowerCase() === 'sold').length,
    totalViews: properties.reduce((sum, p) => sum + (p.views || 0), 0),
  }

  const handleFormSuccess = useCallback((propertyId: string) => {
    setShowAddForm(false)
    // Bump refreshKey to force a fresh API call with the new property
    setRefreshKey(k => k + 1)
  }, [])

  const handleFormCancel = useCallback(() => {
    setShowAddForm(false)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ─── In-Dashboard Add Property Overlay ───────────────────────────── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            key="add-property-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-zinc-950 overflow-y-auto"
          >
            {/* Sticky top bar */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 py-3 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/60">
              <button
                onClick={handleFormCancel}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Properties
              </button>
              <span className="text-sm text-zinc-500">New Property Listing</span>
            </div>

            {/* Form body */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
              <AdvancedPropertyUploadForm
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Properties List ──────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-100">Properties</h1>
              {isAdmin && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400 font-medium">
                  <Shield className="w-3 h-3" /> All
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-1">{stats.total} properties managed</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View public listing */}
            <a
              href="/property-listing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Public Listing
            </a>
            {/* Refresh */}
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              title="Refresh"
              className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Property
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total',       value: stats.total,      icon: Building2,   color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
            { label: 'Active',      value: stats.active,     icon: Star,        color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Sold',        value: stats.sold,       icon: TrendingUp,  color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
            { label: 'Total Views', value: stats.totalViews, icon: Eye,         color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', stat.bg)}>
                    <Icon className={cn('w-3.5 h-3.5', stat.color)} />
                  </div>
                </div>
                <span className="text-2xl font-bold text-zinc-100 tabular-nums">{stat.value}</span>
              </motion.div>
            )
          })}
        </div>

        {/* Search + View toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-md transition-colors', viewMode === 'grid' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-md transition-colors', viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Empty state */}
        {properties.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
            <Building2 className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-base font-medium text-zinc-400 mb-1">No properties yet</p>
            <p className="text-sm text-zinc-600 mb-6">Add your first property to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Property
            </button>
          </div>
        )}

        {/* Grid */}
        {viewMode === 'grid' && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Building2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No properties match your search</p>
              </div>
            ) : (
              filteredProperties.map((property, i) => {
                const statusKey = (property.status || 'active').toLowerCase()
                const status = statusColors[statusKey] || statusColors.active
                return (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/[0.05] transition-all cursor-pointer group"
                  >
                    {/* Image */}
                    <div className="h-44 bg-zinc-800/50 flex items-center justify-center relative overflow-hidden">
                      {property.image ? (
                        <img
                          src={property.image}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Building2 className="w-10 h-10 text-zinc-700" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
                      {property.bedrooms && (
                        <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-zinc-200 px-2 py-0.5 rounded backdrop-blur-sm">
                          {property.bedrooms} BHK
                        </span>
                      )}
                      <span className={cn('absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full capitalize backdrop-blur-sm', status.bg, status.text)}>
                        <div className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                        {statusKey}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100 truncate mb-1">{property.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 mb-3">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{property.locality ? `${property.locality}, ` : ''}{property.city || 'Location N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-amber-400">
                          {property.priceINR ? formatINR(property.priceINR) : 'Contact'}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{property.views || 0}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{property.inquiries || 0}</span>
                        </div>
                      </div>
                      {property.sqft && (
                        <p className="text-[11px] text-zinc-600 mt-1">{property.sqft.toLocaleString()} sq.ft</p>
                      )}
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        )}

        {/* List */}
        {viewMode === 'list' && properties.length > 0 && (
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_130px_130px_110px_80px] gap-4 px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/40">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Property</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Location</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Price</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Views</span>
            </div>
            <div className="divide-y divide-zinc-800/30">
              {filteredProperties.map((property) => {
                const statusKey = (property.status || 'active').toLowerCase()
                const status = statusColors[statusKey] || statusColors.active
                return (
                  <div key={property.id} className="grid grid-cols-[1fr_130px_130px_110px_80px] gap-4 px-4 py-3 hover:bg-zinc-800/30 transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-zinc-200 truncate">{property.title}</p>
                      <p className="text-xs text-zinc-500">
                        {property.bedrooms ? `${property.bedrooms} BHK` : ''}{property.sqft ? ` · ${property.sqft.toLocaleString()} sqft` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400 self-center truncate">{property.city}</span>
                    <span className="text-xs text-amber-400 font-medium self-center">{property.priceINR ? formatINR(property.priceINR) : 'Contact'}</span>
                    <div className="self-center">
                      <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full capitalize', status.bg, status.text)}>
                        <div className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
                        {statusKey}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 self-center tabular-nums">{property.views || 0}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
