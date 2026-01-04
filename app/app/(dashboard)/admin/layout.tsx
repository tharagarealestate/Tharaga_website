import type { ReactNode } from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import AdminNav from '@/components/admin/AdminNav'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

/**
 * ADVANCED SECURITY: Server-side admin email verification
 * Admin access is restricted to tharagarealestate@gmail.com ONLY
 */
async function verifyAdminAccess() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      redirect('/?error=unauthorized&message=Authentication required')
    }
    
    // CRITICAL: Admin access is restricted to tharagarealestate@gmail.com ONLY
    const userEmail = user.email || ''
    if (userEmail !== 'tharagarealestate@gmail.com') {
      console.log('[Admin Layout] Unauthorized admin access attempt by:', userEmail)
      redirect('/?error=unauthorized&message=Admin Panel is only accessible to authorized administrators')
    }
    
    // User is admin owner - allow access
    return { user }
  } catch (error) {
    console.error('[Admin Layout] Auth verification error:', error)
    redirect('/?error=auth_error')
  }
}

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  // ADVANCED SECURITY: Verify admin email access on every request
  await verifyAdminAccess()

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
