"use client"

import { motion } from 'framer-motion'
import { SectionWrapper } from './SectionWrapper'
import { ViewingsCalendar } from '../ultra-automation/components/ViewingsCalendar'
import { useDemoMode } from '../DemoDataProvider'

interface ViewingsSectionProps {
  onNavigate?: (section: string) => void
}

export function ViewingsSection({ onNavigate }: ViewingsSectionProps) {
  const { builderId } = useDemoMode()
  
  return (
    <div className="space-y-6">
      {/* Header - Design System Typography */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Property Viewings</h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
            Manage scheduled property viewings, track reminders, and monitor viewing completion status.
          </p>
      </motion.div>

      {/* Content - Design System Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 sm:p-8">
        <ViewingsCalendar builderId={builderId || undefined} />
      </div>
      </motion.div>
    </div>
  )
}

