"use client"

import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface SectionLoaderProps {
  section: string
  message?: string
}

const sectionMessages: Record<string, string> = {
  overview: 'Loading your dashboard...',
  leads: 'Loading leads...',
  pipeline: 'Loading pipeline...',
  properties: 'Loading properties...',
  'client-outreach': 'Loading messaging...',
  'behavior-analytics': 'Loading analytics...',
  settings: 'Loading settings...',
}

export function SectionLoader({ section, message }: SectionLoaderProps) {
  const displayMessage = message || sectionMessages[section] || 'Loading...'

  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" variant="gold" />
        <p className="text-gray-400 text-sm font-medium">{displayMessage}</p>
      </div>
    </div>
  )
}



