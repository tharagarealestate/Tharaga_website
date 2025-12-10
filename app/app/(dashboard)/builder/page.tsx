'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the dashboard content with SSR disabled to prevent build-time rendering issues
const BuilderDashboardContent = dynamic(
  () => import('./BuilderDashboardClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }
)

export default function BuilderDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <BuilderDashboardContent />
    </Suspense>
  )
}
