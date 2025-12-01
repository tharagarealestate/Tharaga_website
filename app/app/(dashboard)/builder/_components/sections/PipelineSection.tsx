"use client"

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
    <div className="w-full max-w-[1920px] mx-auto">
      <LeadPipelineKanban />
    </div>
  )
}

