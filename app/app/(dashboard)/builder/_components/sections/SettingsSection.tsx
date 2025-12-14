"use client"

import dynamic from 'next/dynamic'
import { SectionLoader } from './SectionLoader'

interface SettingsSectionProps {
  onNavigate?: (section: string) => void
}

const BuilderSettingsPage = dynamic(() => import('../../settings/page').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <SectionLoader section="settings" />
})

export function SettingsSection({ onNavigate }: SettingsSectionProps) {
  return (
    <div className="w-full">
      <BuilderSettingsPage />
    </div>
  )
}

