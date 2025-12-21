'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, Grid3x3, List, Map as MapIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { PropertyFilters } from '../page';
import AppliedFilters from './AppliedFilters';
import PropertyGrid from './PropertyGrid';
import { formatIndianNumber } from '@/lib/utils/currency';

interface PropertyListingContentProps {
  properties: any[];
  filters: PropertyFilters;
  updateFilters: (filters: Partial<PropertyFilters>) => void;
  loading: boolean;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => void;
  onOpenMobileFilters: () => void;
}

export default function PropertyListingContent({
  properties,
  filters,
  updateFilters,
  loading,
  totalCount,
  hasMore,
  loadMore,
  onOpenMobileFilters,
}: PropertyListingContentProps) {
  const [quickSearch, setQuickSearch] = useState('');

  const handleQuickSearch = () => {
    // Implement quick search logic
    console.log('Quick search:', quickSearch);
  };

  return (
    <div className="min-h-screen bg-slate-900/95">
      {/* TOP BAR: Search, Sort, View Toggle */}
      <div className="bg-slate-800/95 border-b-2 border-amber-300 sticky top-16 z-30">
        <div className="p-4 space-y-4">
          {/* Row 1: Search + Mobile Filter Button + Sort + View Toggle */}
          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Try: 3BHK near metro under 1Cr in Adyar"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickSearch()}
                className="pl-10 pr-4 py-6 text-base bg-slate-700/50 border-2 border-amber-300 text-white placeholder:text-slate-400 focus:border-amber-200 focus:ring-2 focus:ring-amber-300/20"
              />
            </div>

            {/* Mobile Filter Button */}
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenMobileFilters}
              className="lg:hidden"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>

            {/* Sort Dropdown */}
            <Select
              value={filters.sortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
              className="w-[200px] hidden sm:flex"
            >
              <option value="ai_relevance">✨ AI Relevance</option>
              <option value="newest">🆕 Newest</option>
              <option value="price_low_high">💰 Price: Low → High</option>
              <option value="price_high_low">💎 Price: High → Low</option>
              <option value="area_high_low">📏 Area: High → Low</option>
            </Select>

            {/* View Toggle */}
            <div className="hidden md:flex items-center gap-1 border-2 border-amber-300 rounded-lg p-1 bg-slate-800/95">
              <Button
                variant={filters.viewType === 'grid' ? 'primary' : 'invisible'}
                size="sm"
                onClick={() => updateFilters({ viewType: 'grid' })}
                className={filters.viewType === 'grid' ? 'bg-amber-300 text-slate-900 hover:bg-amber-200' : 'text-slate-200 hover:bg-slate-700/50'}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={filters.viewType === 'list' ? 'primary' : 'invisible'}
                size="sm"
                onClick={() => updateFilters({ viewType: 'list' })}
                className={filters.viewType === 'list' ? 'bg-amber-300 text-slate-900 hover:bg-amber-200' : 'text-slate-200 hover:bg-slate-700/50'}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={filters.viewType === 'map' ? 'primary' : 'invisible'}
                size="sm"
                onClick={() => updateFilters({ viewType: 'map' })}
                className={filters.viewType === 'map' ? 'bg-amber-300 text-slate-900 hover:bg-amber-200' : 'text-slate-200 hover:bg-slate-700/50'}
              >
                <MapIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Row 2: Results Count + Applied Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-sm text-slate-200">
              {loading ? (
                <span className="flex items-center gap-2 text-slate-200">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  Loading properties...
                </span>
              ) : (
                <span className="text-slate-200">
                  Showing <span className="font-semibold text-white">{properties.length}</span> of{' '}
                  <span className="font-semibold text-white">{formatIndianNumber(totalCount)}</span> properties
                </span>
              )}
            </p>
            
            {/* Applied Filters Chips */}
            <AppliedFilters filters={filters} updateFilters={updateFilters} />
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-4 bg-slate-900/95">
        {filters.viewType === 'map' ? (
          <div className="h-[600px] bg-slate-800/95 border-2 border-amber-300 rounded-lg flex items-center justify-center">
            <p className="text-slate-300">Map view coming soon</p>
          </div>
        ) : (
          <PropertyGrid
            properties={properties}
            viewType={filters.viewType}
            loading={loading}
            hasMore={hasMore}
            loadMore={loadMore}
          />
        )}
      </div>
    </div>
  );
}

