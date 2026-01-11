"use client"

import { motion } from 'framer-motion'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { Building2, MapPin, Eye, TrendingUp, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useDemoMode } from '../DemoDataProvider'

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

async function fetchProperties() {
  const res = await fetch('/api/builder/properties', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch properties')
  const data = await res.json()
  return (data?.items || []) as Property[]
}

export function PropertiesSection({ onNavigate }: PropertiesSectionProps) {
  const { isAuthenticated } = useDemoMode()

  // Always fetch real data for authenticated users
  // Only skip API call for unauthenticated public previews
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['builder-properties'],
    queryFn: fetchProperties,
    enabled: isAuthenticated, // Only fetch if authenticated
    retry: 2,
    staleTime: 30000, // Cache for 30 seconds
  })

  // Remove demo data - show loading or empty state instead
  const displayProperties = properties

  return (
    <SectionWrapper>
      <div className="w-full max-w-7xl mx-auto space-y-6 py-6">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Properties
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
              Manage your property listings and track performance metrics.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/builders/add-property'}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </motion.button>
        </motion.header>

        {/* Stats - Design System Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard
            variant="dark"
            glow
            hover
          >
            <div className="flex items-center justify-between mb-4">
              <Building2 className="h-8 w-8 text-amber-300" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{displayProperties.length}</p>
            <p className="text-sm text-slate-400">Total Properties</p>
          </GlassCard>
          <GlassCard
            variant="dark"
            glow
            hover
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {displayProperties.filter(p => p.status === 'active').length}
            </p>
            <p className="text-sm text-slate-400">Active Listings</p>
          </GlassCard>
          <GlassCard
            variant="dark"
            glow
            hover
          >
            <div className="flex items-center justify-between mb-4">
              <Eye className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {displayProperties.reduce((sum, p) => sum + (p.views || 0), 0)}
            </p>
            <p className="text-sm text-slate-400">Total Views</p>
          </GlassCard>
          <GlassCard
            variant="dark"
            glow
            hover
          >
            <div className="flex items-center justify-between mb-4">
              <MapPin className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {displayProperties.reduce((sum, p) => sum + (p.inquiries || 0), 0)}
            </p>
            <p className="text-sm text-slate-400">Inquiries</p>
          </GlassCard>
        </div>

        {/* Properties Grid */}
        <div className="bg-slate-800/95 rounded-lg border border-slate-700/50 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Your Properties
          </h2>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading properties...</p>
            </div>
          ) : error || displayProperties.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 px-6"
            >
              <div className="p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-amber-300" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Upload your property</h4>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Get started by adding your first property listing. Once uploaded, it will appear here and start generating leads.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/builders/add-property'}
                className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 glow-border inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Property
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayProperties.map((property) => (
                <div
                  key={property.id}
                  className="bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 rounded-lg p-4 transition-all cursor-pointer"
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
      </div>
    </SectionWrapper>
  )
}

