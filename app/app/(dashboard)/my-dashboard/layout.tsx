import * as React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Dashboard | Tharaga',
  description: 'Your personalized property dashboard with AI-powered recommendations',
}

export default function MyDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}
