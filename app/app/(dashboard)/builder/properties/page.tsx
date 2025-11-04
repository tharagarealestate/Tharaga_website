'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Building2, Plus, Grid, List, Filter, Search, TrendingUp, Eye, MessageSquare, X, MapPin, Calendar, Edit2, BarChart3, ExternalLink } from 'lucide-react'
import { formatCrores } from '@/lib/utils'

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
async function fetchProperties() {
  const res = await fetch('/api/builder/properties', { next: { revalidate: 0 } as any })
  if (!res.ok) throw new Error('Failed to load properties')
  const data = await res.json()
  return (data.items || []) as Property[]
}

export default function BuilderPropertiesPage() {
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
    const conversionRate = totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) : '0.0'

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
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      {/* Premium Glass Header */}
      <div className='bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30'>
        <div className='max-w-7xl mx-auto px-6 py-6'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-bold bg-gradient-to-r from-primary-900 to-primary-700 bg-clip-text text-transparent'>
                Properties
              </h1>
              <p className='text-gray-600 mt-1'>Manage your property listings and performance</p>
            </div>

            <Link
              href='/builders/add-property'
              className='group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-gold-500/50 transition-all duration-300 hover:-translate-y-1'
            >
              <div className='absolute inset-0 bg-gradient-to-r from-gold-500 to-gold-400 opacity-0 group-hover:opacity-100 transition-opacity' />
              <div className='relative flex items-center gap-2'>
                <Plus className='w-5 h-5' />
                Add Property
              </div>
            </Link>
          </div>

          {/* Search & Filters Bar */}
          <div className='flex items-center gap-4'>
            {/* Glass Search Bar */}
            <div className='flex-1 relative'>
              <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder='Search properties by name, location, or ID...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all'
              />
            </div>

            {/* View Toggle */}
            <div className='flex items-center gap-1 p-1 bg-white/60 backdrop-blur-md rounded-xl border border-gray-300/50'>
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-all ${
                  view === 'grid'
                    ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className='w-5 h-5' />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-all ${
                  view === 'list'
                    ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className='w-5 h-5' />
              </button>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`relative px-6 py-3 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-xl hover:bg-white/80 transition-all flex items-center gap-2 font-medium ${
                activeFilterCount > 0 ? 'text-gold-600 border-gold-500/50' : 'text-gray-700'
              }`}
            >
              <Filter className='w-5 h-5' />
              Filters
              {activeFilterCount > 0 && (
                <span className='ml-1 px-2 py-0.5 bg-gold-500 text-white text-xs font-bold rounded-full'>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <div className='bg-white/80 backdrop-blur-xl border-b border-gray-200/50'>
        <div className='max-w-7xl mx-auto px-6 py-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>Filter Properties</h3>
            <button
              onClick={clearFilters}
              className='text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1'
            >
              <X className='w-4 h-4' />
              Clear all
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Status Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Status</label>
              <div className='flex flex-wrap gap-2'>
                {['active', 'draft', 'sold', 'archived'].map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleFilter('status', status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.status.includes(status)
                        ? 'bg-gold-500 text-white shadow-md'
                        : 'bg-white/60 text-gray-700 hover:bg-gray-100 border border-gray-300/50'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* City Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>City</label>
              <div className='flex flex-wrap gap-2 max-h-32 overflow-y-auto'>
                {uniqueCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => toggleFilter('city', city)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.city.includes(city)
                        ? 'bg-gold-500 text-white shadow-md'
                        : 'bg-white/60 text-gray-700 hover:bg-gray-100 border border-gray-300/50'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Price Range
              </label>
              <div className='flex items-center gap-2'>
                <input
                  type='number'
                  placeholder='Min'
                  value={filters.priceRange.min || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, min: Number(e.target.value) || 0 },
                    }))
                  }
                  className='w-full px-3 py-2 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-lg text-sm'
                />
                <span className='text-gray-500'>-</span>
                <input
                  type='number'
                  placeholder='Max'
                  value={filters.priceRange.max || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, max: Number(e.target.value) || 100000000 },
                    }))
                  }
                  className='w-full px-3 py-2 bg-white/60 backdrop-blur-md border border-gray-300/50 rounded-lg text-sm'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Stats Cards */}
      <div className='max-w-7xl mx-auto px-6 py-8'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <StatsCard
            icon={Building2}
            label='Total Properties'
            value={stats.total.toString()}
            change={`+${stats.activeProperties}`}
            trend='up'
            gradient='from-blue-500 to-blue-600'
          />
          <StatsCard
            icon={Eye}
            label='Total Views'
            value={stats.totalViews >= 1000 ? `${(stats.totalViews / 1000).toFixed(1)}K` : stats.totalViews.toString()}
            change='+18%'
            trend='up'
            gradient='from-purple-500 to-purple-600'
          />
          <StatsCard
            icon={MessageSquare}
            label='Inquiries'
            value={stats.totalInquiries.toString()}
            change='+24'
            trend='up'
            gradient='from-emerald-500 to-emerald-600'
          />
          <StatsCard
            icon={TrendingUp}
            label='Conversion Rate'
            value={`${stats.conversionRate}%`}
            change='+2.1%'
            trend='up'
            gradient='from-gold-500 to-gold-600'
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[1, 2, 3].map((i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProperties.length === 0 && (
          <div className='text-center py-16'>
            <Building2 className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              {searchQuery || activeFilterCount > 0 ? 'No properties found' : 'No properties yet'}
            </h3>
            <p className='text-gray-600 mb-6'>
              {searchQuery || activeFilterCount > 0
                ? 'Try adjusting your search or filters'
                : 'List your first property to get started'}
            </p>
            {!searchQuery && activeFilterCount === 0 && (
              <Link
                href='/builders/add-property'
                className='inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all'
              >
                <Plus className='w-5 h-5' />
                Add Your First Property
              </Link>
            )}
          </div>
        )}

        {/* Property Grid/List */}
        {!isLoading && filteredProperties.length > 0 && (
          <>
            {view === 'grid' ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className='space-y-4'>
                {filteredProperties.map((property) => (
                  <PropertyListItem key={property.id} property={property} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatsCard({
  icon: Icon,
  label,
  value,
  change,
  trend,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  change: string
  trend: 'up' | 'down'
  gradient: string
}) {
  return (
    <div className='group relative overflow-hidden bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300'>
      {/* Animated gradient background on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
      />

      <div className='relative'>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className='w-6 h-6 text-white' />
        </div>

        <div className='text-sm text-gray-600 mb-1'>{label}</div>
        <div className='text-3xl font-bold text-gray-900 mb-2'>{value}</div>

        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          <TrendingUp className='w-4 h-4' />
          {change}
        </div>
      </div>
    </div>
  )
}

function PropertyCard({ property }: { property: Property }) {
  const statusColors = {
    active: 'bg-emerald-500',
    draft: 'bg-yellow-500',
    sold: 'bg-blue-500',
    archived: 'bg-gray-500',
  }

  const status = property.status || 'active'
  const pricePerSqft =
    property.priceINR && property.sqft ? Math.round(property.priceINR / property.sqft) : null

  return (
    <div className='group relative overflow-hidden bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500'>
      {/* Property Image */}
      <div className='relative h-48 overflow-hidden'>
        <img
          src={property.image || '/property-placeholder.jpg'}
          alt={property.title}
          className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/property-placeholder.jpg'
          }}
        />

        {/* Status Badge */}
        <div
          className={`absolute top-4 right-4 px-3 py-1 ${statusColors[status]} text-white text-xs font-semibold rounded-full backdrop-blur-sm`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>

        {/* Quick Stats Overlay */}
        <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
          <div className='flex items-center justify-between text-white text-sm'>
            <span className='flex items-center gap-1'>
              <Eye className='w-4 h-4' />
              {property.views || 0} views
            </span>
            <span className='flex items-center gap-1'>
              <MessageSquare className='w-4 h-4' />
              {property.inquiries || 0} inquiries
            </span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className='p-6'>
        <h3 className='text-xl font-bold text-gray-900 mb-2 group-hover:text-gold-600 transition-colors line-clamp-1'>
          {property.title}
        </h3>
        <div className='flex items-center gap-1 text-gray-600 text-sm mb-4'>
          <MapPin className='w-4 h-4' />
          <span>
            {property.locality && property.city
              ? `${property.locality}, ${property.city}`
              : property.city || property.locality || 'Location not specified'}
          </span>
        </div>

        <div className='flex items-center justify-between mb-4 pb-4 border-b border-gray-200'>
          <div>
            <div className='text-2xl font-bold bg-gradient-to-r from-gold-600 to-gold-500 bg-clip-text text-transparent'>
              {property.priceINR ? formatCrores(property.priceINR) : 'Price on request'}
            </div>
            {pricePerSqft && (
              <div className='text-xs text-gray-500'>₹{pricePerSqft.toLocaleString('en-IN')}/sqft</div>
            )}
          </div>

          {property.views && property.views > 0 && (
            <div className='text-right'>
              <div className='text-sm font-semibold text-emerald-600'>+24% ROI</div>
              <div className='text-xs text-gray-500'>in 3 years</div>
            </div>
          )}
        </div>

        <div className='flex items-center gap-4 text-sm text-gray-600 mb-4'>
          {property.bedrooms && <span>{property.bedrooms} BHK</span>}
          {property.bedrooms && property.sqft && <span>•</span>}
          {property.sqft && <span>{property.sqft.toLocaleString('en-IN')} sqft</span>}
          {property.sqft && <span>•</span>}
          <span>Ready</span>
        </div>

        <div className='flex gap-2'>
          <Link
            href={`/builders/add-property?id=${property.id}`}
            className='flex-1 py-2 px-4 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-medium rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2'
          >
            <Edit2 className='w-4 h-4' />
            Edit
          </Link>
          <Link
            href='/builder/properties/performance'
            className='flex-1 py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2'
          >
            <BarChart3 className='w-4 h-4' />
            Analytics
          </Link>
        </div>
      </div>
    </div>
  )
}

function PropertyListItem({ property }: { property: Property }) {
  const statusColors = {
    active: 'bg-emerald-500',
    draft: 'bg-yellow-500',
    sold: 'bg-blue-500',
    archived: 'bg-gray-500',
  }

  const status = property.status || 'active'
  const pricePerSqft =
    property.priceINR && property.sqft ? Math.round(property.priceINR / property.sqft) : null

  return (
    <div className='group bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden'>
      <div className='flex flex-col md:flex-row'>
        {/* Image */}
        <div className='relative w-full md:w-64 h-48 md:h-auto overflow-hidden flex-shrink-0'>
          <img
            src={property.image || '/property-placeholder.jpg'}
            alt={property.title}
            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = '/property-placeholder.jpg'
            }}
          />
          <div
            className={`absolute top-4 left-4 px-3 py-1 ${statusColors[status]} text-white text-xs font-semibold rounded-full backdrop-blur-sm`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 p-6'>
          <div className='flex items-start justify-between mb-3'>
            <div className='flex-1'>
              <h3 className='text-xl font-bold text-gray-900 mb-2 group-hover:text-gold-600 transition-colors'>
                {property.title}
              </h3>
              <div className='flex items-center gap-1 text-gray-600 text-sm mb-3'>
                <MapPin className='w-4 h-4' />
                <span>
                  {property.locality && property.city
                    ? `${property.locality}, ${property.city}`
                    : property.city || property.locality || 'Location not specified'}
                </span>
              </div>
            </div>

            <div className='text-right ml-4'>
              <div className='text-2xl font-bold bg-gradient-to-r from-gold-600 to-gold-500 bg-clip-text text-transparent mb-1'>
                {property.priceINR ? formatCrores(property.priceINR) : 'Price on request'}
              </div>
              {pricePerSqft && (
                <div className='text-xs text-gray-500'>₹{pricePerSqft.toLocaleString('en-IN')}/sqft</div>
              )}
            </div>
          </div>

          {/* Property Details */}
          <div className='flex items-center gap-4 text-sm text-gray-600 mb-4'>
            {property.bedrooms && <span className='flex items-center gap-1'>{property.bedrooms} BHK</span>}
            {property.bedrooms && property.sqft && <span>•</span>}
            {property.sqft && <span>{property.sqft.toLocaleString('en-IN')} sqft</span>}
            {property.sqft && <span>•</span>}
            <span>Ready</span>
            {property.listed_at && (
              <>
                <span>•</span>
                <span className='flex items-center gap-1'>
                  <Calendar className='w-4 h-4' />
                  Listed {new Date(property.listed_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              </>
            )}
          </div>

          {/* Stats */}
          <div className='flex items-center gap-6 mb-4 pb-4 border-b border-gray-200'>
            <div className='flex items-center gap-2 text-sm'>
              <Eye className='w-4 h-4 text-gray-400' />
              <span className='text-gray-600'>{property.views || 0} views</span>
            </div>
            <div className='flex items-center gap-2 text-sm'>
              <MessageSquare className='w-4 h-4 text-gray-400' />
              <span className='text-gray-600'>{property.inquiries || 0} inquiries</span>
            </div>
            {property.views && property.inquiries && property.views > 0 && (
              <div className='text-sm text-emerald-600 font-medium'>
                {((property.inquiries / property.views) * 100).toFixed(1)}% conversion
              </div>
            )}
          </div>

          {/* Actions */}
          <div className='flex items-center gap-3'>
            <Link
              href={`/builders/add-property?id=${property.id}`}
              className='flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-white font-medium rounded-lg hover:shadow-lg transition-all'
            >
              <Edit2 className='w-4 h-4' />
              Edit
            </Link>
            <Link
              href='/builder/properties/performance'
              className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all'
            >
              <BarChart3 className='w-4 h-4' />
              Analytics
            </Link>
            <Link
              href={`/properties/${property.id}`}
              target='_blank'
              className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all'
            >
              <ExternalLink className='w-4 h-4' />
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function PropertyCardSkeleton() {
  return (
    <div className='bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl overflow-hidden animate-pulse'>
      <div className='h-48 bg-gray-200' />
      <div className='p-6'>
        <div className='h-6 bg-gray-200 rounded mb-3' />
        <div className='h-4 bg-gray-200 rounded w-3/4 mb-4' />
        <div className='h-8 bg-gray-200 rounded mb-4' />
        <div className='h-4 bg-gray-200 rounded w-1/2 mb-4' />
        <div className='flex gap-2'>
          <div className='flex-1 h-10 bg-gray-200 rounded' />
          <div className='flex-1 h-10 bg-gray-200 rounded' />
        </div>
      </div>
    </div>
  )
}

