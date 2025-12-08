import type { ReactNode } from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { BuilderTopNav } from './_components/BuilderTopNav'
import { TrialUpgradeBanner } from './_components/TrialUpgradeBanner'
import { AIAssistant } from './_components/AIAssistant'
import { KeyboardShortcutsHelp } from './_components/KeyboardShortcutsHelp'

export const runtime = 'nodejs'
// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic'
// Disable streaming to prevent React error 423
export const dynamicParams = true

export default function BuilderDashboardLayout({ children }: { children: ReactNode }) {
  // Authentication handled by middleware - no server-side redirects needed

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
