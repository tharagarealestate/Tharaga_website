import * as React from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

const TopNav = dynamic(() => import('./_components/TopNav'), { ssr: false })
const MobileBottomNav = dynamic(() => import('./_components/MobileBottomNav'), { ssr: false })

export const metadata: Metadata = {
  title: 'My Dashboard',
}

export default function MyDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-200">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-4">
        {children}
      </div>
      <MobileBottomNav />
    </div>
  )
}
