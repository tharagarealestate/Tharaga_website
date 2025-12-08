"use client"
import * as React from 'react'

// Force dynamic rendering to prevent streaming issues
export const dynamic = 'force-dynamic'

export default function MyDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}
