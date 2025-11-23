"use client"

import dynamic from 'next/dynamic'

const CompareChart = dynamic(() => import('./CompareChart').then(m => m.CompareChart), { ssr: false })

export default function ClientCompareChart(props: any) {
  return <CompareChart {...props} />
}

