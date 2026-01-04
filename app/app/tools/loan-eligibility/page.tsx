"use client"

import React from 'react'
import Breadcrumb from '@/components/Breadcrumb'
import { LoanEligibilityCalculator } from '@/components/lead-capture/LoanEligibilityCalculator'

export default function LoanEligibilityPage(){
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-4xl px-6 py-8">
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Tools', href: '/sitemap' },
            { label: 'Loan Eligibility Calculator' }
          ]} />
          <div className="mt-6">
            <LoanEligibilityCalculator />
          </div>
        </main>
      </div>
    </div>
  )
}

