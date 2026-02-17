'use client'

import type { ReactNode } from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { SupabaseProvider } from '@/contexts/SupabaseContext'

export default function MyDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <SupabaseProvider>
        {children}
      </SupabaseProvider>
    </ReactQueryProvider>
  )
}
