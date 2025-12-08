"use client"

import { useState, useEffect, useMemo, Suspense } from 'react'
import type React from 'react'
import { cn } from '@/lib/utils'

// Conditionally import framer-motion only on client
let motion: any = null
let AnimatePresence: any = null

if (typeof window !== 'undefined') {
  try {
    const framerMotion = require('framer-motion')
    motion = framerMotion.motion
    AnimatePresence = framerMotion.AnimatePresence
  } catch (e) {
    console.warn('framer-motion not available, using fallback')
  }
}

// Fallback component when framer-motion is not available
const MotionDiv = ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>
const FallbackAnimatePresence = ({ children }: any) => <>{children}</>

// Import section components
import { OverviewSection } from './sections/OverviewSection'
import { LeadsSection } from './sections/LeadsSection'
import { PipelineSection } from './sections/PipelineSection'
import { PropertiesSection } from './sections/PropertiesSection'
import { ClientOutreachSection } from './sections/ClientOutreachSection'
import { BehaviorAnalyticsSection } from './sections/BehaviorAnalyticsSection'
import { SettingsSection } from './sections/SettingsSection'
import { ViewingsSection } from './sections/ViewingsSection'
import { NegotiationsSection } from './sections/NegotiationsSection'
import { ContractsSection } from './sections/ContractsSection'
import { DealLifecycleSection } from './sections/DealLifecycleSection'
import { UltraAutomationAnalyticsSection } from './sections/UltraAutomationAnalyticsSection'
import { SectionLoader } from './sections/SectionLoader'

interface UnifiedSinglePageDashboardProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function UnifiedSinglePageDashboard({ activeSection, onSectionChange }: UnifiedSinglePageDashboardProps) {
  // Listen for section changes from navigation
  useEffect(() => {
    const handleSectionChangeEvent = (event: CustomEvent<{ section: string }>) => {
      if (event.detail?.section && event.detail.section !== activeSection) {
        onSectionChange(event.detail.section)
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    window.addEventListener('dashboard-section-change', handleSectionChangeEvent as EventListener)
    return () => {
      window.removeEventListener('dashboard-section-change', handleSectionChangeEvent as EventListener)
    }
  }, [activeSection, onSectionChange])

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeSection])

  // Sync with URL parameter on mount and when URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sectionParam = urlParams.get('section') || 'overview'
    if (sectionParam !== activeSection) {
      onSectionChange(sectionParam)
    }
  }, [])

  const sectionComponents: Record<string, React.ComponentType<{ onNavigate?: (section: string) => void }>> = {
    overview: OverviewSection,
    leads: LeadsSection,
    pipeline: PipelineSection,
    properties: PropertiesSection,
    'client-outreach': ClientOutreachSection,
    'behavior-analytics': BehaviorAnalyticsSection,
    viewings: ViewingsSection,
    negotiations: NegotiationsSection,
    contracts: ContractsSection,
    'deal-lifecycle': DealLifecycleSection,
    'ultra-automation-analytics': UltraAutomationAnalyticsSection,
    settings: SettingsSection,
  }

  const ActiveComponent = sectionComponents[activeSection] || OverviewSection

  const MotionComponent = motion || MotionDiv
  const AnimatePresenceComponent = AnimatePresence || FallbackAnimatePresence

  return (
    <div className="relative w-full">
      {/* Background is handled by layout.tsx - no duplicate background here */}

      {/* Main Content Area with Smooth Transitions */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <AnimatePresenceComponent mode="wait">
          <MotionComponent
            key={activeSection}
            initial={motion ? { opacity: 0, y: 20, scale: 0.98 } : undefined}
            animate={motion ? { opacity: 1, y: 0, scale: 1 } : undefined}
            exit={motion ? { opacity: 0, y: -20, scale: 0.98 } : undefined}
            transition={motion ? {
              duration: 0.35,
              ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for smooth feel
            } : undefined}
            onAnimationStart={motion ? () => {
              // Ensure smooth scroll during transition
              window.scrollTo({ top: 0, behavior: 'smooth' })
            } : undefined}
            className="w-full"
          >
            <Suspense fallback={<SectionLoader section={activeSection} />}>
              <ActiveComponent onNavigate={(section: string) => onSectionChange(section)} />
            </Suspense>
          </MotionComponent>
        </AnimatePresenceComponent>
      </div>
    </div>
  )
}

