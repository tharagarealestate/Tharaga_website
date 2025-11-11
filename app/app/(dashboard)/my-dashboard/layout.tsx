import * as React from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Breadcrumb from '@/components/Breadcrumb'

const TopNav = dynamic(() => import('./_components/TopNav'), { ssr: false })
const MobileBottomNav = dynamic(() => import('./_components/MobileBottomNav'), { ssr: false })

export const metadata: Metadata = {
  title: 'My Dashboard',
}

export default function MyDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-primary-50/30">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Buyer Dashboard' }
      ]} />
      <TopNav />
      <div className="mx-auto max-w-7xl pb-20 pt-4">
        {children}
      </div>
      <MobileBottomNav />
    </div>
  )
}
