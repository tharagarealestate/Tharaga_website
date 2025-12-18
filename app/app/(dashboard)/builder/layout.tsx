"use client"
import type { ReactNode } from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { DemoDataProvider } from './_components/DemoDataProvider'
import { BuilderSidebar } from './_components/BuilderSidebar'
import { TrialUpgradeBanner } from './_components/TrialUpgradeBanner'
import { AIAssistant } from './_components/AIAssistant'
import { KeyboardShortcutsHelp } from './_components/KeyboardShortcutsHelp'

export default function BuilderDashboardLayout({ children }: { children: ReactNode }) {

  return (
    <ReactQueryProvider>
      <DemoDataProvider>
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

        {/* Sidebar */}
        <BuilderSidebar />

        {/* Main Content Area - Adjusted for sidebar via CSS variable */}
        <main className="flex-1 relative z-10">
          <div className="min-h-screen p-4 lg:p-6">
            {children}
          </div>
        </main>
        
        {/* AI Assistant */}
        <AIAssistant />
        
        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp />
        </div>
      </DemoDataProvider>
    </ReactQueryProvider>
  )
}
