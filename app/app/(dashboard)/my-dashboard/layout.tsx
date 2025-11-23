import * as React from 'react'
import type { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import ClientTopNav from './_components/ClientTopNav'
import ClientMobileBottomNav from './_components/ClientMobileBottomNav'

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
      <ClientTopNav />
      <div className="mx-auto max-w-7xl pb-20 pt-4">
        {children}
      </div>
      <ClientMobileBottomNav />
    </div>
  )
}
