import type { ReactNode } from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        {/* Use global homepage header from RootLayout; keep local main spacing */}
        <main className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </main>
      </div>
    </ReactQueryProvider>
  )
}
