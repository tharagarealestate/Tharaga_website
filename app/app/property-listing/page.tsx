'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import Breadcrumb from '@/components/Breadcrumb';
import PropertyListingSidebar from './components/PropertyListingSidebar';
import PropertyListingContent from './components/PropertyListingContent';
import MobileFilterModal from './components/MobileFilterModal';

// Define comprehensive filter types
export interface PropertyFilters {
  // Location
  city: string[];
  locality: string[];
  nearMetro: boolean;
  metroDistance: number; // in minutes
  
  // Price
  priceMin: number;
  priceMax: number;
  
  // Property Details
  propertyType: ('apartment' | 'villa' | 'plot' | 'independent_house')[];
  bhk: (1 | 2 | 3 | 4 | 5)[];
  furnishedStatus: ('any' | 'furnished' | 'semi_furnished' | 'unfurnished')[];
  facing: ('any' | 'east' | 'west' | 'north' | 'south')[];
  
  // Area
  areaMin: number; // sqft
  areaMax: number; // sqft
  
  // Amenities
  amenities: string[];
  
  // Sorting
  sortBy: 'ai_relevance' | 'newest' | 'price_low_high' | 'price_high_low' | 'area_high_low';
  
  // View preference
  viewType: 'list' | 'grid' | 'map';
}

function PropertyListingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabase();

  // State management
  const [filters, setFilters] = useState<PropertyFilters>({
    city: [],
    locality: [],
    nearMetro: false,
    metroDistance: 10,
    priceMin: 0,
    priceMax: 200000000, // 2 Cr
    propertyType: [],
    bhk: [],
    furnishedStatus: ['any'],
    facing: ['any'],
    areaMin: 0,
    areaMax: 10000,
    amenities: [],
    sortBy: 'ai_relevance',
    viewType: 'grid',
  });

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: Partial<PropertyFilters> = {};
    
    // Parse URL parameters
    if (searchParams.get('city')) {
      urlFilters.city = searchParams.get('city')!.split(',');
    }
    if (searchParams.get('locality')) {
      urlFilters.locality = searchParams.get('locality')!.split(',');
    }
    if (searchParams.get('priceMin')) {
      urlFilters.priceMin = parseInt(searchParams.get('priceMin')!);
    }
    if (searchParams.get('priceMax')) {
      urlFilters.priceMax = parseInt(searchParams.get('priceMax')!);
    }
    if (searchParams.get('propertyType')) {
      urlFilters.propertyType = searchParams.get('propertyType')!.split(',') as any;
    }
    if (searchParams.get('bhk')) {
      urlFilters.bhk = searchParams.get('bhk')!.split(',').map(Number) as any;
    }
    if (searchParams.get('furnishedStatus')) {
      urlFilters.furnishedStatus = [searchParams.get('furnishedStatus')! as any];
    }
    if (searchParams.get('facing')) {
      urlFilters.facing = [searchParams.get('facing')! as any];
    }
    if (searchParams.get('areaMin')) {
      urlFilters.areaMin = parseInt(searchParams.get('areaMin')!);
    }
    if (searchParams.get('areaMax')) {
      urlFilters.areaMax = parseInt(searchParams.get('areaMax')!);
    }
    if (searchParams.get('amenities')) {
      urlFilters.amenities = searchParams.get('amenities')!.split(',');
    }
    if (searchParams.get('nearMetro') === 'true') {
      urlFilters.nearMetro = true;
    }
    if (searchParams.get('metroDistance')) {
      urlFilters.metroDistance = parseInt(searchParams.get('metroDistance')!);
    }
    if (searchParams.get('sortBy')) {
      urlFilters.sortBy = searchParams.get('sortBy') as any;
    }
    if (searchParams.get('viewType')) {
      urlFilters.viewType = searchParams.get('viewType') as any;
    }
    
    setFilters(prev => ({ ...prev, ...urlFilters }));
  }, [searchParams]);

  // Sync filters to URL
  const syncFiltersToURL = (newFilters: PropertyFilters) => {
    const params = new URLSearchParams();
    
    // Add all active filters to URL
    if (newFilters.city.length > 0) {
      params.set('city', newFilters.city.join(','));
    }
    if (newFilters.locality.length > 0) {
      params.set('locality', newFilters.locality.join(','));
    }
    if (newFilters.priceMin > 0) {
      params.set('priceMin', newFilters.priceMin.toString());
    }
    if (newFilters.priceMax < 200000000) {
      params.set('priceMax', newFilters.priceMax.toString());
    }
    if (newFilters.propertyType.length > 0) {
      params.set('propertyType', newFilters.propertyType.join(','));
    }
    if (newFilters.bhk.length > 0) {
      params.set('bhk', newFilters.bhk.join(','));
    }
    if (newFilters.furnishedStatus[0] !== 'any') {
      params.set('furnishedStatus', newFilters.furnishedStatus[0]);
    }
    if (newFilters.facing[0] !== 'any') {
      params.set('facing', newFilters.facing[0]);
    }
    if (newFilters.areaMin > 0) {
      params.set('areaMin', newFilters.areaMin.toString());
    }
    if (newFilters.areaMax < 10000) {
      params.set('areaMax', newFilters.areaMax.toString());
    }
    if (newFilters.amenities.length > 0) {
      params.set('amenities', newFilters.amenities.join(','));
    }
    if (newFilters.nearMetro) {
      params.set('nearMetro', 'true');
      params.set('metroDistance', newFilters.metroDistance.toString());
    }
    if (newFilters.sortBy !== 'ai_relevance') {
      params.set('sortBy', newFilters.sortBy);
    }
    if (newFilters.viewType !== 'grid') {
      params.set('viewType', newFilters.viewType);
    }
    
    router.push(`/property-listing?${params.toString()}`, { scroll: false });
  };

  // Fetch properties from Supabase
  const fetchProperties = async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          builder:profiles!builder_id (
            id,
            email,
            company_name,
            logo_url,
            verified
          )
        `, { count: 'exact' })
        .eq('verification_status', 'approved')
        .eq('availability_status', 'available');

      // Apply filters
      if (filters.city.length > 0) {
        query = query.in('city', filters.city);
      }
      
      if (filters.locality.length > 0) {
        query = query.in('locality', filters.locality);
      }
      
      // Use base_price (new schema) - we've migrated all properties to use base_price
      if (filters.priceMin > 0) {
        // Use base_price if available, otherwise fallback to price_inr
        query = query.or(`base_price.gte.${filters.priceMin},price_inr.gte.${filters.priceMin}`);
      }
      
      if (filters.priceMax < 200000000) {
        query = query.or(`base_price.lte.${filters.priceMax},price_inr.lte.${filters.priceMax}`);
      }
      
      if (filters.propertyType.length > 0) {
        query = query.in('property_type', filters.propertyType);
      }
      
      // Use bhk_type (new schema) with fallback to bedrooms
      if (filters.bhk.length > 0) {
        const bhkMapping: Record<number, string> = {
          1: '1BHK',
          2: '2BHK',
          3: '3BHK',
          4: '4BHK',
          5: '5BHK+'
        };
        const bhkTypes = filters.bhk.map(b => bhkMapping[b]).filter(Boolean);
        if (bhkTypes.length > 0) {
          // Use bhk_type (new schema)
          query = query.in('bhk_type', bhkTypes);
        } else {
          // Fallback to bedrooms
          query = query.in('bedrooms', filters.bhk);
        }
      }
      
      // Use carpet_area (new schema) with fallback to sqft
      if (filters.areaMin > 0) {
        query = query.or(`carpet_area.gte.${filters.areaMin},sqft.gte.${filters.areaMin}`);
      }
      
      if (filters.areaMax < 10000) {
        query = query.or(`carpet_area.lte.${filters.areaMax},sqft.lte.${filters.areaMax}`);
      }
      
      if (filters.furnishedStatus[0] !== 'any') {
        // Map old status to new schema
        const statusMap: Record<string, string> = {
          'furnished': 'fully-furnished',
          'semi_furnished': 'semi-furnished',
          'unfurnished': 'unfurnished'
        };
        const newStatus = statusMap[filters.furnishedStatus[0]] || filters.furnishedStatus[0];
        // Use furnishing_status (new schema) with fallback
        query = query.or(`furnishing_status.eq.${newStatus},furnished.eq.${filters.furnishedStatus[0]}`);
      }
      
      if (filters.facing[0] !== 'any') {
        query = query.eq('facing', filters.facing[0]);
      }
      
      // Metro filter - skip if field might not exist
      // Note: This field may not be in all properties, so we'll skip it for now
      // if (filters.nearMetro) {
      //   query = query.lte('nearest_metro_minutes', filters.metroDistance);
      // }
      
      // Amenities filter (array column)
      if (filters.amenities.length > 0) {
        filters.amenities.forEach(amenity => {
          query = query.contains('amenities', [amenity]);
        });
      }
      
      // Apply sorting - use new schema fields with fallbacks
      switch (filters.sortBy) {
        case 'ai_relevance':
          // Use ai_appreciation_band or created_at
          query = query.order('ai_appreciation_band', { ascending: false, nullsLast: true });
          query = query.order('created_at', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'price_low_high':
          // Prefer base_price, fallback to price_inr
          query = query.order('base_price', { ascending: true, nullsLast: true });
          query = query.order('price_inr', { ascending: true, nullsLast: true });
          break;
        case 'price_high_low':
          query = query.order('base_price', { ascending: false, nullsLast: true });
          query = query.order('price_inr', { ascending: false, nullsLast: true });
          break;
        case 'area_high_low':
          // Prefer carpet_area, fallback to sqft
          query = query.order('carpet_area', { ascending: false, nullsLast: true });
          query = query.order('sqft', { ascending: false, nullsLast: true });
          break;
      }
      
      // Pagination
      const itemsPerPage = 20;
      const from = (pageNum - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      if (append) {
        setProperties(prev => [...prev, ...(data || [])]);
      } else {
        setProperties(data || []);
      }
      
      setTotalCount(count || 0);
      setHasMore((data?.length || 0) === itemsPerPage);
      
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on filter change
  useEffect(() => {
    setPage(1);
    fetchProperties(1, false);
  }, [filters]);

  // Handle filter updates
  const updateFilters = (newFilters: Partial<PropertyFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    syncFiltersToURL(updated);
  };

  // Reset all filters
  const resetFilters = () => {
    const defaultFilters: PropertyFilters = {
      city: [],
      locality: [],
      nearMetro: false,
      metroDistance: 10,
      priceMin: 0,
      priceMax: 200000000,
      propertyType: [],
      bhk: [],
      furnishedStatus: ['any'],
      facing: ['any'],
      areaMin: 0,
      areaMax: 10000,
      amenities: [],
      sortBy: 'ai_relevance',
      viewType: filters.viewType, // preserve view type
    };
    setFilters(defaultFilters);
    router.push('/property-listing');
  };

  // Load more for infinite scroll
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProperties(nextPage, true);
  };

  return (
    <div className="min-h-screen bg-slate-900/95 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-amber-500 rounded-full blur-3xl" />
        <div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-slate-700 rounded-full blur-3xl"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10">
        {/* Main Layout: Sidebar + Content */}
        <div className="max-w-[1920px] mx-auto">
        <div className="flex">
          {/* LEFT SIDEBAR - Desktop Only */}
          <aside className="hidden lg:block w-80 xl:w-96 bg-slate-800/95 border-r-2 border-amber-300 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
            <PropertyListingSidebar
              filters={filters}
              updateFilters={updateFilters}
              resetFilters={resetFilters}
              propertiesCount={totalCount}
            />
          </aside>

          {/* RIGHT CONTENT AREA */}
          <main className="flex-1 min-w-0 bg-slate-900/95">
            <div className="p-6">
              <Breadcrumb items={[
                { label: 'Home', href: '/' },
                { label: 'Property Listing' }
              ]} />
            </div>
            <PropertyListingContent
              properties={properties}
              filters={filters}
              updateFilters={updateFilters}
              loading={loading}
              totalCount={totalCount}
              hasMore={hasMore}
              loadMore={loadMore}
              onOpenMobileFilters={() => setMobileFilterOpen(true)}
            />
          </main>
        </div>
        </div>

        {/* MOBILE FILTER MODAL */}
        <MobileFilterModal
          isOpen={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          filters={filters}
          updateFilters={updateFilters}
          resetFilters={resetFilters}
          propertiesCount={totalCount}
        />
      </div>
    </div>
  );
}

export default function PropertyListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900/95">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <PropertyListingPageContent />
    </Suspense>
  );
}

