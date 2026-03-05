'use client'
import ToolPageShell from '../_components/ToolPageShell'
import { PropertyValuation } from '@/components/lead-capture/PropertyValuation'

export default function PropertyValuationPage() {
  return (
    <ToolPageShell
      icon="BarChart3"
      badge="Valuation Intelligence"
      title="Property Valuation"
      subtitle="AI-Powered RERA Analysis"
      description="Get an instant AI estimate of your property's market value using RERA-verified comparable sales data and Chennai micro-market trends."
      accent="amber"
      stats={[
        { label: 'RERA Records', value: '1.2M+' },
        { label: 'Accuracy Rate', value: '94%' },
        { label: 'Markets Tracked', value: '340+' },
      ]}
    >
      <PropertyValuation />
    </ToolPageShell>
  )
}
