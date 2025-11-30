import type { ReactNode } from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">
        {/* Use global homepage header from RootLayout; keep local main spacing */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8" style={{ paddingLeft: 'max(16px, env(safe-area-inset-left))', paddingRight: 'max(16px, env(safe-area-inset-right))' }}>
          {children}
        </main>
      </div>
    </ReactQueryProvider>
  )
}
