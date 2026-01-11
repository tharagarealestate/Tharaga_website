"use client"

import { motion } from 'framer-motion'
import { SectionWrapper } from './SectionWrapper'
import dynamic from 'next/dynamic'
import { SectionLoader } from './SectionLoader'
import { getSectionClassName } from '../design-system'

interface BehaviorAnalyticsSectionProps {
  onNavigate?: (section: string) => void
}

const BehaviorTrackingPage = dynamic(() => import('../../../behavior-tracking/page').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <SectionLoader section="behavior-analytics" />
})

export function BehaviorAnalyticsSection({ onNavigate }: BehaviorAnalyticsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Header - Design System Typography */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Behavior Analytics</h1>
        <p className="text-slate-300 text-base sm:text-lg">Track and analyze user behavior patterns</p>
      </motion.div>

      {/* Content - Design System Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={getSectionClassName()}
      >
        <div className="p-6 sm:p-8">
          <BehaviorTrackingPage />
        </div>
      </motion.div>
    </div>
  )
}

