"use client"
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { DemoDataProvider } from './_components/DemoDataProvider'
import { AdvancedAISidebar } from './_components/AdvancedAISidebar'
import { TrialUpgradeBanner } from './_components/TrialUpgradeBanner'
import { AIAssistant } from './_components/AIAssistant'

export default function BuilderDashboardLayout({ children }: { children: ReactNode }) {

  return (
    <ReactQueryProvider>
      <DemoDataProvider>
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

        {/* Trial upgrade banner */}
        <TrialUpgradeBanner />

        {/* Advanced AI Sidebar - Fixed positioning with smooth transitions */}
        <AdvancedAISidebar />

        {/* Main Content Area - Positioned next to sidebar with smooth transitions */}
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 pt-0 pb-6 sm:pb-8" 
          style={{ 
            marginLeft: '260px',
            width: 'calc(100% - 260px)',
            paddingLeft: 'max(16px, env(safe-area-inset-left))', 
            paddingRight: 'max(16px, env(safe-area-inset-right))' 
          }}
        >
          {children}
        </motion.main>
        
        {/* AI Assistant */}
        <AIAssistant />
        </div>
      </DemoDataProvider>
    </ReactQueryProvider>
  )
}
