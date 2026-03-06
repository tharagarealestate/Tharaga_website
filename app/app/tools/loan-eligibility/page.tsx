import { Building2 } from 'lucide-react'
import ToolPageShell from '../_components/ToolPageShell'
import { LoanEligibilityCalculator } from '@/components/lead-capture/LoanEligibilityCalculator'

export default function LoanEligibilityPage() {
  return (
    <ToolPageShell
      icon={Building2}
      badge="Credit Intelligence"
      title="Loan Eligibility"
      subtitle="AI-Powered Bank Matching"
      description="Check your home loan eligibility across Tamil Nadu banks and PMAY schemes. Get pre-approval readiness score in under 60 seconds."
      accent="blue"
      stats={[
        { label: 'Banks Integrated', value: '8' },
        { label: 'PMAY Subsidy', value: '₹2.67L' },
        { label: 'Avg Approval Time', value: '7 Days' },
      ]}
    >
      <LoanEligibilityCalculator />
    </ToolPageShell>
  )
}
