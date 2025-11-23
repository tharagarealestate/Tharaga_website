import { Suspense } from 'react';
import SmartScoreCard from '@/components/leads/SmartScoreCard';
import SmartScoreHistory from '@/components/leads/SmartScoreHistory';

export default function SmartScorePage({
  params,
  searchParams,
}: {
  params: { leadId: string };
  searchParams: { days?: string };
}) {
  const leadId = params.leadId;
  const days = searchParams.days ? parseInt(searchParams.days, 10) : 30;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden p-6">
      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        <Suspense fallback={
          <div className="text-white">Loading SmartScore...</div>
        }>
          <SmartScoreCard leadId={leadId} variant="highlighted" />
          <SmartScoreHistory leadId={leadId} days={days} />
        </Suspense>
      </div>
    </div>
  );
}


