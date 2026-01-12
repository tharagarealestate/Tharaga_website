"use client"

import { motion } from 'framer-motion'
import { SectionWrapper } from './SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { Building2, MapPin, Eye, TrendingUp, Plus } from 'lucide-react'
import { builderDesignSystem } from '../design-system'
import { useQuery } from '@tanstack/react-query'
import { useDemoMode } from '../DemoDataProvider'
import { StandardPageWrapper, StandardCard, EmptyState, LoadingState } from '../StandardPageWrapper'

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

async function fetchProperties(): Promise<Property[]> {
  const res = await fetch('/api/builder/properties', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch properties')
  const data = await res.json()
  return (data?.items || []) as Property[]
}

export function PropertiesSection({ onNavigate }: PropertiesSectionProps) {
  const { isAuthenticated } = useDemoMode()

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

  return (
    <SectionWrapper>
      <StandardPageWrapper
        title="Properties"
        subtitle="Manage your property listings and track performance metrics."
        icon={<Building2 className={builderDesignSystem.cards.icon} />}
        actionButton={{
          label: 'Add Property',
          onClick: () => window.location.href = '/builders/add-property',
          icon: <Plus className="w-4 h-4" />,
        }}
      >

        {/* Stats - EXACT from main dashboard */}
        <motion.div
          initial={builderDesignSystem.animations.content.initial}
          animate={builderDesignSystem.animations.content.animate}
          transition={builderDesignSystem.animations.content.transition}
          className={builderDesignSystem.grids.statsGrid}
        >
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

        {/* Properties Grid - EXACT card style from main dashboard */}
        <StandardCard
          title="Your Properties"
          subtitle={`${displayProperties.filter(p => p.status === 'active').length} active listings`}
          icon={<Building2 className={builderDesignSystem.cards.icon} />}
        >
          {isLoading ? (
            <LoadingState message="Loading properties..." />
          ) : error || displayProperties.length === 0 ? (
            <EmptyState
              icon={<Building2 />}
              title="No properties yet"
              description="Get started by adding your first property listing. Once uploaded, it will appear here and start generating leads."
              actionButton={{
                label: 'Add your first property',
                onClick: () => window.location.href = '/builders/add-property',
                icon: <Plus className="w-4 h-4" />,
              }}
            />
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
        </StandardCard>
      </StandardPageWrapper>
    </SectionWrapper>
  )
}

