'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileFiltersProps {
  onClose?: () => void;
}

export function MobileFilters({ onClose }: MobileFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
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

  const [expandedSections, setExpandedSections] = useState({
    propertyType: true,
    bhkType: true,
    budget: false,
    possession: false,
    amenities: false
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
    onClose?.();
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
  };

  const activeFilterCount = Object.values(filters).flat().filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Filter Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#1e40af]" />
              <h2 className="text-lg font-bold text-slate-900">Filters</h2>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 bg-[#1e40af] text-white text-xs font-bold rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors touch-manipulation"
              aria-label="Close filters"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-[#1e40af] font-medium hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Filter Content */}
        <div className="p-4 space-y-4">
          {/* Property Type */}
          <FilterSection
            title="Property Type"
            isExpanded={expandedSections.propertyType}
            onToggle={() => toggleSection('propertyType')}
          >
            <div className="grid grid-cols-2 gap-2">
              {['apartment', 'villa', 'plot', 'penthouse', 'studio', 'duplex'].map(type => (
                <label
                  key={type}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer touch-manipulation"
                >
                  <input
                    type="checkbox"
                    checked={filters.property_type.includes(type)}
                    onChange={() => handleFilterChange('property_type', type, true)}
                    className="w-4 h-4 text-[#1e40af] rounded focus:ring-2 focus:ring-[#1e40af]/20 border-slate-300"
                  />
                  <span className="text-sm text-slate-700 capitalize flex-1">{type}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* BHK Type */}
          <FilterSection
            title="BHK Configuration"
            isExpanded={expandedSections.bhkType}
            onToggle={() => toggleSection('bhkType')}
          >
            <div className="flex flex-wrap gap-2">
              {['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+'].map(bhk => (
                <label
                  key={bhk}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 cursor-pointer touch-manipulation transition-all ${
                    filters.bhk_type.includes(bhk)
                      ? 'bg-[#1e40af] text-white border-[#1e40af]'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-[#1e40af]/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filters.bhk_type.includes(bhk)}
                    onChange={() => handleFilterChange('bhk_type', bhk, true)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{bhk}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Budget */}
          <FilterSection
            title="Budget"
            isExpanded={expandedSections.budget}
            onToggle={() => toggleSection('budget')}
          >
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 mb-1.5 block font-medium">Min Price</label>
                <input
                  type="number"
                  placeholder="e.g., 50L"
                  value={filters.min_price}
                  onChange={(e) => handleFilterChange('min_price', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 bg-white text-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-[#1e40af]/20 focus:border-[#1e40af] placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1.5 block font-medium">Max Price</label>
                <input
                  type="number"
                  placeholder="e.g., 1Cr"
                  value={filters.max_price}
                  onChange={(e) => handleFilterChange('max_price', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 bg-white text-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-[#1e40af]/20 focus:border-[#1e40af] placeholder:text-slate-400"
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
            <div className="space-y-2">
              {['ready-to-move', 'under-construction'].map(status => (
                <label
                  key={status}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer touch-manipulation"
                >
                  <input
                    type="checkbox"
                    checked={filters.possession_status.includes(status)}
                    onChange={() => handleFilterChange('possession_status', status, true)}
                    className="w-5 h-5 text-[#1e40af] rounded focus:ring-2 focus:ring-[#1e40af]/20 border-slate-300"
                  />
                  <span className="text-sm text-slate-700 capitalize flex-1">
                    {status.replace('-', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Amenities */}
          <FilterSection
            title="Amenities"
            isExpanded={expandedSections.amenities}
            onToggle={() => toggleSection('amenities')}
          >
            <div className="grid grid-cols-2 gap-2">
              {['Parking', 'Lift', 'Security', 'Gym', 'Pool', 'Power Backup'].map(amenity => (
                <label
                  key={amenity}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer touch-manipulation"
                >
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(amenity)}
                    onChange={() => handleFilterChange('amenities', amenity, true)}
                    className="w-4 h-4 text-[#1e40af] rounded focus:ring-2 focus:ring-[#1e40af]/20 border-slate-300"
                  />
                  <span className="text-sm text-slate-700 flex-1">{amenity}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Quick Filters */}
          <div className="pt-4 border-t border-slate-200">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={filters.rera_verified}
                onChange={(e) => handleFilterChange('rera_verified', e.target.checked)}
                className="w-5 h-5 text-[#1e40af] rounded focus:ring-2 focus:ring-[#1e40af]/20 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700 flex-1">RERA Verified Only</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer touch-manipulation mt-2">
              <input
                type="checkbox"
                checked={filters.approved_by_bank}
                onChange={(e) => handleFilterChange('approved_by_bank', e.target.checked)}
                className="w-5 h-5 text-[#1e40af] rounded focus:ring-2 focus:ring-[#1e40af]/20 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700 flex-1">Bank Approved</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 space-y-2">
          <button
            onClick={applyFilters}
            className="w-full px-6 py-3.5 bg-[#1e40af] text-white font-semibold rounded-xl hover:bg-[#1e3a8a] active:scale-95 transition-all shadow-lg touch-manipulation"
          >
            Apply Filters
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 active:scale-95 transition-all touch-manipulation"
          >
            Cancel
          </button>
        </div>
      </motion.div>
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
    <div className="border-b border-slate-200 pb-4 last:border-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full mb-3 touch-manipulation"
      >
        <span className="font-semibold text-slate-900 text-base">{title}</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-600" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}





