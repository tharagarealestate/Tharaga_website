import { Suspense } from 'react';
import AIContentGenerator from '@/components/ai/AIContentGenerator';

export default function AIContentGeneratorPage({
  searchParams,
}: {
  searchParams: { propertyId?: string };
}) {
  const propertyId = searchParams.propertyId || '';

  if (!propertyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-2">Property ID required</p>
          <p className="text-white/60">Please provide a property ID to generate content</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AIContentGenerator propertyId={propertyId} />
    </Suspense>
  );
}

