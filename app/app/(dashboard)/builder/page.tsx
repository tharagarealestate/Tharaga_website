'use client'

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { SupabaseProvider } from '@/contexts/SupabaseContext'
import { UnifiedSinglePageDashboard } from './_components/UnifiedSinglePageDashboard'

export default function BuilderDashboardPage() {
  return (
    <SupabaseProvider>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      }>
        <UnifiedSinglePageDashboard />
      </Suspense>
    </SupabaseProvider>
  )
}
