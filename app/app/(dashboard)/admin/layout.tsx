import type { ReactNode } from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import AdminNav from '@/components/admin/AdminNav'

export const runtime = 'nodejs'

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  // Authentication handled by middleware - no server-side redirects needed

  return (
    <ReactQueryProvider>
      <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
        {/* Use global homepage header from RootLayout; keep local main spacing */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8" style={{ paddingLeft: 'max(16px, env(safe-area-inset-left))', paddingRight: 'max(16px, env(safe-area-inset-right))' }}>
          <AdminNav />
          {children}
        </main>
      </div>
    </ReactQueryProvider>
  )
}
