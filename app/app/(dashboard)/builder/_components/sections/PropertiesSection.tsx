"use client"

import dynamic from 'next/dynamic'
import { SectionLoader } from './SectionLoader'

interface PropertiesSectionProps {
  onNavigate?: (section: string) => void
}

const BuilderPropertiesPage = dynamic(() => import('../../properties/page').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <SectionLoader section="properties" />
})

import { SectionWrapper } from './SectionWrapper'

export function PropertiesSection({ onNavigate }: PropertiesSectionProps) {
  return (
    <SectionWrapper>
      <BuilderPropertiesPage />
    </SectionWrapper>
  )
}

