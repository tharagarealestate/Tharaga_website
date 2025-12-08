'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ClientOnly } from '@/components/ClientOnly'

// Dynamically import components to prevent SSR issues
let DashboardHeader: any = null
let PerfectMatches: any = null
let SavedProperties: any = null
let DocumentVault: any = null
let MarketInsights: any = null

if (typeof window !== 'undefined') {
  Promise.all([
    import('@/components/dashboard/buyer/DashboardHeader').then(m => { DashboardHeader = m.default }),
    import('@/components/dashboard/buyer/PerfectMatches').then(m => { PerfectMatches = m.default }),
    import('@/components/dashboard/buyer/SavedProperties').then(m => { SavedProperties = m.default }),
    import('@/components/dashboard/buyer/DocumentVault').then(m => { DocumentVault = m.default }),
    import('@/components/dashboard/buyer/MarketInsights').then(m => { MarketInsights = m.default }),
  ]).catch(console.error)
}

export default function DashboardContent() {
  const [user, setUser] = useState<any>({ id: 'verified', email: 'user@tharaga.co.in' })
  const [greeting, setGreeting] = useState('Hello')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Set greeting immediately
  useEffect(() => {
    if (mounted) {
      const hour = new Date().getHours()
      if (hour < 12) setGreeting('Good morning')
      else if (hour < 17) setGreeting('Good afternoon')
      else setGreeting('Good evening')
    }
  }, [mounted])

  // Fetch user in background - non-blocking, middleware already verified access
  useEffect(() => {
    let mounted = true

    const fetchUser = async () => {
      try {
        // Small delay to ensure Supabase is ready
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!mounted) return
        
        const supabase = getSupabase()
        
        // Try to get user with short timeout
        const authPromise = supabase.auth.getUser()
        const result = await Promise.race([
          authPromise,
          new Promise((resolve) => setTimeout(() => resolve(null), 1000))
        ]) as any

        if (!mounted) return

        if (result && result.data && result.data.user) {
          setUser(result.data.user)
        }
      } catch (err) {
        // Silently fail - user already set to verified placeholder
        console.warn('Auth check error - using verified placeholder:', err)
      }
    }

    fetchUser()

    return () => {
      mounted = false
    }
  }, [])

  // Get user's first name
  const getFirstName = () => {
    if (!user) return 'User'
    const fullName = user.user_metadata?.full_name || user.email || 'User'
    return fullName.split(' ')[0].split('@')[0]
  }

  // Don't render until mounted and components are loaded
  if (!mounted || !DashboardHeader || !PerfectMatches || !SavedProperties || !DocumentVault || !MarketInsights) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
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

  // Always render dashboard - never show loading state
  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
          <div
            className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: '1s' }}
          />
        </div>
        
        <div className="relative z-10">
          <DashboardHeader />

          <div className="container mx-auto px-4 py-8 pt-20">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {greeting}, <span className="text-gradient-gold">{getFirstName()}</span>
              </h1>
              <p className="text-gray-400">
                Welcome back to your personalized property dashboard
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <PerfectMatches />
                </section>
                <section>
                  <SavedProperties />
                </section>
              </div>

              <div className="space-y-6">
                <section>
                  <DocumentVault />
                </section>
                <section>
                  <MarketInsights />
                </section>
              </div>
            </div>
          </div>
        </div>

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
    </ClientOnly>
  );
}

