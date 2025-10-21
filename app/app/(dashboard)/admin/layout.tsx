import type { ReactNode } from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <header className="border-b border-gray-800">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-4">
            <div className="text-h5 font-semibold tracking-wide text-gold-500">Admin Dashboard</div>
            <div className="text-sm text-gray-400">Real-time metrics and insights</div>
            <div className="grow" />
            <a href="/admin/leads" className="text-sm text-gray-300 hover:text-gold-400 transition-colors">Leads</a>
            <a href="/admin/settings" className="text-sm text-gray-300 hover:text-gold-400 transition-colors">Settings</a>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </main>
      </div>
    </ReactQueryProvider>
  )
}
