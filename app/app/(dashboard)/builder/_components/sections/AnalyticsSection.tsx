"use client"

import dynamic from 'next/dynamic'

// Dynamically import the analytics page component to avoid circular dependencies
const AnalyticsPage = dynamic(() => import('../../analytics/page'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
    </div>
  ),
})

interface AnalyticsSectionProps {
  onNavigate?: (section: string) => void
}

/**
 * Analytics Section - Wrapper for analytics dashboard page
 * Uses section-based routing for smooth navigation
 */
export function AnalyticsSection({ onNavigate }: AnalyticsSectionProps) {
  return <AnalyticsPage />
}
