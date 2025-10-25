import type { ReactNode } from 'react'
export const runtime = 'edge'
import { Sidebar } from './_components/Sidebar'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'

export default function BuilderDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar: hidden on mobile, visible on lg+ */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main Content Area (global homepage header is already provided by RootLayout) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ReactQueryProvider>
  )
}
