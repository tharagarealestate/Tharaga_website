import type { ReactNode } from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import AdminNav from '@/components/admin/AdminNav'
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

/**
 * ADVANCED SECURITY: Server-side admin email verification
 * Admin access is restricted to tharagarealestate@gmail.com ONLY
 */
async function verifyAdminAccess() {
  try {
    const supabase = await createClient()
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
  await verifyAdminAccess()

  return (
    <ReactQueryProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
        <AdminNav />
        <main className="lg:ml-56 min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
            <div className="mb-4">
              <AdminBreadcrumb />
            </div>
            {children}
          </div>
        </main>
      </div>
    </ReactQueryProvider>
  )
}
