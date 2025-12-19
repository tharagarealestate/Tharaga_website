"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getSupabase } from '@/lib/supabase'

/**
 * Demo Data Provider - Top-level wrapper that provides demo data
 * when user is not authenticated, seamlessly switching to real data
 * when authentication is detected.
 * 
 * This ensures the public Netlify link always shows beautiful content
 * instead of "Access Denied" errors.
 */

interface DemoDataContextType {
  isDemoMode: boolean
  isAuthenticated: boolean
  isLoading: boolean
  builderId: string | null
  userId: string | null
}

const DemoDataContext = createContext<DemoDataContextType | null>(null)

export function useDemoMode(): DemoDataContextType {
  const context = useContext(DemoDataContext)
  
  // Provide safe defaults if context is not available
  if (!context) {
    console.warn('[useDemoMode] DemoDataProvider context not found, using defaults')
    return {
      isDemoMode: false,
      isAuthenticated: false,
      isLoading: false,
      builderId: null,
      userId: null,
    }
  }
  
  return context
}

// Realistic demo data that matches real API responses
export const DEMO_DATA = {
  dealLifecycles: {
    lifecycles: [
      {
        id: 'demo-1',
        current_stage: 'negotiation',
        builder_id: 'demo-builder',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        journey: {
          id: 'demo-journey-1',
          lead: {
            id: 'demo-lead-1',
            name: 'Rajesh Kumar',
            email: 'rajesh.kumar@example.com',
            phone: '+91 98765 43210',
          },
          property: {
            id: 'demo-prop-1',
            title: 'Luxury 3BHK Apartment',
            location: 'Whitefield, Bangalore',
          },
        },
      },
      {
        id: 'demo-2',
        current_stage: 'viewing_scheduled',
        builder_id: 'demo-builder',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        journey: {
          id: 'demo-journey-2',
          lead: {
            id: 'demo-lead-2',
            name: 'Priya Sharma',
            email: 'priya.sharma@example.com',
            phone: '+91 98765 43211',
          },
          property: {
            id: 'demo-prop-2',
            title: 'Premium Villa',
            location: 'Indiranagar, Bangalore',
          },
        },
      },
      {
        id: 'demo-3',
        current_stage: 'contract_sent',
        builder_id: 'demo-builder',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        journey: {
          id: 'demo-journey-3',
          lead: {
            id: 'demo-lead-3',
            name: 'Amit Patel',
            email: 'amit.patel@example.com',
            phone: '+91 98765 43212',
          },
          property: {
            id: 'demo-prop-3',
            title: 'Modern 2BHK Flat',
            location: 'Koramangala, Bangalore',
          },
        },
      },
    ],
    milestones: [
      {
        id: 'demo-milestone-1',
        lifecycle_id: 'demo-3',
        amount: 500000,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      },
    ],
  },
  viewings: {
    viewings: [
      {
        id: 'demo-viewing-1',
        builder_id: 'demo-builder',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        lead: {
          id: 'demo-lead-2',
          name: 'Priya Sharma',
          email: 'priya.sharma@example.com',
        },
        property: {
          id: 'demo-prop-2',
          title: 'Premium Villa',
          location: 'Indiranagar, Bangalore',
        },
      },
      {
        id: 'demo-viewing-2',
        builder_id: 'demo-builder',
        scheduled_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        lead: {
          id: 'demo-lead-1',
          name: 'Rajesh Kumar',
          email: 'rajesh.kumar@example.com',
        },
        property: {
          id: 'demo-prop-1',
          title: 'Luxury 3BHK Apartment',
          location: 'Whitefield, Bangalore',
        },
      },
    ],
    reminders: [],
  },
  negotiations: {
    negotiations: [
      {
        id: 'demo-negotiation-1',
        builder_id: 'demo-builder',
        status: 'active',
        asking_price: 8500000, // Changed from initial_price to asking_price to match analyzeNegotiations
        current_price: 8200000,
        initial_price: 8500000, // Keep for backward compatibility
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        journey: {
          id: 'demo-journey-1',
          current_stage: 'negotiation',
          lead: {
            id: 'demo-lead-1',
            name: 'Rajesh Kumar',
            email: 'rajesh.kumar@example.com',
          },
          property: {
            id: 'demo-prop-1',
            title: 'Luxury 3BHK Apartment',
            location: 'Whitefield, Bangalore',
          },
        },
      },
    ],
    insights: [],
  },
  contracts: [
    {
      id: 'demo-contract-1',
      builder_id: 'demo-builder',
      status: 'sent',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      journey: {
        id: 'demo-journey-3',
        lead: {
          id: 'demo-lead-3',
          name: 'Amit Patel',
          email: 'amit.patel@example.com',
        },
        property: {
          id: 'demo-prop-3',
          title: 'Modern 2BHK Flat',
          location: 'Koramangala, Bangalore',
        },
      },
    },
  ],
  leads: {
    leads: [
      {
        id: 'demo-lead-1',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        phone: '+91 98765 43210',
        score: 85,
        category: 'Hot Lead',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-lead-2',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91 98765 43211',
        score: 72,
        category: 'Warm Lead',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-lead-3',
        name: 'Amit Patel',
        email: 'amit.patel@example.com',
        phone: '+91 98765 43212',
        score: 68,
        category: 'Warm Lead',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 3,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    },
    stats: {
      total_leads: 3,
      hot_leads: 1,
      warm_leads: 2,
      developing_leads: 0,
      cold_leads: 0,
      average_score: 75,
      pending_interactions: 1,
      no_response_leads: 0,
    },
  },
}

interface DemoDataProviderProps {
  children: ReactNode
}

export function DemoDataProvider({ children }: DemoDataProviderProps) {
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean
    isLoading: boolean
    builderId: string | null
    userId: string | null
  }>({
    isAuthenticated: false,
    isLoading: true,
    builderId: null,
    userId: null,
  })

  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      try {
        const supabase = getSupabase()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (!mounted) return

        if (userError || !user) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            builderId: null,
            userId: null,
          })
          return
        }

        // User is authenticated - try to get builder profile
        const { data: profile, error: profileError } = await supabase
          .from('builder_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!mounted) return

        if (profileError || !profile) {
          // User exists but not a builder - still show demo
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            builderId: null,
            userId: user.id,
          })
          return
        }

        // Fully authenticated builder
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          builderId: profile.id,
          userId: user.id,
        })
      } catch (err) {
        console.warn('[DemoDataProvider] Auth check error (non-blocking):', err)
        if (mounted) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            builderId: null,
            userId: null,
          })
        }
      }
    }

    checkAuth()

    // Re-check auth periodically (every 30 seconds) to catch login events
    const interval = setInterval(checkAuth, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const isDemoMode = !authState.isAuthenticated

  return (
    <DemoDataContext.Provider
      value={{
        isDemoMode,
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
        builderId: authState.builderId,
        userId: authState.userId,
      }}
    >
      {children}
    </DemoDataContext.Provider>
  )
}


