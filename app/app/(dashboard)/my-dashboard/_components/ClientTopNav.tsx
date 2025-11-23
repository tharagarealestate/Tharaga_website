"use client"

import dynamic from 'next/dynamic'

const TopNav = dynamic(() => import('./TopNav'), { ssr: false })

export default function ClientTopNav() {
  return <TopNav />
}

