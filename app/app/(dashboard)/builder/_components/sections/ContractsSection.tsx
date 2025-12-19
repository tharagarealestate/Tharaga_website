"use client"

import { SectionWrapper } from './SectionWrapper'
import { ContractsManager } from '../ultra-automation/components/ContractsManager'
import { useDemoMode } from '../DemoDataProvider'

interface ContractsSectionProps {
  onNavigate?: (section: string) => void
}

export function ContractsSection({ onNavigate }: ContractsSectionProps) {
  const { builderId } = useDemoMode()
  
  return (
    <SectionWrapper>
      <div className="w-full max-w-7xl mx-auto space-y-6 py-6">
        <header className="space-y-2">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
            Contracts
          </h1>
          <p className="text-base text-blue-100/80 sm:text-lg max-w-2xl">
            Manage contracts, track signatures, and monitor contract status with automatic alerts.
          </p>
        </header>
        <ContractsManager builderId={builderId || undefined} />
      </div>
    </SectionWrapper>
  )
}

