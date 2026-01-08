'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, ChevronDown, ChevronUp, Sparkles, MapPin, School, Hospital, Shield, Train, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBehavioralTracking } from '@/hooks/useBehavioralTracking';

interface UserPreferences {
  preferred_property_types?: string[];
  preferred_locations?: string[];
  budget_min?: number;
  budget_max?: number;
  must_have_amenities?: string[];
}

interface NeighborhoodFilters {
  min_safety_score?: number;
  schools_within_3km?: boolean;
  hospitals_within_5km?: boolean;
  metro_access?: boolean;
  shopping_malls?: boolean;
  parks_nearby?: boolean;
}

/**
 * Enhanced Search Filters with Behavioral Engine & Neighborhood Tracking
 * Integrates user preferences, viewing history, and neighborhood data
 */
export function EnhancedSearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sessionId, trackEvent } = useBehavioralTracking();
  
  const [expandedSections, setExpandedSections] = useState({
    propertyType: true,
    bhkType: true,
    budget: true,
    possession: true,
    amenities: false,
    behavioral: false, // NEW: Behavioral filters
    neighborhood: false, // NEW: Neighborhood filters
    more: false
  });

  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  // Load user preferences from behavioral engine
  useEffect(() => {
    async function loadPreferences() {
      try {
        // Check if user is authenticated
        const { data: { user } } = await (await import('@/lib/supabase')).getSupabase().auth.getUser();
        
        if (user) {
          // Fetch user preferences from behavioral engine
          const response = await fetch('/api/ai/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.preferences) {
              setUserPreferences(data.preferences);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      } finally {
        setLoadingPreferences(false);
      }
    }
    
    loadPreferences();
  }, []);

  const [filters, setFilters] = useState({
    // Standard filters
    property_type: searchParams.getAll('property_type'),
    bhk_type: searchParams.getAll('bhk_type'),
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    possession_status: searchParams.getAll('possession_status'),
    furnishing_status: searchParams.getAll('furnishing_status'),
    amenities: searchParams.getAll('amenities'),
    rera_verified: searchParams.get('rera_verified') === 'true',
    approved_by_bank: searchParams.get('approved_by_bank') === 'true',
    
    // Behavioral filters (NEW)
    match_preferences: searchParams.get('match_preferences') === 'true',
    recently_viewed: searchParams.get('recently_viewed') === 'true',
    high_interest: searchParams.get('high_interest') === 'true',
    
    // Neighborhood filters (NEW)
    min_safety_score: searchParams.get('min_safety_score') || '',
    schools_within_3km: searchParams.get('schools_within_3km') === 'true',
    hospitals_within_5km: searchParams.get('hospitals_within_5km') === 'true',
    metro_access: searchParams.get('metro_access') === 'true',
    shopping_malls: searchParams.get('shopping_malls') === 'true',
    parks_nearby: searchParams.get('parks_nearby') === 'true',
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    
    // Track filter interaction
    trackEvent({
      event_type: 'filter_application',
      event_metadata: { filter_section: section },
    });
  };

  const handleFilterChange = (filterKey: string, value: string | boolean, isMulti = false) => {
    setFilters(prev => {
      if (isMulti && typeof value === 'string') {
        const currentValues = prev[filterKey as keyof typeof prev] as string[];
        const newValues = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value];
        return { ...prev, [filterKey]: newValues };
      }
      return { ...prev, [filterKey]: value };
    });
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else if (value && value !== '') {
        params.append(key, String(value));
      }
    });

    // Track filter application
    trackEvent({
      event_type: 'filter_application',
      event_metadata: { 
        filters_applied: Object.keys(filters).filter(k => {
          const v = filters[k as keyof typeof filters];
          return Array.isArray(v) ? v.length > 0 : v && v !== '';
        }).length,
      },
    });

    router.push(`/property-listing?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      property_type: [],
      bhk_type: [],
      min_price: '',
      max_price: '',
      possession_status: [],
      furnishing_status: [],
      amenities: [],
      rera_verified: false,
      approved_by_bank: false,
      match_preferences: false,
      recently_viewed: false,
      high_interest: false,
      min_safety_score: '',
      schools_within_3km: false,
      hospitals_within_5km: false,
      metro_access: false,
      shopping_malls: false,
      parks_nearby: false,
    });
    router.push('/property-listing');
  };

  const activeFilterCount = Object.values(filters).flat().filter(Boolean).length;

  // Apply user preferences to filters if available
  const applyUserPreferences = () => {
    if (!userPreferences) return;
    
    setFilters(prev => ({
      ...prev,
      property_type: userPreferences.preferred_property_types || prev.property_type,
      min_price: userPreferences.budget_min?.toString() || prev.min_price,
      max_price: userPreferences.budget_max?.toString() || prev.max_price,
      amenities: userPreferences.must_have_amenities || prev.amenities,
      match_preferences: true,
    }));
    
    applyFilters();
  };

  return (
    <div className="bg-slate-800/95 rounded-xl border-2 border-amber-300 p-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-300" />
          Smart Filters
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-amber-300 hover:text-amber-200"
          >
            <X className="w-4 h-4" />
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* User Preferences Quick Apply */}
      {userPreferences && !loadingPreferences && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-amber-500/10 border border-amber-300/30 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-300 mb-1">Your Preferences Detected</p>
              <p className="text-xs text-slate-300">
                {userPreferences.preferred_property_types?.length || 0} property types • 
                Budget: ₹{userPreferences.budget_min?.toLocaleString()} - ₹{userPreferences.budget_max?.toLocaleString()}
              </p>
            </div>
            <button
              onClick={applyUserPreferences}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              Apply
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Property Type */}
        <FilterSection
          title="Property Type"
          isExpanded={expandedSections.propertyType}
          onToggle={() => toggleSection('propertyType')}
        >
          {['apartment', 'villa', 'plot', 'penthouse', 'studio', 'duplex'].map(type => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.property_type.includes(type)}
                onChange={() => handleFilterChange('property_type', type, true)}
                className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
              />
              <span className="text-sm text-slate-200 capitalize">{type}</span>
            </label>
          ))}
        </FilterSection>

        {/* BHK Type */}
        <FilterSection
          title="BHK Configuration"
          isExpanded={expandedSections.bhkType}
          onToggle={() => toggleSection('bhkType')}
        >
          {['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+'].map(bhk => (
            <label key={bhk} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.bhk_type.includes(bhk)}
                onChange={() => handleFilterChange('bhk_type', bhk, true)}
                className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
              />
              <span className="text-sm text-slate-200">{bhk}</span>
            </label>
          ))}
        </FilterSection>

        {/* Budget */}
        <FilterSection
          title="Budget"
          isExpanded={expandedSections.budget}
          onToggle={() => toggleSection('budget')}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 mb-1 block">Min Price (₹)</label>
              <input
                type="number"
                placeholder="e.g., 5000000"
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                className="w-full px-3 py-2 border-2 border-amber-300 bg-slate-700/50 text-white rounded-lg text-sm focus:ring-2 focus:ring-amber-300/20 focus:border-amber-200 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 mb-1 block">Max Price (₹)</label>
              <input
                type="number"
                placeholder="e.g., 10000000"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                className="w-full px-3 py-2 border-2 border-amber-300 bg-slate-700/50 text-white rounded-lg text-sm focus:ring-2 focus:ring-amber-300/20 focus:border-amber-200 placeholder:text-slate-400"
              />
            </div>
          </div>
        </FilterSection>

        {/* Possession */}
        <FilterSection
          title="Possession Status"
          isExpanded={expandedSections.possession}
          onToggle={() => toggleSection('possession')}
        >
          {['ready-to-move', 'under-construction'].map(status => (
            <label key={status} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.possession_status.includes(status)}
                onChange={() => handleFilterChange('possession_status', status, true)}
                className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
              />
              <span className="text-sm text-slate-200 capitalize">
                {status.replace('-', ' ')}
              </span>
            </label>
          ))}
        </FilterSection>

        {/* Amenities */}
        <FilterSection
          title="Amenities"
          isExpanded={expandedSections.amenities}
          onToggle={() => toggleSection('amenities')}
        >
          {['Parking', 'Lift', '24x7 Security', 'Gym', 'Swimming Pool', 'Power Backup'].map(amenity => (
            <label key={amenity} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.amenities.includes(amenity)}
                onChange={() => handleFilterChange('amenities', amenity, true)}
                className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
              />
              <span className="text-sm text-slate-200">{amenity}</span>
            </label>
          ))}
        </FilterSection>

        {/* Behavioral Filters - NEW */}
        <FilterSection
          title={
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-300" />
              Smart Recommendations
            </span>
          }
          isExpanded={expandedSections.behavioral}
          onToggle={() => toggleSection('behavioral')}
        >
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.match_preferences}
                onChange={(e) => handleFilterChange('match_preferences', e.target.checked)}
                className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
              />
              <span className="text-sm text-slate-200">Match My Preferences</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.recently_viewed}
                onChange={(e) => handleFilterChange('recently_viewed', e.target.checked)}
                className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
              />
              <span className="text-sm text-slate-200">Recently Viewed Similar</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.high_interest}
                onChange={(e) => handleFilterChange('high_interest', e.target.checked)}
                className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
              />
              <span className="text-sm text-slate-200">High Interest Properties</span>
            </label>
          </div>
        </FilterSection>

        {/* Neighborhood Filters - NEW */}
        <FilterSection
          title={
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-300" />
              Neighborhood
            </span>
          }
          isExpanded={expandedSections.neighborhood}
          onToggle={() => toggleSection('neighborhood')}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 mb-1 block">Min Safety Score (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                placeholder="e.g., 7"
                value={filters.min_safety_score}
                onChange={(e) => handleFilterChange('min_safety_score', e.target.value)}
                className="w-full px-3 py-2 border-2 border-amber-300 bg-slate-700/50 text-white rounded-lg text-sm focus:ring-2 focus:ring-amber-300/20 focus:border-amber-200 placeholder:text-slate-400"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.schools_within_3km}
                onChange={(e) => handleFilterChange('schools_within_3km', e.target.checked)}
                className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
              />
              <School className="w-4 h-4 text-amber-300" />
              <span className="text-sm text-slate-200">Schools within 3km</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hospitals_within_5km}
                onChange={(e) => handleFilterChange('hospitals_within_5km', e.target.checked)}
                className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
              />
              <Hospital className="w-4 h-4 text-amber-300" />
              <span className="text-sm text-slate-200">Hospitals within 5km</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.metro_access}
                onChange={(e) => handleFilterChange('metro_access', e.target.checked)}
                className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
              />
              <Train className="w-4 h-4 text-amber-300" />
              <span className="text-sm text-slate-200">Metro Access</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.shopping_malls}
                onChange={(e) => handleFilterChange('shopping_malls', e.target.checked)}
                className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
              />
              <span className="text-sm text-slate-200">Shopping Malls Nearby</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.parks_nearby}
                onChange={(e) => handleFilterChange('parks_nearby', e.target.checked)}
                className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
              />
              <span className="text-sm text-slate-200">Parks Nearby</span>
            </label>
          </div>
        </FilterSection>

        {/* More Filters */}
        <FilterSection
          title="More Filters"
          isExpanded={expandedSections.more}
          onToggle={() => toggleSection('more')}
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.rera_verified}
              onChange={(e) => handleFilterChange('rera_verified', e.target.checked)}
              className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
            />
            <Shield className="w-4 h-4 text-amber-300" />
            <span className="text-sm text-slate-200">RERA Verified Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.approved_by_bank}
              onChange={(e) => handleFilterChange('approved_by_bank', e.target.checked)}
              className="w-4 h-4 text-amber-300 rounded focus:ring-2 focus:ring-amber-300/50 bg-slate-700/50 border-amber-300"
            />
            <span className="text-sm text-slate-200">Bank Approved</span>
          </label>
        </FilterSection>
      </div>

      {/* Apply Button */}
      <button
        onClick={applyFilters}
        className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-amber-500/50 transition-all"
      >
        Apply Filters
      </button>
    </div>
  );
}

function FilterSection({ 
  title, 
  isExpanded, 
  onToggle, 
  children 
}: { 
  title: string | React.ReactNode; 
  isExpanded: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-700 pb-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="font-semibold text-white">{title}</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-amber-300" />
        ) : (
          <ChevronDown className="w-5 h-5 text-amber-300" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}







