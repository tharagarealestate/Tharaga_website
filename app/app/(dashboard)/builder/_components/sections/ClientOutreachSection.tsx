"use client"

import dynamic from 'next/dynamic'
import { SectionLoader } from './SectionLoader'

interface ClientOutreachSectionProps {
  onNavigate?: (section: string) => void
}

const MessagingPage = dynamic(() => import('../../messaging/page').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <SectionLoader section="client-outreach" />
})

export function ClientOutreachSection({ onNavigate }: ClientOutreachSectionProps) {
  return (
    <div className="w-full">
      <MessagingPage />
    </div>
  )
}

