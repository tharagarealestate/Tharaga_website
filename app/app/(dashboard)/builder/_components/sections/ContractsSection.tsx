"use client"

import { motion } from 'framer-motion'
import { SectionWrapper } from './SectionWrapper'
import { ContractsManager } from '../ultra-automation/components/ContractsManager'
import { useDemoMode } from '../DemoDataProvider'
import { getSectionClassName } from '../design-system'

interface ContractsSectionProps {
  onNavigate?: (section: string) => void
}

export function ContractsSection({ onNavigate }: ContractsSectionProps) {
  const { builderId } = useDemoMode()
  
  return (
    <div className="space-y-6">
      {/* Header - Design System Typography */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Contracts</h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
          Manage contracts, track signatures, and monitor contract status with automatic alerts.
        </p>
      </motion.div>

      {/* Content - Design System Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={getSectionClassName()}
      >
        <div className="p-6 sm:p-8">
          <ContractsManager builderId={builderId || undefined} />
        </div>
      </motion.div>
    </div>
  )
}

