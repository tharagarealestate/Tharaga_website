// File: /app/app/(dashboard)/builder/properties/[propertyId]/social/page.tsx
import { Suspense } from 'react';
import SocialMediaDashboard from '@/components/social/SocialMediaDashboard';
import { Loader2 } from 'lucide-react';

export default function PropertySocialMediaPage({
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
            Social Media Distribution
          </h1>
          <p className="text-primary-300 text-sm sm:text-base">
            Automatically share your listings across social platforms
          </p>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center h-64 text-white">
            <Loader2 className="h-8 w-8 animate-spin text-primary-400 mr-3" />
            <span>Loading social media dashboard...</span>
          </div>
        }>
          <SocialMediaDashboard propertyId={propertyId} />
        </Suspense>
      </div>
    </div>
  );
}



