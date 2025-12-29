'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Building2,
  Plus,
  Grid,
  List,
  Filter,
  Search,
  TrendingUp,
  Eye,
  MessageSquare,
  X,
  MapPin,
  Calendar,
  Edit2,
  BarChart3,
  ExternalLink,
} from 'lucide-react'
import { formatCrores, cn } from '@/lib/utils'
import {
  DashboardPageHeader,
  StatCard,
  StatsGrid,
  ContentCard,
  ContentCardHeader,
  ContentCardBody,
  PrimaryButton,
  SecondaryButton,
  ItemCard,
  EmptyState,
} from '../_components/ui/DashboardDesignSystem'

// Types
type Property = {
  id: string
  title: string
  city?: string
  locality?: string
  priceINR?: number | null
  image?: string | null
  status?: 'active' | 'draft' | 'sold' | 'archived'
  bedrooms?: number | null
  sqft?: number | null
  listed_at?: string
  views?: number
  inquiries?: number
}

type FilterState = {
  status: string[]
  city: string[]
  priceRange: { min: number; max: number }
  search: string
}

// Fetch properties
const fetchProperties = async () => {
  const res = await fetch('/api/builder/properties', { next: { revalidate: 0 } as any })
  if (!res.ok) throw new Error('Failed to load properties')
  const data = await res.json()
  return (data.items || []) as Property[]
}

export default function BuilderPropertiesPage() {
  const router = useRouter()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    city: [],
    priceRange: { min: 0, max: 100000000 },
    search: '',
  })

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['builder-properties'],
    queryFn: fetchProperties,
  })

  // Filter and search properties
  const filteredProperties = useMemo(() => {
    let filtered = [...properties]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.locality?.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query) ||
          p.id?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter((p) => filters.status.includes(p.status || 'active'))
    }

    // City filter
    if (filters.city.length > 0) {
      filtered = filtered.filter((p) => p.city && filters.city.includes(p.city))
    }

    // Price range filter
    filtered = filtered.filter((p) => {
      const price = p.priceINR || 0
      return price >= filters.priceRange.min && price <= filters.priceRange.max
    })

    return filtered
  }, [properties, searchQuery, filters])

  // Calculate stats
  const stats = useMemo(() => {
    const total = properties.length
    const totalViews = properties.reduce((sum, p) => sum + (p.views || 0), 0)
    const totalInquiries = properties.reduce((sum, p) => sum + (p.inquiries || 0), 0)
    const activeProperties = properties.filter((p) => (p.status || 'active') === 'active').length
    const conversionRate =
      totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) : '0.0'

    return {
      total,
      totalViews,
      totalInquiries,
      activeProperties,
      conversionRate,
    }
  }, [properties])

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>()
    properties.forEach((p) => {
      if (p.city) cities.add(p.city)
    })
    return Array.from(cities).sort()
  }, [properties])

  function toggleFilter(key: keyof FilterState, value: string) {
    setFilters((prev) => {
      if (key === 'status' || key === 'city') {
        const arr = prev[key] as string[]
        const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
        return { ...prev, [key]: newArr }
      }
      return prev
    })
  }

  function clearFilters() {
    setFilters({
      status: [],
      city: [],
      priceRange: { min: 0, max: 100000000 },
      search: '',
    })
    setSearchQuery('')
  }

  const activeFilterCount = filters.status.length + filters.city.length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <DashboardPageHeader
        title="Properties"
        subtitle="Manage your property listings and track performance"
        emoji="🏢"
        action={
          <PrimaryButton onClick={() => router.push('/builders/add-property')}>
            <Plus className="w-4 h-4 mr-2 inline" />
            Add Property
          </PrimaryButton>
        }
      />

      {/* Stats Grid */}
      <StatsGrid cols={4}>
        <StatCard
          icon={Building2}
          label="Total Properties"
          value={stats.total}
          subtitle={`${stats.activeProperties} active`}
          loading={isLoading}
          delay={0}
        />
        <StatCard
          icon={Eye}
          label="Total Views"
          value={
            stats.totalViews >= 1000
              ? `${(stats.totalViews / 1000).toFixed(1)}K`
              : stats.totalViews.toString()
          }
          subtitle="Property impressions"
          loading={isLoading}
          delay={0.1}
        />
        <StatCard
          icon={MessageSquare}
          label="Inquiries"
          value={stats.totalInquiries}
          subtitle="Lead conversions"
          loading={isLoading}
          delay={0.2}
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion Rate"
          value={`${stats.conversionRate}%`}
          subtitle="Views to inquiries"
          loading={isLoading}
          delay={0.3}
        />
      </StatsGrid>

      {/* Search and Filters Card */}
      <ContentCard>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Search Bar */}
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search properties by name, location, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-white placeholder:text-slate-400"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-700/50 rounded-lg border border-slate-600/50">
              <button
                onClick={() => setView('grid')}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  view === 'grid'
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:bg-slate-600/50'
                )}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  view === 'list'
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:bg-slate-600/50'
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={cn(
                'relative px-6 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg hover:bg-slate-700/70 transition-all flex items-center gap-2 font-medium',
                activeFilterCount > 0 ? 'text-amber-300 border-amber-500/50' : 'text-slate-300'
              )}
            >
              <Filter className="w-5 h-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-amber-500 text-slate-900 text-xs font-bold rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Filter Properties</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {['active', 'draft', 'sold', 'archived'].map((status) => (
                      <button
                        key={status}
                        onClick={() => toggleFilter('status', status)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                          filters.status.includes(status)
                            ? 'bg-amber-500 text-slate-900'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50'
                        )}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* City Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {uniqueCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => toggleFilter('city', city)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                          filters.city.includes(city)
                            ? 'bg-amber-500 text-slate-900'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50'
                        )}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Price Range
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, min: Number(e.target.value) || 0 },
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder:text-slate-400"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          priceRange: {
                            ...prev.priceRange,
                            max: Number(e.target.value) || 100000000,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ContentCard>

      {/* Properties Content */}
      <ContentCard>
        <ContentCardHeader
          icon={Building2}
          title={`Properties (${filteredProperties.length})`}
          subtitle={`Showing ${filteredProperties.length} of ${properties.length} properties`}
        />
        <ContentCardBody
          loading={isLoading}
          loadingMessage="Loading properties..."
          empty={!isLoading && filteredProperties.length === 0}
          emptyIcon={Building2}
          emptyTitle={
            searchQuery || activeFilterCount > 0 ? 'No properties found' : 'No properties yet'
          }
          emptyMessage={
            searchQuery || activeFilterCount > 0
              ? 'Try adjusting your search or filters'
              : 'List your first property to get started'
          }
          emptyAction={
            !searchQuery &&
            activeFilterCount === 0 && (
              <PrimaryButton onClick={() => router.push('/builders/add-property')}>
                <Plus className="w-4 h-4 mr-2 inline" />
                Add Your First Property
              </PrimaryButton>
            )
          }
        >
          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property, index) => (
                <PropertyCard key={property.id} property={property} delay={index * 0.05} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProperties.map((property, index) => (
                <PropertyListItem key={property.id} property={property} delay={index * 0.05} />
              ))}
            </div>
          )}
        </ContentCardBody>
      </ContentCard>
    </div>
  )
}

function PropertyCard({ property, delay }: { property: Property; delay: number }) {
  const router = useRouter()
  const statusColors = {
    active: 'bg-emerald-500',
    draft: 'bg-amber-500',
    sold: 'bg-blue-500',
    archived: 'bg-slate-500',
  }

  const status = property.status || 'active'
  const pricePerSqft =
    property.priceINR && property.sqft ? Math.round(property.priceINR / property.sqft) : null
  const [imageSrc, setImageSrc] = useState(property.image || '/property-placeholder.jpg')

  useEffect(() => {
    setImageSrc(property.image || '/property-placeholder.jpg')
  }, [property.image])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative bg-slate-700/50 glow-border rounded-lg overflow-hidden group cursor-pointer"
    >
      {/* Hover Glow Effect */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent pointer-events-none"
      />

      {/* Property Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={imageSrc}
          alt={property.title || 'Property image'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => setImageSrc('/property-placeholder.jpg')}
        />

        {/* Status Badge */}
        <div
          className={cn(
            'absolute top-4 right-4 px-3 py-1 text-white text-xs font-semibold rounded-full backdrop-blur-sm',
            statusColors[status]
          )}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>

        {/* Quick Stats Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center justify-between text-white text-sm">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {property.views || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {property.inquiries || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 relative z-10">
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors line-clamp-1">
          {property.title}
        </h3>
        <div className="flex items-center gap-1 text-slate-400 text-sm mb-4">
          <MapPin className="w-4 h-4" />
          <span className="truncate">
            {property.locality && property.city
              ? `${property.locality}, ${property.city}`
              : property.city || property.locality || 'Location not specified'}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-600/50">
          <div>
            <div className="text-xl font-bold text-amber-300">
              {property.priceINR ? formatCrores(property.priceINR) : 'Price on request'}
            </div>
            {pricePerSqft && (
              <div className="text-xs text-slate-400">₹{pricePerSqft.toLocaleString('en-IN')}/sqft</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
          {property.bedrooms && <span>{property.bedrooms} BHK</span>}
          {property.bedrooms && property.sqft && <span>•</span>}
          {property.sqft && <span>{property.sqft.toLocaleString('en-IN')} sqft</span>}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/builders/add-property?id=${property.id}`)}
            className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => router.push('/builder/properties/performance')}
            className="flex-1 py-2 px-3 bg-slate-600/50 hover:bg-slate-600/70 text-slate-200 font-medium rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function PropertyListItem({ property, delay }: { property: Property; delay: number }) {
  const router = useRouter()
  const statusColors = {
    active: 'bg-emerald-500',
    draft: 'bg-amber-500',
    sold: 'bg-blue-500',
    archived: 'bg-slate-500',
  }

  const status = property.status || 'active'
  const pricePerSqft =
    property.priceINR && property.sqft ? Math.round(property.priceINR / property.sqft) : null
  const [imageSrc, setImageSrc] = useState(property.image || '/property-placeholder.jpg')

  useEffect(() => {
    setImageSrc(property.image || '/property-placeholder.jpg')
  }, [property.image])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.01, x: 4 }}
      className="bg-slate-700/50 glow-border rounded-lg overflow-hidden group"
    >
      {/* Hover Glow */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none"
      />

      <div className="flex flex-col md:flex-row relative z-10">
        {/* Image */}
        <div className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden flex-shrink-0">
          <Image
            src={imageSrc}
            alt={property.title || 'Property image'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageSrc('/property-placeholder.jpg')}
          />
          <div
            className={cn(
              'absolute top-4 left-4 px-3 py-1 text-white text-xs font-semibold rounded-full backdrop-blur-sm',
              statusColors[status]
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                {property.title}
              </h3>
              <div className="flex items-center gap-1 text-slate-400 text-sm mb-3">
                <MapPin className="w-4 h-4" />
                <span>
                  {property.locality && property.city
                    ? `${property.locality}, ${property.city}`
                    : property.city || property.locality || 'Location not specified'}
                </span>
              </div>
            </div>

            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-amber-300 mb-1">
                {property.priceINR ? formatCrores(property.priceINR) : 'Price on request'}
              </div>
              {pricePerSqft && (
                <div className="text-xs text-slate-400">
                  ₹{pricePerSqft.toLocaleString('en-IN')}/sqft
                </div>
              )}
            </div>
          </div>

          {/* Property Details */}
          <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
            {property.bedrooms && <span>{property.bedrooms} BHK</span>}
            {property.bedrooms && property.sqft && <span>•</span>}
            {property.sqft && <span>{property.sqft.toLocaleString('en-IN')} sqft</span>}
            {property.listed_at && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Listed{' '}
                  {new Date(property.listed_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mb-4 pb-4 border-b border-slate-600/50">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Eye className="w-4 h-4" />
              <span>{property.views || 0} views</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <MessageSquare className="w-4 h-4" />
              <span>{property.inquiries || 0} inquiries</span>
            </div>
            {property.views && property.inquiries && property.views > 0 && (
              <div className="text-sm text-emerald-300 font-medium">
                {((property.inquiries / property.views) * 100).toFixed(1)}% conversion
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/builders/add-property?id=${property.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium rounded-lg transition-all text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => router.push('/builder/properties/performance')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600/50 hover:bg-slate-600/70 text-slate-200 font-medium rounded-lg transition-all text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <Link
              href={`/properties/${property.id}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-slate-600/50 hover:bg-slate-600/70 text-slate-200 font-medium rounded-lg transition-all text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              View
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
