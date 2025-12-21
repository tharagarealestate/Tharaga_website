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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <div className="text-center text-white">
        <p className="text-lg">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
