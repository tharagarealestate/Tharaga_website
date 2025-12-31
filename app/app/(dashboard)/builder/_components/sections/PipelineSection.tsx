"use client"

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { SectionLoader } from './SectionLoader'

interface PipelineSectionProps {
  onNavigate?: (section: string) => void
}

// Dynamically import the pipeline component to avoid SSR issues
const LeadPipelineKanban = dynamic(() => import('../../leads/pipeline/_components/LeadPipelineKanban').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <SectionLoader section="pipeline" />
})

export function PipelineSection({ onNavigate }: PipelineSectionProps) {
  return (
    <div className="space-y-6">
      {/* Header - Design System Typography */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Lead Pipeline</h1>
        <p className="text-slate-300 text-base sm:text-lg">Visualize and manage your leads through the sales pipeline</p>
      </motion.div>

      {/* Pipeline Content - Design System Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 sm:p-8">
          <div className="w-full max-w-[1920px] mx-auto">
            <LeadPipelineKanban />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

