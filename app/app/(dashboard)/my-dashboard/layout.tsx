"use client"
import * as React from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { SupabaseProvider } from '@/contexts/SupabaseContext'

export default function MyDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <SupabaseProvider>
        {children}
      </SupabaseProvider>
    </ReactQueryProvider>
  )
}
