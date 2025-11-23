"use client"

import dynamic from 'next/dynamic'

const MatchScore = dynamic(() => import('./MatchScore').then(m => m.MatchScore), { ssr: false })

export default function ClientMatchScore(props: any) {
  return <MatchScore {...props} />
}

