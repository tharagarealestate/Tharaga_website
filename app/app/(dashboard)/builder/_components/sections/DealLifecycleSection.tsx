"use client"

import { motion } from 'framer-motion'
import { SectionWrapper } from './SectionWrapper'
import { DealLifecycleTracker } from '../ultra-automation/components/DealLifecycleTracker'
import { useDemoMode } from '../DemoDataProvider'

interface DealLifecycleSectionProps {
  onNavigate?: (section: string) => void
}

export function DealLifecycleSection({ onNavigate }: DealLifecycleSectionProps) {
  const { builderId } = useDemoMode()
  
  return (
    <div className="space-y-6">
      {/* Header - Design System Typography */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Deal Lifecycle</h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
          Track deals through all stages, detect stalling, and optimize conversion with real-time analytics.
        </p>
      </motion.div>

      {/* Content - Design System Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 sm:p-8">
          <DealLifecycleTracker builderId={builderId || undefined} />
        </div>
      </motion.div>
    </div>
  )
}

