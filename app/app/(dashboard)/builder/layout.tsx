"use client"
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { DemoDataProvider } from './_components/DemoDataProvider'
import { ModernSidebar } from './_components/ModernSidebar'
import { TrialUpgradeBanner } from './_components/TrialUpgradeBanner'
import { AIAssistant } from './_components/AIAssistant'

export default function BuilderDashboardLayout({ children }: { children: ReactNode }) {

  return (
    <ReactQueryProvider>
      <DemoDataProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 text-white overflow-x-hidden">

        {/* Trial upgrade banner */}
        <TrialUpgradeBanner />

        {/* Modern Sidebar - Top-notch design inspired by GitHub, Linear, Vercel */}
        <ModernSidebar />

        {/* Main Content Area - Optimized space utilization for desktop */}
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-10 overflow-x-hidden" 
          style={{ 
            marginLeft: '260px',
            width: 'calc(100% - 260px)',
            minHeight: 'calc(100vh - 60px)',
          }}
        >
          {/* Full width container - NO max-width restrictions */}
          <div className="w-full h-full px-6 lg:px-8 xl:px-12 pt-8 pb-8 sm:pb-12">
            {children}
          </div>
        </motion.main>
        
        {/* AI Assistant */}
        <AIAssistant />
        </div>
      </DemoDataProvider>
    </ReactQueryProvider>
  )
}
