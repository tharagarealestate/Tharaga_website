'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import PropertyCard from './PropertyCard';

interface PropertyGridProps {
  properties: any[];
  viewType: 'list' | 'grid';
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

export default function PropertyGrid({
  properties,
  viewType,
  loading,
  hasMore,
  loadMore,
}: PropertyGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMore]);

  if (properties.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold mb-2 text-white">No properties found</h3>
        <p className="text-slate-300 mb-4">Try adjusting your filters to see more results</p>
      </div>
    );
  }

  return (
    <div>
      {/* Property Grid/List */}
      <div
        className={
          viewType === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6'
            : 'flex flex-col gap-6'
        }
      >
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            viewType={viewType}
          />
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-amber-300" />
        </div>
      )}

      {/* Intersection Observer Target */}
      {hasMore && !loading && (
        <div ref={observerTarget} className="h-20" />
      )}

      {/* End of Results */}
      {!hasMore && properties.length > 0 && (
        <div className="text-center py-8 text-slate-400">
          You've reached the end of results
        </div>
      )}
    </div>
  );
}

