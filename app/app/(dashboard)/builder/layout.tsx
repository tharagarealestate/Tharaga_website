import type { ReactNode } from 'react'
import { Sidebar } from './_components/Sidebar'
import { Header } from './_components/Header'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'

export default function BuilderDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar: hidden on mobile, visible on lg+ */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ReactQueryProvider>
  )
}
