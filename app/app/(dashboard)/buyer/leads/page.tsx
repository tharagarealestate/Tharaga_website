'use client';

import { LeadTrackingDashboard } from '@/components/buyer/lead-tracking-dashboard';

export default function BuyerLeadsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">My Inquiries</h1>
          <p className="mt-2 text-lg text-white/70">
            Track the status of all your property inquiries and stay updated on builder responses
          </p>
        </div>
        <LeadTrackingDashboard />
      </div>
    </div>
  );
}



