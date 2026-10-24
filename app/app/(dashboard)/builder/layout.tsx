"use client"
import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { BuilderAuthProvider } from './_components/BuilderAuthProvider'
import { ModernSidebar } from './_components/ModernSidebar'
import MobileBottomNav from '@/components/MobileBottomNav'

export default function BuilderDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <BuilderAuthProvider>
        <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
          <ModernSidebar />

          {/* Main content — offset by sidebar width on desktop */}
          <main className="lg:ml-[256px] min-h-screen transition-[margin] duration-200">
            {/*
              pt-16: offsets fixed hamburger button (top-left, ~48px) on mobile
              pb-24: clearance for MobileBottomNav fixed bar (64px) on mobile
              lg:pt-6 lg:pb-8: desktop — no hamburger or bottom nav, normal spacing
            */}
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-16 pb-24 lg:pt-6 lg:pb-8">
              {children}
            </div>
          </main>

          {/* Mobile bottom navigation — section-based, only shown on /builder routes */}
          <Suspense fallback={null}>
            <MobileBottomNav />
          </Suspense>
        </div>
      </BuilderAuthProvider>
    </ReactQueryProvider>
  )
}
