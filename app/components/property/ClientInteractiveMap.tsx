"use client"

import dynamic from 'next/dynamic'

const InteractiveMap = dynamic(() => import('./InteractiveMap').then(m => m.InteractiveMap), { ssr: false })

export default function ClientInteractiveMap(props: any) {
  return <InteractiveMap {...props} />
}



