"use client"

import dynamic from 'next/dynamic'

const EMICalcClient = dynamic(() => import('./EMICalculator').then(m => m.EMICalculator), { ssr: false })

export default function ClientEMICalculator(props: any) {
  return <EMICalcClient {...props} />
}



