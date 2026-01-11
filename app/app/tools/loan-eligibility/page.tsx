"use client"

import React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { LoanEligibilityCalculator } from '@/components/lead-capture/LoanEligibilityCalculator'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { DESIGN_TOKENS } from '@/lib/design-system'

export default function LoanEligibilityPage(){
  return (
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/sitemap' },
        { label: 'Loan Eligibility Calculator' }
      ]} />
      
      <PageHeader
        title="Loan Eligibility Calculator"
        description="Check your home loan eligibility with Tamil Nadu banks and PMAY schemes"
        className="text-center mb-8"
      />

      <SectionWrapper noPadding>
        <GlassCard variant="dark" glow border className="p-6 sm:p-8">
          <LoanEligibilityCalculator />
        </GlassCard>
      </SectionWrapper>
    </PageWrapper>
  )
}

