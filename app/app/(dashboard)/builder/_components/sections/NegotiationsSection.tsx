"use client"

import { motion } from 'framer-motion'
import { SectionWrapper } from './SectionWrapper'
import { NegotiationsDashboard } from '../ultra-automation/components/NegotiationsDashboard'
import { useDemoMode } from '../DemoDataProvider'

interface NegotiationsSectionProps {
  onNavigate?: (section: string) => void
}

export function NegotiationsSection({ onNavigate }: NegotiationsSectionProps) {
  const { builderId } = useDemoMode()
  
  return (
    <div className="space-y-6">
      {/* Header - Design System Typography */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Negotiations</h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
          Track price negotiations, analyze strategies, and get AI-powered recommendations for successful deals.
        </p>
      </motion.div>

      {/* Content - Design System Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 sm:p-8">
          <NegotiationsDashboard builderId={builderId || undefined} />
        </div>
      </motion.div>
    </div>
  )
}

