'use client'

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { PropertySearchInterface } from '@/components/property/PropertySearchInterface'
import { SearchFilters } from '@/components/property/SearchFilters'
import { PropertyGrid } from '@/components/property/PropertyGrid'
import { BuilderPropertyContainer } from '@/components/property/BuilderPropertyContainer'
import { Property } from '@/types/property'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SkeletonGrid, SkeletonCard } from '@/components/ui/skeleton-loader'
import { EmptyState } from '@/components/ui/empty-state'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { PremiumButton } from '@/components/ui/premium-button'
import Breadcrumb from '@/components/Breadcrumb'
import { Search, Home, Filter } from 'lucide-react'

function PropertyListingContent() {
  const searchParams = useSearchParams()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'builder'>('builder') // Default to builder view
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  })

  // Check if filters are applied
  const hasFilters = useMemo(() => {
    const filterKeys = [
      'property_type', 'bhk_type', 'min_price', 'max_price',
      'possession_status', 'amenities', 'rera_verified', 'approved_by_bank',
      'match_preferences', 'recently_viewed', 'high_interest',
      'min_safety_score', 'schools_within_3km', 'hospitals_within_5km',
      'metro_access', 'shopping_malls', 'parks_nearby'
    ]
    return filterKeys.some(key => searchParams.has(key))
  }, [searchParams])

  // Fetch properties based on search params
  useEffect(() => {
    fetchProperties()
  }, [searchParams, pagination.page])

  const fetchProperties = async () => {
    setLoading(true)
    setError(null)

    try {
      // Build query params from searchParams
      const params = new URLSearchParams()
      searchParams.forEach((value, key) => {
        params.append(key, value)
      })

      // Add pagination
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const response = await fetch(`/api/properties-list?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties')
      }

      const data = await response.json()
      
      // Handle both array and object responses
      const propertiesList = Array.isArray(data) 
        ? data 
        : Array.isArray(data.properties) 
        ? data.properties 
        : Array.isArray(data.data?.properties)
        ? data.data.properties
        : []

      setProperties(propertiesList)
      
      // Update pagination if available
      if (data.pagination) {
        setPagination(data.pagination)
      } else if (data.data?.pagination) {
        setPagination(data.data.pagination)
      } else {
        // Estimate pagination from data
        setPagination(prev => ({
          ...prev,
          total: propertiesList.length,
          total_pages: Math.ceil(propertiesList.length / prev.limit),
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load properties')
      console.error('Error fetching properties:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Property Search', href: '/property-listing' }
      ]} />

      <div className="py-8">
        {/* Hero Section */}
        <PageHeader
          title="Find Your Dream Property"
          description="Explore thousands of verified listings, powered by AI insights and advanced filters."
          emoji="🏠"
        />
        <div className="mb-8">
          <PropertySearchInterface />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <Suspense fallback={<div className="text-white">Loading filters...</div>}>
              <SearchFilters />
            </Suspense>
          </aside>

          {/* Property Listings */}
          <section className="lg:col-span-3">
            {loading ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-2">
                    <SkeletonCard className="h-8 w-48" />
                    <SkeletonCard className="h-4 w-32" />
                  </div>
                  <SkeletonCard className="h-10 w-48" />
                </div>
                <SkeletonGrid count={6} columns={viewMode === 'grid' ? 1 : 1} />
              </div>
            ) : error ? (
              <EmptyState
                icon={Search}
                iconColor="text-red-400"
                title="Error Loading Properties"
                description={error || "We encountered an issue while loading properties. Please try again."}
                action={{
                  label: 'Try Again',
                  onClick: () => fetchProperties(),
                  variant: 'gold'
                }}
                secondaryAction={{
                  label: 'Clear Filters',
                  onClick: () => window.location.href = '/property-listing'
                }}
              />
            ) : properties.length === 0 ? (
              <EmptyState
                icon={hasFilters ? Filter : Home}
                iconColor="text-blue-400"
                title={hasFilters ? "No Properties Match Your Filters" : "No Properties Available"}
                description={
                  hasFilters
                    ? "Try adjusting your search filters or criteria to see more results."
                    : "Properties will appear here once they are listed. Check back soon!"
                }
                action={
                  hasFilters ? {
                    label: 'Clear All Filters',
                    onClick: () => window.location.href = '/property-listing',
                    variant: 'gold'
                  } : {
                    label: 'Browse All Properties',
                    href: '/property-listing',
                    variant: 'gold'
                  }
                }
                secondaryAction={
                  hasFilters ? {
                    label: 'Explore Featured',
                    href: '/property-listing?featured=true'
                  } : undefined
                }
              />
            ) : (
              <>
                {/* View Mode Toggle & Results Count */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Showing {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
                    </h2>
                    {pagination.total > 0 && (
                      <p className="text-slate-400 text-sm mt-1">
                        of {pagination.total} total
                      </p>
                    )}
                  </div>
                  
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('builder')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                        viewMode === 'builder'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      By Builder
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                        viewMode === 'grid'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Grid View
                    </button>
                  </div>
                </div>

                {/* Properties Display */}
                {viewMode === 'builder' ? (
                  <BuilderPropertyContainer 
                    properties={properties} 
                    defaultExpanded={hasFilters} // Expand all when filters applied
                  />
                ) : (
                  <PropertyGrid properties={properties} />
                )}

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <PremiumButton
                      variant="outline"
                      size="md"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={!pagination.has_prev}
                    >
                      Previous
                    </PremiumButton>
                    <span className="text-slate-300">
                      Page {pagination.page} of {pagination.total_pages}
                    </span>
                    <PremiumButton
                      variant="outline"
                      size="md"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={!pagination.has_next}
                    >
                      Next
                    </PremiumButton>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </PageWrapper>
  )
}

export default function PropertyListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <PropertyListingContent />
    </Suspense>
  )
}

