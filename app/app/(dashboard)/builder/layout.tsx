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
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Premium minimal header */}
        <BuilderHeader />

        {/* Trial upgrade banner (shown when trial ending/expired) */}
        <TrialUpgradeBanner />

        {/* Workflow tabs (Attract → Qualify → Move → Close → Operate) */}
        <WorkflowTabs />

        {/* Context strip for current workflow */}
        <ContextMenu />

        {/* Main shell: sidebar + content */}
        <div className="flex-1 flex">
          {/* Desktop sidebar (collapsible) */}
          <Sidebar />

          {/* Mobile: hamburger + breadcrumb + content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile header with hamburger below global header */}
            <div className="lg:hidden border-b border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
              <button
                aria-label="Open menu"
                className="p-2 rounded-md border border-slate-300 bg-white"
                onClick={() => setOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="text-sm font-semibold text-slate-900">Builder Dashboard</div>
              <div className="w-9" />
            </div>

            {/* Off-canvas mobile sidebar */}
            {open && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} />
                <div className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-[#0F111C] shadow-2xl transform transition-transform duration-300 translate-x-0">
                  <Sidebar />
                </div>
              </div>
            )}

            {/* Breadcrumb Navigation */}
            <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
              <Breadcrumb
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Builder Dashboard' },
                ]}
              />
            </div>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8 bg-slate-50">
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

