'use client';

import { Property } from '@/types/property';
import { PropertyCard } from './PropertyCard';
import { MobilePropertyCard } from '@/components/mobile/MobilePropertyCard';

interface PropertyGridProps {
  properties: Property[];
  layout?: 'grid' | 'list';
  useMobileCard?: boolean;
}

export function PropertyGrid({ properties, layout = 'grid', useMobileCard }: PropertyGridProps) {
  // Use mobile card on mobile devices by default
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const shouldUseMobile = useMobileCard !== undefined ? useMobileCard : isMobile;

  if (layout === 'list') {
    return (
      <div className="space-y-6">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} layout="list" />
        ))}
      </div>
    );
  }

  // Use mobile-optimized cards on mobile
  if (shouldUseMobile) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
        {properties.map((property) => (
          <MobilePropertyCard key={property.id} property={property} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}

