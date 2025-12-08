'use client'

import dynamic from 'next/dynamic'

// Dynamically import the dashboard content with SSR disabled
const DashboardContent = dynamic(() => import('./DashboardContent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Loading your dashboard...</p>
      </div>
    </div>
  ),
})

export default function BuilderDashboardPage() {
  return <DashboardContent />
}
