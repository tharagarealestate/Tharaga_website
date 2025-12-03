import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'

export const runtime = 'nodejs'

/**
 * Server-side role check for admin dashboard
 * Verifies user has 'admin' role in user_roles table
 * Returns 403 Forbidden if role check fails
 */
async function checkAdminRole() {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login?redirect=/admin')
  }

  // Check if user has admin role in user_roles table
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role, is_primary')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!userRoles) {
    // User doesn't have admin role - redirect to home with error
    redirect('/?error=unauthorized&message=You need admin role to access this page')
  }

  return { user, hasAdminRole: true }
}

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  // Server-side role verification
  await checkAdminRole()

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
