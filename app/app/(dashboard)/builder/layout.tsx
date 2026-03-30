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
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
              {children}
            </div>
          </main>
        </div>
      </BuilderAuthProvider>
    </ReactQueryProvider>
  )
}
