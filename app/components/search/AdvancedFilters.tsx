'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterGroup {
  title: string;
  key: string;
  expanded: boolean;
  filters: {
    label: string;
    value: string;
    count?: number;
  }[];
}

export function AdvancedFilters() {
  const router = useRouter();
  
  const [filters, setFilters] = useState<FilterGroup[]>([
    {
      title: 'Budget Range',
      key: 'budget',
      expanded: true,
      filters: [
        { label: 'Under ₹50L', value: '0-5000000', count: 245 },
        { label: '₹50L - ₹80L', value: '5000000-8000000', count: 432 },
        { label: '₹80L - ₹1Cr', value: '8000000-10000000', count: 189 },
        { label: '₹1Cr - ₹2Cr', value: '10000000-20000000', count: 156 },
        { label: 'Above ₹2Cr', value: '20000000-999999999', count: 78 }
      ]
    },
    {
      title: 'BHK Type',
      key: 'bhk',
      expanded: true,
      filters: [
        { label: '1 BHK', value: '1BHK', count: 234 },
        { label: '2 BHK', value: '2BHK', count: 456 },
        { label: '3 BHK', value: '3BHK', count: 342 },
        { label: '4 BHK', value: '4BHK', count: 123 },
        { label: '5+ BHK', value: '5BHK', count: 45 }
      ]
    },
    {
      title: 'Property Type',
      key: 'type',
      expanded: true,
      filters: [
        { label: 'Apartment', value: 'apartment', count: 678 },
        { label: 'Villa', value: 'villa', count: 234 },
        { label: 'Plot', value: 'plot', count: 156 },
        { label: 'Independent House', value: 'house', count: 89 },
        { label: 'Penthouse', value: 'penthouse', count: 43 }
      ]
    },
    {
      title: 'City',
      key: 'city',
      expanded: false,
      filters: [
        { label: 'Chennai', value: 'Chennai', count: 543 },
        { label: 'Bangalore', value: 'Bangalore', count: 432 },
        { label: 'Hyderabad', value: 'Hyderabad', count: 321 },
        { label: 'Mumbai', value: 'Mumbai', count: 234 },
        { label: 'Pune', value: 'Pune', count: 156 }
      ]
    },
    {
      title: 'Possession Status',
      key: 'possession',
      expanded: false,
      filters: [
        { label: 'Ready to Move', value: 'ready_to_move', count: 456 },
        { label: 'Under Construction', value: 'under_construction', count: 544 }
      ]
    },
    {
      title: 'Furnishing',
      key: 'furnishing',
      expanded: false,
      filters: [
        { label: 'Fully Furnished', value: 'fully_furnished', count: 234 },
        { label: 'Semi Furnished', value: 'semi_furnished', count: 345 },
        { label: 'Unfurnished', value: 'unfurnished', count: 421 }
      ]
    },
    {
      title: 'Age of Property',
      key: 'age',
      expanded: false,
      filters: [
        { label: 'New Construction', value: '0-1', count: 345 },
        { label: '1-5 Years', value: '1-5', count: 234 },
        { label: '5-10 Years', value: '5-10', count: 156 },
        { label: '10+ Years', value: '10-999', count: 89 }
      ]
    },
    {
      title: 'Amenities',
      key: 'amenities',
      expanded: false,
      filters: [
        { label: 'Swimming Pool', value: 'pool', count: 234 },
        { label: 'Gym', value: 'gym', count: 456 },
        { label: 'Power Backup', value: 'power_backup', count: 789 },
        { label: 'Parking', value: 'parking', count: 890 },
        { label: 'Security', value: 'security', count: 678 },
        { label: 'Clubhouse', value: 'clubhouse', count: 234 },
        { label: 'Garden', value: 'garden', count: 345 }
      ]
    },
    {
      title: 'Additional Filters',
      key: 'additional',
      expanded: false,
      filters: [
        { label: 'RERA Approved', value: 'rera', count: 678 },
        { label: 'Bank Loan Available', value: 'bank_approved', count: 789 },
        { label: 'Vastu Compliant', value: 'vastu', count: 456 },
        { label: 'Pet Friendly', value: 'pet_friendly', count: 234 }
      ]
    }
  ]);

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000000 });
  const [areaRange, setAreaRange] = useState({ min: 0, max: 5000 });

  const toggleFilterGroup = (key: string) => {
    setFilters(filters.map(group => 
      group.key === key ? { ...group, expanded: !group.expanded } : group
    ));
  };

  const handleFilterChange = (groupKey: string, value: string, checked: boolean) => {
    setSelectedFilters(prev => {
      const current = prev[groupKey] || [];
      if (checked) {
        return { ...prev, [groupKey]: [...current, value] };
      } else {
        return { ...prev, [groupKey]: current.filter(v => v !== value) };
      }
    });
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    // Budget
    if (priceRange.min > 0 || priceRange.max < 50000000) {
      params.set('budget_min', priceRange.min.toString());
      params.set('budget_max', priceRange.max.toString());
    }

    // Area
    if (areaRange.min > 0 || areaRange.max < 5000) {
      params.set('area_min', areaRange.min.toString());
      params.set('area_max', areaRange.max.toString());
    }

    // Other filters
    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        if (key === 'bhk') {
          params.set('bhk_types', values.join(','));
        } else if (key === 'type') {
          params.set('property_types', values.join(','));
        } else {
          params.set(key, values.join(','));
        }
      }
    });

    router.push(`/properties?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    setPriceRange({ min: 0, max: 50000000 });
    setAreaRange({ min: 0, max: 5000 });
    router.push('/properties');
  };

  const activeFilterCount = Object.values(selectedFilters).reduce(
    (sum, arr) => sum + arr.length, 
    0
  ) + (priceRange.min > 0 || priceRange.max < 50000000 ? 1 : 0) + (areaRange.min > 0 || areaRange.max < 5000 ? 1 : 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-slate-700" />
            <h3 className="text-xl font-bold text-slate-900">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-[#D4AF37] text-white text-xs font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Price Range Slider */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Price Range: ₹{(priceRange.min / 100000).toFixed(1)}L - ₹{(priceRange.max / 10000000).toFixed(1)}Cr
          </label>
          <div className="flex gap-4">
            <input
              type="range"
              min="0"
              max="50000000"
              step="1000000"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="range"
              min="0"
              max="50000000"
              step="1000000"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Area Range Slider */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Carpet Area: {areaRange.min} - {areaRange.max} sqft
          </label>
          <div className="flex gap-4">
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={areaRange.min}
              onChange={(e) => setAreaRange({ ...areaRange, min: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={areaRange.max}
              onChange={(e) => setAreaRange({ ...areaRange, max: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Filter Groups */}
      <div className="max-h-[600px] overflow-y-auto">
        {filters.map((group) => (
          <div key={group.key} className="border-b border-slate-200">
            <button
              onClick={() => toggleFilterGroup(group.key)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <span className="font-semibold text-slate-900">{group.title}</span>
              {group.expanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            <AnimatePresence>
              {group.expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 space-y-2">
                    {group.filters.map((filter) => (
                      <label
                        key={filter.value}
                        className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFilters[group.key]?.includes(filter.value) || false}
                          onChange={(e) => handleFilterChange(group.key, filter.value, e.target.checked)}
                          className="w-4 h-4 text-[#D4AF37] border-slate-300 rounded focus:ring-[#D4AF37]"
                        />
                        <span className="flex-1 text-sm text-slate-700">{filter.label}</span>
                        {filter.count && (
                          <span className="text-xs text-slate-500">({filter.count})</span>
                        )}
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Apply Button */}
      <div className="p-6 border-t border-slate-200">
        <button
          onClick={applyFilters}
          className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
        >
          Show Properties
        </button>
      </div>
    </div>
  );
}














