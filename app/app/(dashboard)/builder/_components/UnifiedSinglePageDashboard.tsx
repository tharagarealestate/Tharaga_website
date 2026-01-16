"use client"

import { useState, useEffect, useRef, Suspense, lazy, memo } from 'react'
import type React from 'react'
import { cn } from '@/lib/utils'

import { motion, AnimatePresence } from 'framer-motion'

// Lazy load section components for better initial performance
const OverviewSection = lazy(() => import('./sections/OverviewSection').then(m => ({ default: m.OverviewSection })))
const LeadsSection = lazy(() => import('./sections/LeadsSection').then(m => ({ default: m.LeadsSection })))
const PipelineSection = lazy(() => import('./sections/PipelineSection').then(m => ({ default: m.PipelineSection })))
const PropertiesSection = lazy(() => import('./sections/PropertiesSection').then(m => ({ default: m.PropertiesSection })))
const ClientOutreachSection = lazy(() => import('./sections/ClientOutreachSection').then(m => ({ default: m.ClientOutreachSection })))
const BehaviorAnalyticsSection = lazy(() => import('./sections/BehaviorAnalyticsSection').then(m => ({ default: m.BehaviorAnalyticsSection })))
const ViewingsSection = lazy(() => import('./sections/ViewingsSection').then(m => ({ default: m.ViewingsSection })))
const NegotiationsSection = lazy(() => import('./sections/NegotiationsSection').then(m => ({ default: m.NegotiationsSection })))
const ContractsSection = lazy(() => import('./sections/ContractsSection').then(m => ({ default: m.ContractsSection })))
const DealLifecycleSection = lazy(() => import('./sections/DealLifecycleSection').then(m => ({ default: m.DealLifecycleSection })))
const UltraAutomationAnalyticsSection = lazy(() => import('./sections/UltraAutomationAnalyticsSection').then(m => ({ default: m.UltraAutomationAnalyticsSection })))
import { SectionLoader } from './sections/SectionLoader'
import { ErrorBoundary } from './ErrorBoundary'

interface UnifiedSinglePageDashboardProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

function UnifiedSinglePageDashboardComponent({ activeSection, onSectionChange }: UnifiedSinglePageDashboardProps) {
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

  // Scroll to top when section changes (defer to avoid blocking render)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }
  }, [activeSection])

  // Sync with URL parameter on mount only - parent handles URL sync
  // Removed to prevent conflicts with parent component's URL handling

  const ContactsSection = lazy(() => import('./sections/ContactsSection').then(m => ({ default: m.ContactsSection })))

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
    contacts: ContactsSection,
  }

  const ActiveComponent = sectionComponents[activeSection] || OverviewSection

  return (
    <div className="relative w-full bg-transparent">
      {/* Background is handled by layout.tsx - no duplicate background here */}

      {/* Main Content Area with Advanced AI Transitions */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 pt-0 pb-6 lg:pb-8 bg-transparent">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.2,
                ease: 'easeOut', // Fast, smooth transition
              }
            }}
            exit={{ 
              opacity: 0, 
              y: -20, 
              scale: 0.98,
              filter: 'blur(2px)',
              transition: {
                duration: 0.3,
                ease: [0.4, 0, 1, 1],
              }
            }}
            onAnimationStart={() => {
              // Smooth scroll to top during transition
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="w-full"
          >
            {/* Subtle glow effect on active section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute -inset-4 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 rounded-2xl blur-2xl pointer-events-none"
            />
            
            {/* Content with fade-in stagger */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative z-10"
            >
              {/* Non-blocking Suspense - renders immediately with fallback */}
              <ErrorBoundary>
                <Suspense fallback={<SectionLoader section={activeSection} />}>
                  <ActiveComponent onNavigate={(section: string) => onSectionChange(section)} />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
export const UnifiedSinglePageDashboard = memo(UnifiedSinglePageDashboardComponent)

