"use client"

import React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { BudgetPlanner } from '@/components/lead-capture/BudgetPlanner'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionWrapper } from '@/components/ui/SectionWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { DESIGN_TOKENS } from '@/lib/design-system'

export default function BudgetPlannerPage(){
  return (
    <PageWrapper>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/sitemap' },
        { label: 'Budget Planner' }
      ]} />
      
      <PageHeader
        title="Budget Planner"
        description="Plan your budget and find affordable properties in Tamil Nadu"
        className="text-center mb-8"
      />

      <SectionWrapper noPadding>
        <GlassCard variant="dark" glow border className="p-6 sm:p-8">
          <BudgetPlanner />
        </GlassCard>
      </SectionWrapper>
    </PageWrapper>
  )
}

