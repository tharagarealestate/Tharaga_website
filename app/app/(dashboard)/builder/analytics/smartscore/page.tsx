import { Suspense } from 'react';
import SmartScoreAnalyticsDashboard from '@/components/leads/SmartScoreAnalyticsDashboard';
import LeadTierManager from '@/components/leads/LeadTierManager';

export default function SmartScoreAnalyticsPage({
  searchParams,
}: {
  searchParams: { period?: '7d' | '30d' | '90d' | '1y' };
}) {
  const period = searchParams.period || '30d';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden p-6">
      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        <Suspense fallback={
          <div className="text-white">Loading analytics...</div>
        }>
          <SmartScoreAnalyticsDashboard period={period} variant="full" />
          <LeadTierManager variant="full" />
        </Suspense>
      </div>
    </div>
  );
}


