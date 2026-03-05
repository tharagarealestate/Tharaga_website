'use client'
import ToolPageShell from '../_components/ToolPageShell'
import { BudgetPlanner } from '@/components/lead-capture/BudgetPlanner'

export default function BudgetPlannerPage() {
  return (
    <ToolPageShell
      icon="PiggyBank"
      badge="Budget Intelligence"
      title="Budget Planner"
      subtitle="AI-Powered Affordability Analysis"
      description="Plan your property budget intelligently — calculate max loan eligibility, stamp duty, registration costs, and browse properties that fit your numbers."
      accent="emerald"
      stats={[
        { label: 'Avg Down Payment', value: '20%' },
        { label: 'Properties Listed', value: '234+' },
        { label: 'TN Stamp Duty', value: '7%' },
      ]}
    >
      <BudgetPlanner />
    </ToolPageShell>
  )
}
