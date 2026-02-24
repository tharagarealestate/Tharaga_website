"use client"

import { useState, useEffect, useRef, Suspense, lazy, memo } from 'react'
import type React from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// Lazy load section components for code splitting
const OverviewSection = lazy(() => import('./sections/OverviewSection').then(m => ({ default: m.OverviewSection })))
const LeadsPipelineSection = lazy(() => import('./sections/LeadsPipelineSection').then(m => ({ default: m.LeadsPipelineSection })))
const PropertiesSection = lazy(() => import('./sections/PropertiesSection').then(m => ({ default: m.PropertiesSection })))
const MarketingSection = lazy(() => import('./sections/MarketingSection').then(m => ({ default: m.MarketingSection })))
const AutomationsSection = lazy(() => import('./sections/AutomationsSection').then(m => ({ default: m.AutomationsSection })))
const AnalyticsSection = lazy(() => import('./sections/AnalyticsSection').then(m => ({ default: m.AnalyticsSection })))
const RevenueSection = lazy(() => import('./sections/RevenueSection').then(m => ({ default: m.RevenueSection })))
const BillingSection = lazy(() => import('./sections/BillingSection').then(m => ({ default: m.BillingSection })))
const SettingsSection = lazy(() => import('./sections/SettingsSection').then(m => ({ default: m.SettingsSection })))

import { ErrorBoundary } from './ErrorBoundary'

function SectionFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-amber-400 rounded-full animate-spin" />
        <span className="text-sm text-zinc-500">Loading...</span>
      </div>
    </div>
  )
}

interface UnifiedSinglePageDashboardProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

function UnifiedSinglePageDashboardComponent({ activeSection, onSectionChange }: UnifiedSinglePageDashboardProps) {
  const onSectionChangeRef = useRef(onSectionChange)
  onSectionChangeRef.current = onSectionChange

  // Listen for section changes from navigation
  useEffect(() => {
    const handleSectionChangeEvent = (event: CustomEvent<{ section: string }>) => {
      if (event.detail?.section && event.detail.section !== activeSection) {
        onSectionChangeRef.current(event.detail.section)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    window.addEventListener('dashboard-section-change', handleSectionChangeEvent as EventListener)
    return () => {
      window.removeEventListener('dashboard-section-change', handleSectionChangeEvent as EventListener)
    }
  }, [activeSection])

  // Scroll to top when section changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }
  }, [activeSection])

  const sectionComponents: Record<string, React.ComponentType<{ onNavigate?: (section: string) => void }>> = {
    overview: OverviewSection,
    leads: LeadsPipelineSection,
    properties: PropertiesSection,
    marketing: MarketingSection,
    automations: AutomationsSection,
    analytics: AnalyticsSection,
    revenue: RevenueSection,
    billing: BillingSection,
    settings: SettingsSection,
  }

  const ActiveComponent = sectionComponents[activeSection] || OverviewSection

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.15, ease: 'easeOut' }
          }}
          exit={{
            opacity: 0,
            y: -8,
            transition: { duration: 0.1, ease: 'easeIn' }
          }}
          className="w-full"
        >
          <ErrorBoundary>
            <Suspense fallback={<SectionFallback />}>
              <ActiveComponent onNavigate={onSectionChangeRef.current} />
            </Suspense>
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export const UnifiedSinglePageDashboard = memo(UnifiedSinglePageDashboardComponent)
