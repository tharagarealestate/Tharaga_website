'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PropertyFilters } from '../page';
import { formatPriceRange } from '@/lib/utils/currency';

interface AppliedFiltersProps {
  filters: PropertyFilters;
  updateFilters: (filters: Partial<PropertyFilters>) => void;
}

export default function AppliedFilters({ filters, updateFilters }: AppliedFiltersProps) {
  const appliedFilters: Array<{ key: string; label: string; onRemove: () => void }> = [];

  // City filters
  filters.city.forEach((city) => {
    appliedFilters.push({
      key: `city-${city}`,
      label: city,
      onRemove: () => {
        updateFilters({ city: filters.city.filter((c) => c !== city) });
      },
    });
  });

  // Locality filters
  filters.locality.forEach((locality) => {
    appliedFilters.push({
      key: `locality-${locality}`,
      label: locality,
      onRemove: () => {
        updateFilters({ locality: filters.locality.filter((l) => l !== locality) });
      },
    });
  });

  // Price filters
  if (filters.priceMin > 0 || filters.priceMax < 200000000) {
    appliedFilters.push({
      key: 'price',
      label: formatPriceRange(filters.priceMin, filters.priceMax),
      onRemove: () => {
        updateFilters({ priceMin: 0, priceMax: 200000000 });
      },
    });
  }

  // Property type filters
  filters.propertyType.forEach((type) => {
    appliedFilters.push({
      key: `type-${type}`,
      label: type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      onRemove: () => {
        updateFilters({ propertyType: filters.propertyType.filter((t) => t !== type) });
      },
    });
  });

  // BHK filters
  filters.bhk.forEach((bhk) => {
    appliedFilters.push({
      key: `bhk-${bhk}`,
      label: `${bhk} BHK`,
      onRemove: () => {
        updateFilters({ bhk: filters.bhk.filter((b) => b !== bhk) });
      },
    });
  });

  // Furnished status
  if (filters.furnishedStatus[0] !== 'any') {
    appliedFilters.push({
      key: 'furnished',
      label: filters.furnishedStatus[0].replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      onRemove: () => {
        updateFilters({ furnishedStatus: ['any'] });
      },
    });
  }

  // Facing
  if (filters.facing[0] !== 'any') {
    appliedFilters.push({
      key: 'facing',
      label: `${filters.facing[0]} Facing`,
      onRemove: () => {
        updateFilters({ facing: ['any'] });
      },
    });
  }

  // Area filters
  if (filters.areaMin > 0 || filters.areaMax < 10000) {
    appliedFilters.push({
      key: 'area',
      label: `${filters.areaMin} - ${filters.areaMax} sqft`,
      onRemove: () => {
        updateFilters({ areaMin: 0, areaMax: 10000 });
      },
    });
  }

  // Near metro
  if (filters.nearMetro) {
    appliedFilters.push({
      key: 'metro',
      label: `Near Metro (${filters.metroDistance}min)`,
      onRemove: () => {
        updateFilters({ nearMetro: false });
      },
    });
  }

  if (appliedFilters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {appliedFilters.map((filter) => (
        <div
          key={filter.key}
          className="group pl-3 pr-2 py-2 bg-white/70 backdrop-blur-md border border-indigo-200/50 hover:border-indigo-300 hover:bg-white/90 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 rounded-full"
        >
          <span className="text-sm font-medium text-gray-700">{filter.label}</span>
          <button
            onClick={filter.onRemove}
            className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center hover:from-red-500 hover:to-pink-600 shadow-sm transition-all duration-200 group-hover:scale-110"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
}

