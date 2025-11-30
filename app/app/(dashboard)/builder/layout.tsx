"use client"
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Menu } from 'lucide-react'
export const runtime = 'edge'
import { Sidebar } from './_components/Sidebar'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import Breadcrumb from '@/components/Breadcrumb'
import { BuilderHeader } from './_components/BuilderHeader'
import { WorkflowTabs } from './_components/WorkflowTabs'
import { ContextMenu } from './_components/ContextMenu'
import { TrialUpgradeBanner } from './_components/TrialUpgradeBanner'
import { AIAssistant } from './_components/AIAssistant'

export default function BuilderDashboardLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <ReactQueryProvider>
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Premium minimal header */}
        <BuilderHeader />

        {/* Trial upgrade banner (shown when trial ending/expired) */}
        <TrialUpgradeBanner />

        {/* Workflow tabs (Attract → Qualify → Move → Close → Operate) */}
        <WorkflowTabs />

        {/* Context strip for current workflow */}
        <ContextMenu />

        {/* Main shell: sidebar + content */}
        <div className="flex-1 flex relative">
          {/* Desktop sidebar (collapsible) */}
          <Sidebar />

          {/* Mobile: hamburger + breadcrumb + content */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            {/* Mobile header with hamburger below global header */}
            <div className="lg:hidden border-b border-white/10 bg-white/[0.03] backdrop-blur-[16px] px-4 py-3 flex items-center justify-between safe-area-top">
              <button
                aria-label="Open menu"
                className="p-2 rounded-md border border-white/10 bg-white/[0.05] backdrop-blur-sm min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                onClick={() => setOpen(true)}
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
              <div className="text-sm font-semibold text-white">Builder Dashboard</div>
              <div className="w-9" />
            </div>

            {/* Off-canvas mobile sidebar */}
            {open && (
              <div className="fixed inset-0 z-50 lg:hidden" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
                <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-[#0F111C] shadow-2xl transform transition-transform duration-300 ease-out translate-x-0 overflow-y-auto">
                  <div className="p-4 flex items-center justify-between border-b border-white/10">
                    <span className="text-white font-semibold">Menu</span>
                    <button
                      onClick={() => setOpen(false)}
                      className="p-2 rounded-md text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Close menu"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <Sidebar />
                </div>
              </div>
            )}

            {/* Breadcrumb Navigation */}
            <div className="border-b border-white/10 bg-white/[0.03] backdrop-blur-[16px]">
              <Breadcrumb
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Builder Dashboard' },
                ]}
              />
            </div>

            {/* Page Content - No background, let unified dashboard handle it */}
            <main className="flex-1 overflow-y-auto relative">
              {children}
            </main>
          </div>
        </div>
        
        {/* AI Assistant - Available everywhere */}
        <AIAssistant />
      </div>
    </ReactQueryProvider>
  )
}

