"use client"

import dynamic from 'next/dynamic'

// Dynamically import the revenue page component to avoid circular dependencies
const RevenuePage = dynamic(() => import('../../revenue/page'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
    </div>
  ),
})

interface RevenueSectionProps {
  onNavigate?: (section: string) => void
}

/**
 * Revenue Section - Wrapper for revenue analytics page
 * Uses section-based routing for smooth navigation
 */
export function RevenueSection({ onNavigate }: RevenueSectionProps) {
  return <RevenuePage />
}
