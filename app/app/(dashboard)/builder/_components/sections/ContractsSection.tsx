"use client"

import { ContractsManager } from '../ultra-automation/components/ContractsManager'
import { useDemoMode } from '../DemoDataProvider'
import { BuilderPageWrapper } from '../BuilderPageWrapper'
import { FileText } from 'lucide-react'

interface ContractsSectionProps {
  onNavigate?: (section: string) => void
}

export function ContractsSection({ onNavigate }: ContractsSectionProps) {
  const { builderId } = useDemoMode()
  
  return (
    <BuilderPageWrapper 
      title="Contracts" 
      description="Manage contracts, track signatures, and monitor contract status with automatic alerts"
      noContainer
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8">
            <ContractsManager builderId={builderId || undefined} />
          </div>
        </div>
      </div>
    </BuilderPageWrapper>
  )
}

