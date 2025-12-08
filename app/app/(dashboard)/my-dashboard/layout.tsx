import * as React from 'react'
import type { Metadata } from 'next'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Disable streaming to prevent React error 423
export const revalidate = 0

export const metadata: Metadata = {
  title: 'My Dashboard | Tharaga',
  description: 'Your personalized property dashboard with AI-powered recommendations',
}

export default function MyDashboardLayout({ children }: { children: React.ReactNode }) {
  // Authentication handled by middleware - no server-side redirects needed
  return (
    <>
      {children}
    </>
  )
}
