"use client"

import dynamic from 'next/dynamic'
import { SectionLoader } from './SectionLoader'
import { BuilderPageWrapper } from '../BuilderPageWrapper'
import { TrendingUp } from 'lucide-react'

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
    <BuilderPageWrapper 
      title="Lead Pipeline" 
      description="Visualize and manage your leads through the sales pipeline"
      noContainer
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8">
            <div className="w-full max-w-[1920px] mx-auto">
              <LeadPipelineKanban />
            </div>
          </div>
        </div>
      </div>
    </BuilderPageWrapper>
  )
}

