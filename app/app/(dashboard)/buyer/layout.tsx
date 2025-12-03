import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

/**
 * Server-side role check for buyer dashboard
 * Verifies user has 'buyer' role in user_roles table
 * Returns 403 Forbidden if role check fails
 */
async function checkBuyerRole() {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login?redirect=/buyer')
  }

  // Check if user has buyer role in user_roles table
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role, is_primary')
    .eq('user_id', user.id)
    .eq('role', 'buyer')
    .single()

  if (!userRoles) {
    // User doesn't have buyer role - redirect to home with error
    redirect('/?error=unauthorized&message=You need buyer role to access this page')
  }

  return { user, hasBuyerRole: true }
}

export default async function BuyerDashboardLayout({ children }: { children: ReactNode }) {
  // Server-side role verification
  await checkBuyerRole()

  return <>{children}</>
}

