"use client"

import { useState, useEffect, useMemo, Suspense } from 'react'
import type React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

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

  return (
    <div className="relative min-h-screen w-full">
      {/* Layered Background System */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Layer 1: Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#071422]" />
        
        {/* Layer 2: Atmospheric Orbs */}
        <div 
          className="absolute top-20 left-10 w-[400px] h-[400px] bg-[#D4AF37] opacity-25 blur-[120px] rounded-full animate-pulse" 
          style={{ animationDuration: '8s' }} 
        />
        <div 
          className="absolute bottom-20 right-10 w-[350px] h-[350px] bg-[#10B981] opacity-15 blur-[100px] rounded-full animate-pulse" 
          style={{ animationDuration: '12s', animationDelay: '1s' }} 
        />
        <div 
          className="absolute top-40 right-20 w-[300px] h-[300px] bg-[#1e40af] opacity-20 blur-[80px] rounded-full animate-pulse" 
          style={{ animationDuration: '10s', animationDelay: '2s' }} 
        />
        
        {/* Layer 3: Subtle Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} 
        />
      </div>

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
            <Suspense fallback={<SectionLoader section={activeSection} />}>
              <ActiveComponent onNavigate={(section: string) => onSectionChange(section)} />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

