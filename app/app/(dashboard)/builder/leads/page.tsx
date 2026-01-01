'use client'

import { LeadsList } from './_components/LeadsList'
import { BuilderPageWrapper } from '../_components/BuilderPageWrapper'
import { FilterProvider } from '@/contexts/FilterContext'

export const dynamic = 'force-dynamic'

export default function LeadsPage() {
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




