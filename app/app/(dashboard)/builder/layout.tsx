import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { BuilderTopNav } from './_components/BuilderTopNav'
import { TrialUpgradeBanner } from './_components/TrialUpgradeBanner'
import { AIAssistant } from './_components/AIAssistant'
import { KeyboardShortcutsHelp } from './_components/KeyboardShortcutsHelp'

/**
 * Server-side role check for builder dashboard
 * Verifies user has 'builder' role in user_roles table
 * Returns 403 Forbidden if role check fails
 */
async function checkBuilderRole() {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login?redirect=/builder')
  }

  // Check if user has builder role in user_roles table
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role, is_primary')
    .eq('user_id', user.id)
    .eq('role', 'builder')
    .single()

  if (!userRoles) {
    // User doesn't have builder role - redirect to home with error
    redirect('/?error=unauthorized&message=You need builder role to access this page')
  }

  return { user, hasBuilderRole: true }
}

export default async function BuilderDashboardLayout({ children }: { children: ReactNode }) {
  // Server-side role verification
  await checkBuilderRole()

  return (
    <ReactQueryProvider>
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        {/* Animated Background Elements - EXACT from pricing page */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
          <div
            className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: '1s' }}
          />
        </div>

        {/* Trial upgrade banner */}
        <TrialUpgradeBanner />

        {/* Top Navigation (replaces sidebar) */}
        <BuilderTopNav />

        {/* Main Content Area */}
        <main className="flex-1 relative z-10 mt-[72px]">
          {children}
        </main>
        
        {/* AI Assistant */}
        <AIAssistant />
        
        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp />
      </div>
    </ReactQueryProvider>
  )
}
