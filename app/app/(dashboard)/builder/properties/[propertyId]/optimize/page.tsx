import { Suspense } from 'react';
import OptimizationDashboard from '@/components/builder/OptimizationDashboard';
import { Loader2 } from 'lucide-react';

export default function OptimizationPage({
  params,
}: {
  params: { propertyId: string };
}) {
  const propertyId = params.propertyId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto relative z-10 space-y-4 sm:space-y-6">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64 text-white">
            <Loader2 className="h-8 w-8 animate-spin text-primary-400 mr-3" />
            <span>Loading optimization dashboard...</span>
          </div>
        }>
          <OptimizationDashboard propertyId={propertyId} />
        </Suspense>
      </div>
    </div>
  );
}

