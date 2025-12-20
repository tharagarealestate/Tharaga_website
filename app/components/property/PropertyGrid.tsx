'use client';

import { Property } from '@/types/property';
import { PropertyCard } from './PropertyCard';

interface PropertyGridProps {
  properties: Property[];
  layout?: 'grid' | 'list';
}

export function PropertyGrid({ properties, layout = 'grid' }: PropertyGridProps) {
  if (layout === 'list') {
    return (
      <div className="space-y-6">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} layout="list" />
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

