"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, MapPin, Eye, TrendingUp, Plus, List, Filter } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useBuilderAuth } from '../BuilderAuthProvider'
import { BuilderPageWrapper } from '../BuilderPageWrapper'
import { StandardStatsCard } from '../design-system/StandardStatsCard'

interface PropertiesSectionProps {
  onNavigate?: (section: string) => void
}

interface Property {
  id: string
  title: string
  locality?: string
  city?: string
  priceINR?: number
  status?: string
  views?: number
  inquiries?: number
}

function fetchProperties(): Promise<Property[]> {
  return fetch('/api/builder/properties', { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch properties')
      return res.json()
    })
    .then((data) => (data?.items || []) as Property[])
}

export function PropertiesSection({ onNavigate }: PropertiesSectionProps) {
  const { isAuthenticated } = useBuilderAuth()

  // Always fetch real data for authenticated users
  // Only skip API call for unauthenticated public previews
  const { data: properties = [], isLoading, error } = useQuery<Property[]>({
    queryKey: ['builder-properties'],
    queryFn: fetchProperties,
    enabled: isAuthenticated, // Only fetch if authenticated
    retry: 2,
    staleTime: 30000, // Cache for 30 seconds
  })

  // Remove demo data - show loading or empty state instead
  const displayProperties = properties

  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list')
  const activeProperties = displayProperties.filter(p => p.status === 'active')
  const totalViews = displayProperties.reduce((sum, p) => sum + (p.views || 0), 0)
  const totalInquiries = displayProperties.reduce((sum, p) => sum + (p.inquiries || 0), 0)

  return (
    <BuilderPageWrapper 
      title="Properties" 
      description="Manage your property listings and track performance metrics"
      noContainer
    >
      <div className="space-y-6">
        {/* Tabs - Design System (matching leads page) */}
        <div className="flex gap-2 border-b glow-border pb-2 overflow-x-auto">
          {[
            { id: 'list', label: 'All Properties', icon: List },
            { id: 'add', label: 'Add Property', icon: Plus },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'add') {
                    window.location.href = '/builders/add-property'
                  } else {
                    setActiveTab(tab.id as 'list' | 'add')
                  }
                }}
                className={`px-6 py-3 font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-amber-300 border-b-2 border-amber-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content - Design System Container (matching leads page) */}
        <AnimatePresence mode="wait">
          {activeTab === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 sm:p-8 space-y-6">
                {/* Stats - EXACT from leads page design */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StandardStatsCard
                    title="Total Properties"
                    value={displayProperties.length}
                    icon={<Building2 className="w-5 h-5" />}
                  />
                  <StandardStatsCard
                    title="Active Listings"
                    value={activeProperties.length}
                    icon={<TrendingUp className="w-5 h-5" />}
                  />
                  <StandardStatsCard
                    title="Total Views"
                    value={totalViews}
                    icon={<Eye className="w-5 h-5" />}
                  />
                  <StandardStatsCard
                    title="Inquiries"
                    value={totalInquiries}
                    icon={<MapPin className="w-5 h-5" />}
                  />
                </div>

                {/* Properties Grid */}
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto"></div>
                    <p className="text-slate-400 mt-4">Loading properties...</p>
                  </div>
                ) : error || displayProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No properties yet</h3>
                    <p className="text-slate-400 mb-6">Get started by adding your first property listing.</p>
                    <button
                      onClick={() => window.location.href = '/builders/add-property'}
                      className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add your first property
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayProperties.map((property) => (
                      <div
                        key={property.id}
                        className="w-full p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:glow-border rounded-lg transition-all duration-300 text-left relative overflow-hidden group cursor-pointer"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('open-property-detail', { detail: { propertyId: property.id } }))
                        }}
                      >
                        <h3 className="font-semibold text-white mb-2 truncate">{property.title}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{property.locality || property.city || 'Location'}</span>
                        </div>
                        {property.priceINR && (
                          <div className="text-lg font-bold text-amber-400 mb-2">
                            ₹{(property.priceINR / 10000000).toFixed(2)}Cr
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{property.views || 0}</span>
                          </div>
                          <div className="px-2 py-1 bg-emerald-500/10 text-emerald-300 rounded">
                            {property.status || 'active'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BuilderPageWrapper>
  )
}

