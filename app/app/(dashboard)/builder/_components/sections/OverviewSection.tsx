"use client"

import { UnifiedDashboard } from '../UnifiedDashboard'

interface OverviewSectionProps {
  onNavigate?: (section: string) => void
}

export function OverviewSection({ onNavigate }: OverviewSectionProps) {
  return <UnifiedDashboard onNavigate={onNavigate} />
}

