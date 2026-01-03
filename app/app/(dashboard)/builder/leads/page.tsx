'use client'

import { Suspense } from 'react'
import { LeadsList } from './_components/LeadsList'
import { BuilderPageWrapper } from '../_components/BuilderPageWrapper'
import { FilterProvider } from '@/contexts/FilterContext'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export const dynamic = 'force-dynamic'

function LeadsContent() {
  return (
    <FilterProvider>
      <BuilderPageWrapper
        title="Leads Management"
        description="View, filter, and manage all your leads in one place"
        noContainer={true}
      >
        <LeadsList showInlineFilters={true} />
      </BuilderPageWrapper>
    </FilterProvider>
  )
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <BuilderPageWrapper
          title="Leads Management"
          description="View, filter, and manage all your leads in one place"
          noContainer={true}
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner />
          </div>
        </BuilderPageWrapper>
      }
    >
      <LeadsContent />
    </Suspense>
  )
}

