'use client'

import { LeadsList } from './_components/LeadsList'
import { BuilderPageWrapper } from '../_components/BuilderPageWrapper'

export default function LeadsPage() {
  return (
    <BuilderPageWrapper
      title="Leads Management"
      description="View, filter, and manage all your leads in one place"
      noContainer={true}
    >
      <LeadsList showInlineFilters={true} />
    </BuilderPageWrapper>
  )
}



