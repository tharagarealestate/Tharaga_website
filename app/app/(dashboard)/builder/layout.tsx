"use client"
import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { BuilderTopNav } from './_components/BuilderTopNav'
import { TrialUpgradeBanner } from './_components/TrialUpgradeBanner'
import { AIAssistant } from './_components/AIAssistant'
import { KeyboardShortcutsHelp } from './_components/KeyboardShortcutsHelp'

export default function BuilderDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Premium glassmorphic background */}
        <div className="fixed inset-0 -z-10">
          {/* Layer 1: Base Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#071422]" />
          
          {/* Layer 2: Atmospheric Orbs */}
          <div 
            className="absolute top-20 left-10 w-[400px] h-[400px] bg-[#D4AF37] opacity-25 blur-[120px] rounded-full animate-pulse pointer-events-none" 
            style={{ animationDuration: '8s' }} 
          />
          <div 
            className="absolute bottom-20 right-10 w-[350px] h-[350px] bg-[#10B981] opacity-15 blur-[100px] rounded-full animate-pulse pointer-events-none" 
            style={{ animationDuration: '12s', animationDelay: '1s' }} 
          />
          <div 
            className="absolute top-40 right-20 w-[300px] h-[300px] bg-[#1e40af] opacity-20 blur-[80px] rounded-full animate-pulse pointer-events-none" 
            style={{ animationDuration: '10s', animationDelay: '2s' }} 
          />
          
          {/* Layer 3: Subtle Grid */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} 
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
