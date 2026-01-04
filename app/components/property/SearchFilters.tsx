'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [expandedSections, setExpandedSections] = useState({
    propertyType: true,
    bhkType: true,
    budget: true,
    possession: true,
    amenities: false,
    more: false
  });

  const [filters, setFilters] = useState({
    property_type: searchParams.getAll('property_type'),
    bhk_type: searchParams.getAll('bhk_type'),
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    possession_status: searchParams.getAll('possession_status'),
    furnishing_status: searchParams.getAll('furnishing_status'),
    amenities: searchParams.getAll('amenities'),
    rera_verified: searchParams.get('rera_verified') === 'true',
    approved_by_bank: searchParams.get('approved_by_bank') === 'true'
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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
      approved_by_bank: false
    });
    router.push('/property-listing');
  };

  const activeFilterCount = Object.values(filters).flat().filter(Boolean).length;

  return (
    <div className="bg-slate-800/95 rounded-xl border-2 border-amber-300 p-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Filters</h3>
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
        className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white font-semibold rounded-lg hover:shadow-lg transition-all"
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
  title: string; 
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

