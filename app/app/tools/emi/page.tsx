import { Calculator } from 'lucide-react'
import ToolPageShell from '../_components/ToolPageShell'
import { EMICalculator } from '@/components/lead-capture/EMICalculator'

export default function EMIPage() {
  return (
    <ToolPageShell
      icon={Calculator}
      badge="Loan Intelligence"
      title="EMI Calculator"
      subtitle="AI-Powered Loan Analysis"
      description="Calculate home loan EMI, total interest payable, and unlock a full amortization schedule with live rate comparisons from 12+ banks."
      accent="amber"
      stats={[
        { label: 'Lowest SBI Rate', value: '8.40%' },
        { label: 'Banks Compared', value: '12+' },
        { label: 'Avg Tenure', value: '20 Yrs' },
      ]}
    >
      <EMICalculator />
    </ToolPageShell>
  )
}
