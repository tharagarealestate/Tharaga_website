"use client"

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

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
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#D4AF37]/20 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          </div>
        </div>
        <p className="text-gray-400 text-sm font-medium">{displayMessage}</p>
        <div className="flex gap-1 mt-2">
          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  )
}



