import { TrendingUp } from 'lucide-react'
import ToolPageShell from '../_components/ToolPageShell'
import { ROICalculator } from '@/components/lead-capture/ROICalculator'

export default function RoiPage() {
  return (
    <ToolPageShell
      icon={TrendingUp}
      badge="Investment Intelligence"
      title="ROI Calculator"
      subtitle="AI-Powered Returns Analysis"
      description="Calculate rental yield, capital appreciation, and total investment returns — powered by live Chennai market data across 2,400+ transactions."
      accent="amber"
      stats={[
        { label: 'Properties Analyzed', value: '2,400+' },
        { label: 'Avg Chennai Yield', value: '4.1%' },
        { label: 'Cities Covered', value: '12' },
      ]}
    >
      <ROICalculator />
    </ToolPageShell>
  )
}
