"use client"
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Menu } from 'lucide-react'
export const runtime = 'edge'
import { Sidebar } from './_components/Sidebar'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'

export default function BuilderDashboardLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <ReactQueryProvider>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar: hidden on mobile, visible on lg+ */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Off-canvas mobile sidebar */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-gray-900/50" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-gradient-to-b from-primary-950 to-primary-900 shadow-2xl transform transition-transform duration-300 translate-x-0">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content Area (global homepage header is already provided by RootLayout) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header with hamburger */}
          <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-4 py-3">
              <button aria-label="Open menu" className="p-2 rounded-md border border-gray-300" onClick={() => setOpen(true)}>
                <Menu className="w-5 h-5" />
              </button>
              <div className="text-sm font-semibold text-gray-900">Builder Dashboard</div>
              <div className="w-9" />
            </div>
          </div>
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ReactQueryProvider>
  )
}
