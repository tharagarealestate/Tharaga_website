// File: /app/app/(dashboard)/builder/properties/[propertyId]/portals/page.tsx
import { Suspense } from 'react';
import PartnerPortalDashboard from '@/components/portals/PartnerPortalDashboard';
import { Loader2 } from 'lucide-react';

export default function PropertyPortalsPage({
  params,
}: {
  params: { propertyId: string };
}) {
  const propertyId = params.propertyId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto relative z-10 space-y-4 sm:space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-2">
            Partner Portal Syndication
          </h1>
          <p className="text-primary-300 text-sm sm:text-base">
            Distribute your listings across major property portals
          </p>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center h-64 text-white">
            <Loader2 className="h-8 w-8 animate-spin text-primary-400 mr-3" />
            <span>Loading portal dashboard...</span>
          </div>
        }>
          <PartnerPortalDashboard propertyId={propertyId} />
        </Suspense>
      </div>
    </div>
  );
}







