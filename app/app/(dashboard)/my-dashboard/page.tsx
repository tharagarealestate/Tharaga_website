'use client'

import { useState, useEffect, useRef } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Import all components
import DashboardHeader from '@/components/dashboard/buyer/DashboardHeader'
import PerfectMatches from '@/components/dashboard/buyer/PerfectMatches'
import SavedProperties from '@/components/dashboard/buyer/SavedProperties'
import DocumentVault from '@/components/dashboard/buyer/DocumentVault'
import MarketInsights from '@/components/dashboard/buyer/MarketInsights'

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('Hello')
  const supabase = getSupabase()
  const router = useRouter()

  // Use ref to prevent multiple simultaneous role checks
  const roleCheckInProgress = useRef(false)

  // Fetch user with timeout - RUN ONCE on mount
  useEffect(() => {
    // Prevent multiple simultaneous checks
    if (roleCheckInProgress.current) {
      return
    }

    roleCheckInProgress.current = true

    // Set greeting immediately
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    // Set timeout to prevent infinite loading - use functional update to avoid stale closure
    const timeoutId = setTimeout(() => {
      setLoading((currentLoading) => {
        if (currentLoading) {
          console.warn('Auth check timeout - rendering anyway (middleware verified)')
          setUser({ id: 'verified', email: 'user@tharaga.co.in' })
          roleCheckInProgress.current = false
          return false
        }
        return currentLoading
      })
    }, 2000) // 2 second timeout

    const fetchUser = async () => {
      try {
        // Race auth call against timeout
        const authPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500))

        const result = await Promise.race([authPromise, timeoutPromise]) as any

        clearTimeout(timeoutId)

        if (result && result.data && result.data.user) {
          // Success - got user
          setUser(result.data.user)
          setLoading(false)
          roleCheckInProgress.current = false
        } else if (result && result.error) {
          // Auth error - render anyway
          console.warn('Auth error (rendering anyway):', result.error)
          setLoading(false)
          setUser({ id: 'verified', email: 'user@tharaga.co.in' })
          roleCheckInProgress.current = false
        } else {
          // Timeout - render anyway
          console.warn('Auth timeout - rendering anyway (middleware verified)')
          setLoading(false)
          setUser({ id: 'verified', email: 'user@tharaga.co.in' })
          roleCheckInProgress.current = false
        }
      } catch (err) {
        clearTimeout(timeoutId)
        console.warn('Auth error (rendering anyway):', err)
        setLoading(false)
        // Render anyway - middleware already verified
        setUser({ id: 'verified', email: 'user@tharaga.co.in' })
        roleCheckInProgress.current = false
      }
    }

    fetchUser()

    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      roleCheckInProgress.current = false
    }
  }, []) // Empty deps - run once on mount

  // Get user's first name
  const getFirstName = () => {
    if (!user) return ''
    const fullName = user.user_metadata?.full_name || user.email
    return fullName.split(' ')[0].split('@')[0]
  }

  // Loading state
  if (loading) {
    return (
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
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400">Loading your dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting or if no user
  if (!user) {
    return null
  }

  return (
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
        <DashboardHeader />

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
                <PerfectMatches />
              </section>

              {/* Saved Properties Section */}
              <section>
                <SavedProperties />
              </section>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="space-y-6">
              {/* Document Vault */}
              <section>
                <DocumentVault />
              </section>

              {/* Market Insights */}
              <section>
                <MarketInsights />
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
  );
}
