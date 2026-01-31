"use client"

import React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { EMICalculator } from '@/components/lead-capture/EMICalculator'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { DESIGN_TOKENS } from '@/lib/design-system'

export default function EMIPage(){
  return (
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/sitemap' },
        { label: 'EMI Calculator' }
      ]} />
      
      <PageHeader
        title="EMI Calculator"
        description="Calculate home loan EMI, total interest, and amortization schedule"
        className="text-center mb-8"
      />

      <SectionWrapper noPadding>
        <GlassCard variant="dark" glow border className="p-6 sm:p-8">
          <EMICalculator />
        </GlassCard>
      </SectionWrapper>
    </PageWrapper>
  )
}

