'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Buyer Dashboard Redirect
 * 
 * This route redirects to /my-dashboard which is the consolidated buyer dashboard.
 * All buyer dashboard functionality has been consolidated into /my-dashboard.
 */
export default function BuyerDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/my-dashboard');
  }, [router]);

  // Show minimal loading state during redirect
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center text-white">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mb-4"></div>
        <p className="text-lg text-slate-300">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
