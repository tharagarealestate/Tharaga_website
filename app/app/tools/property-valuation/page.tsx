"use client"

import React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { PropertyValuation } from '@/components/lead-capture/PropertyValuation'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { DESIGN_TOKENS } from '@/lib/design-system'

export default function PropertyValuationPage(){
  return (
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/sitemap' },
        { label: 'Property Valuation' }
      ]} />
      
      <PageHeader
        title="Property Valuation"
        description="Get accurate property valuation with RERA integration and market analysis"
        className="text-center mb-8"
      />

      <SectionWrapper noPadding>
        <GlassCard variant="dark" glow border className="p-6 sm:p-8">
          <PropertyValuation />
        </GlassCard>
      </SectionWrapper>
    </PageWrapper>
  )
}

