"use client"
import type { ReactNode } from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { BuilderAuthProvider } from './_components/BuilderAuthProvider'
import { ModernSidebar } from './_components/ModernSidebar'

export default function BuilderDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <BuilderAuthProvider>
        <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
          <ModernSidebar />

          {/* Main content — offset by sidebar width on desktop */}
          <main className="lg:ml-[256px] min-h-screen transition-[margin] duration-200">
            {/* pt-16 on mobile offsets the fixed hamburger button at top-left */}
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-16 pb-6 lg:pt-6 sm:pb-8">
              {children}
            </div>
          </main>
        </div>
      </BuilderAuthProvider>
    </ReactQueryProvider>
  )
}
