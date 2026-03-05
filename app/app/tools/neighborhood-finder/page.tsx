'use client'
import ToolPageShell from '../_components/ToolPageShell'
import { NeighborhoodFinder } from '@/components/lead-capture/NeighborhoodFinder'

export default function NeighborhoodFinderPage() {
  return (
    <ToolPageShell
      icon="MapPin"
      badge="Area Intelligence"
      title="Neighborhood Finder"
      subtitle="AI-Powered Location Matching"
      description="Discover the perfect neighborhood based on your lifestyle, commute, schools, and budget — scored across 12 Tamil Nadu data points."
      accent="purple"
      stats={[
        { label: 'Localities Scored', value: '180+' },
        { label: 'Data Points', value: '12' },
        { label: 'Cities Covered', value: '8' },
      ]}
    >
      <NeighborhoodFinder />
    </ToolPageShell>
  )
}
