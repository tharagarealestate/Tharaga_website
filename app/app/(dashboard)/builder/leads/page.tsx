'use client'

import { Suspense } from 'react'
import { LeadsManagementDashboard } from './_components/LeadsManagementDashboard'
import { BuilderPageWrapper } from '../_components/BuilderPageWrapper'
import { FilterProvider } from '@/contexts/FilterContext'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export const dynamic = 'force-dynamic'

function LeadsContent() {
  return (
    <FilterProvider>
      <BuilderPageWrapper
        title="AI-Powered Leads Management"
        description="Intelligently manage, prioritize, and convert leads with real-time AI insights and ZOHO CRM integration"
        noContainer={true}
      >
        <LeadsManagementDashboard />
      </BuilderPageWrapper>
    </FilterProvider>
  )
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <BuilderPageWrapper
          title="AI-Powered Leads Management"
          description="Intelligently manage, prioritize, and convert leads with real-time AI insights and ZOHO CRM integration"
          noContainer={true}
        >
          <div className="flex items-center justify-center min-h-[600px]">
            <LoadingSpinner />
          </div>
        </BuilderPageWrapper>
      }
    >
      <LeadsContent />
    </Suspense>
  )
}
