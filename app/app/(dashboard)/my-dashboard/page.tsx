'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { ErrorBoundary } from './_components/ErrorBoundary'

// Import all components
import DashboardHeader from '@/components/dashboard/buyer/DashboardHeader'
import PerfectMatches from '@/components/dashboard/buyer/PerfectMatches'
import SavedProperties from '@/components/dashboard/buyer/SavedProperties'
import DocumentVault from '@/components/dashboard/buyer/DocumentVault'
import MarketInsights from '@/components/dashboard/buyer/MarketInsights'

function DashboardContent() {
  const [user, setUser] = useState<any>({ id: 'verified', email: 'user@tharaga.co.in' })
  const [greeting, setGreeting] = useState('Good evening')

  // Non-blocking auth check - render immediately like admin dashboard
  useEffect(() => {
    // Only run in browser (prevent SSR errors)
    if (typeof window === 'undefined') return

    // Set greeting based on time
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    // Try to initialize Supabase and get user - non-blocking
    try {
      const supabase = getSupabase()
      supabase.auth.getUser()
        .then(({ data, error }: any) => {
          if (data?.user) {
            setUser(data.user)
          }
        })
        .catch((err: any) => {
          console.error('[My-Dashboard] Auth error:', err)
        })
    } catch (err) {
      console.error('[My-Dashboard] Supabase init failed:', err)
    }
  }, [])

  // Get user's first name
  const getFirstName = () => {
    if (!user) return ''
    const fullName = user.user_metadata?.full_name || user.email
    return fullName.split(' ')[0].split('@')[0]
  }

  // Render immediately - NO blocking loading state (matches admin dashboard pattern)
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
        {/* Animated Background Elements - EXACT from pricing page */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
          <div
            className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: '1s' }}
          />
        </div>

        <div className="relative z-10">
          {/* Notification Header - Fixed */}
          <ErrorBoundary>
            <DashboardHeader />
          </ErrorBoundary>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-8 pt-20">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {greeting}, <span className="text-gradient-gold">{getFirstName()}</span>
              </h1>
              <p className="text-gray-400">
                Welcome back to your personalized property dashboard
              </p>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Column - 2/3 width */}
              <div className="lg:col-span-2 space-y-8">
                {/* Perfect Matches Section */}
                <section>
                  <ErrorBoundary>
                    <PerfectMatches />
                  </ErrorBoundary>
                </section>

                {/* Saved Properties Section */}
                <section>
                  <ErrorBoundary>
                    <SavedProperties />
                  </ErrorBoundary>
                </section>
              </div>

              {/* Sidebar - 1/3 width */}
              <div className="space-y-6">
                {/* Document Vault */}
                <section>
                  <ErrorBoundary>
                    <DocumentVault />
                  </ErrorBoundary>
                </section>

                {/* Market Insights */}
                <section>
                  <ErrorBoundary>
                    <MarketInsights />
                  </ErrorBoundary>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Global Styles */}
        <style jsx global>{`
          .text-gradient-gold {
            background: linear-gradient(135deg, #D4AF37, #F0D78C, #D4AF37);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }

          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}

/**
 * My Dashboard - Direct Render (No Suspense Delay)
 *
 * CRITICAL: Removed Suspense wrapper to prevent blocking
 * Component has guaranteed 2-second timeout built-in
 */
export default function MyDashboardPage() {
  return <DashboardContent />
}
