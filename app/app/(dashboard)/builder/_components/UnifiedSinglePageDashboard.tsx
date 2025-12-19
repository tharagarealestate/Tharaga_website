"use client"

import { useState, useEffect, useRef, Suspense } from 'react'
import type React from 'react'
import { cn } from '@/lib/utils'

import { motion, AnimatePresence } from 'framer-motion'

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
import { ErrorBoundary } from './ErrorBoundary'

interface UnifiedSinglePageDashboardProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function UnifiedSinglePageDashboard({ activeSection, onSectionChange }: UnifiedSinglePageDashboardProps) {
  // Use ref to store the latest onSectionChange to avoid dependency issues
  const onSectionChangeRef = useRef(onSectionChange)
  onSectionChangeRef.current = onSectionChange

  // Listen for section changes from navigation
  useEffect(() => {
    const handleSectionChangeEvent = (event: CustomEvent<{ section: string }>) => {
      if (event.detail?.section && event.detail.section !== activeSection) {
        onSectionChangeRef.current(event.detail.section)
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    window.addEventListener('dashboard-section-change', handleSectionChangeEvent as EventListener)
    return () => {
      window.removeEventListener('dashboard-section-change', handleSectionChangeEvent as EventListener)
    }
  }, [activeSection]) // Only depend on activeSection, not onSectionChange

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeSection])

  // Sync with URL parameter on mount only - parent handles URL sync
  // Removed to prevent conflicts with parent component's URL handling

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

  return (
    <div className="relative w-full">
      {/* Background is handled by layout.tsx - no duplicate background here */}

      {/* Main Content Area with Smooth Transitions */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{
              duration: 0.35,
              ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for smooth feel
            }}
            onAnimationStart={() => {
              // Ensure smooth scroll during transition
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="w-full"
          >
            {/* Non-blocking Suspense - renders immediately with fallback */}
            <ErrorBoundary>
              <Suspense fallback={<SectionLoader section={activeSection} />}>
                <ActiveComponent onNavigate={(section: string) => onSectionChange(section)} />
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

