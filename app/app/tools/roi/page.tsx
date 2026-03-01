"use client"

import React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { ROICalculator } from '@/components/lead-capture/ROICalculator'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { DESIGN_TOKENS } from '@/lib/design-system'

export default function RoiPage(){
  return (
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/sitemap' },
        { label: 'ROI Calculator' }
      ]} />
      
      <PageHeader
        title="ROI Calculator"
        description="Calculate rental yield, appreciation, and total returns for your property investment"
        className="text-center mb-8"
      />

      <SectionWrapper noPadding>
        <GlassCard variant="dark" glow border className="p-6 sm:p-8">
          <ROICalculator />
        </GlassCard>
      </SectionWrapper>
    </PageWrapper>
  )
}
