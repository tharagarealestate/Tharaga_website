"use client"

import React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { NeighborhoodFinder } from '@/components/lead-capture/NeighborhoodFinder'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { DESIGN_TOKENS } from '@/lib/design-system'

export default function NeighborhoodFinderPage(){
  return (
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/sitemap' },
        { label: 'Neighborhood Finder' }
      ]} />
      
      <PageHeader
        title="Neighborhood Finder"
        description="Find the perfect neighborhood with Tamil Nadu-specific amenities and insights"
        className="text-center mb-8"
      />

      <SectionWrapper noPadding>
        <GlassCard variant="dark" glow border className="p-6 sm:p-8">
          <NeighborhoodFinder />
        </GlassCard>
      </SectionWrapper>
    </PageWrapper>
  )
}

