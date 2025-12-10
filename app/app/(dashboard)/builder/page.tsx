'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Dynamically import dashboard with no SSR
const BuilderDashboardClient = dynamic(
  () => import('./BuilderDashboardClient'),
  {
    ssr: false,
    loading: () => <DashboardLoader />
  }
)

function DashboardLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/90 text-lg font-medium">Loading Builder Dashboard...</p>
        <p className="text-white/60 text-sm">Initializing your workspace</p>
      </div>
    </div>
  )
}

export default function BuilderDashboardPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<DashboardLoader />}>
        <BuilderDashboardClient />
      </Suspense>
    </ErrorBoundary>
  )
}
