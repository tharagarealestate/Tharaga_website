"use client"

import React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { BudgetPlanner } from '@/components/lead-capture/BudgetPlanner'
import { motion } from 'framer-motion'

export default function BudgetPlannerPage(){
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 relative overflow-hidden">
      {/* Animated Background Elements - Billing Design System Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-amber-500 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-4xl px-6 sm:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Breadcrumb items={[
              { label: 'Home', href: '/' },
              { label: 'Tools', href: '/sitemap' },
              { label: 'Budget Planner' }
            ]} />
            
            {/* Header Section - Billing Design System Pattern */}
            <div className="bg-gradient-to-r from-blue-500/20 via-blue-600/20 to-blue-500/20 glow-border rounded-xl p-6 sm:p-8 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Budget Planner
              </h1>
              <p className="text-lg sm:text-xl text-slate-300">
                Plan your budget and find affordable properties in Tamil Nadu
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <BudgetPlanner />
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

