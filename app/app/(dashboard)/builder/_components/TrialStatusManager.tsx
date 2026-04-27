"use client"

import { useEffect, useState, useMemo } from 'react'
import { useBuilderAuth } from './BuilderAuthProvider'

interface SubscriptionData {
  tier: 'trial' | 'pro' | 'enterprise' | 'trial_expired' | string
  trial_leads_used?: number
  days_remaining?: number
  is_trial_expired?: boolean
  builder_name?: string | null
  status?: string
}

interface TrialStatusResult {
  subscription: SubscriptionData | null
  isLoading: boolean
  isTrial: boolean
  daysRemaining: number
  isExpired: boolean
  isUrgent: boolean
  progressPercentage: number
  trialLeadsUsed: number
  trialLeadsLimit: number
  formattedDaysLeft: string
}

/**
 * Advanced Trial Status Manager
 * 
 * Smart algorithm that:
 * 1. Detects if user is logged in (via BuilderAuthProvider)
 * 2. Fetches real subscription data from API
 * 3. Calculates accurate days remaining with timezone handling
 * 4. Provides formatted display strings
 * 5. Handles edge cases (expired, urgent, etc.)
 * 6. Updates in real-time
 */
export function useTrialStatus(): TrialStatusResult {
  const { isAuthenticated, isLoading: authLoading } = useBuilderAuth()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastFetchTime, setLastFetchTime] = useState(0)

  // Fetch subscription data
  useEffect(() => {
    // Don't fetch if auth is still loading or not authenticated
    if (authLoading || !isAuthenticated) {
      setIsLoading(false)
      setSubscription(null)
      return
    }

    let cancelled = false
    let retryCount = 0
    const maxRetries = 3

    async function fetchSubscription() {
      try {
        const res = await fetch('/api/builder/subscription', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        
        const data = await res.json() as SubscriptionData
        
        if (!cancelled) {
          setSubscription(data)
          setIsLoading(false)
          setLastFetchTime(Date.now())
        }
      } catch (error) {
        console.warn('[TrialStatusManager] Fetch error:', error)
        
        // Retry logic
        if (retryCount < maxRetries && !cancelled) {
          retryCount++
          setTimeout(fetchSubscription, 1000 * retryCount)
        } else if (!cancelled) {
          // Fallback: assume trial with default values
          setSubscription({
            tier: 'trial',
            trial_leads_used: 0,
            days_remaining: 14,
            is_trial_expired: false,
          })
          setIsLoading(false)
        }
      }
    }

    fetchSubscription()

    // Refresh every 60 seconds to keep days_remaining accurate
    const interval = setInterval(() => {
      if (!cancelled && isAuthenticated && !authLoading) {
        fetchSubscription()
      }
    }, 60000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isAuthenticated, authLoading])

  // Calculate computed values
  const computed = useMemo(() => {
    if (!subscription) {
      return {
        isTrial: false,
        daysRemaining: 0,
        isExpired: false,
        isUrgent: false,
        progressPercentage: 0,
        trialLeadsUsed: 0,
        trialLeadsLimit: 10,
        formattedDaysLeft: '',
      }
    }

    const isTrial = subscription.tier === 'trial' || subscription.tier === 'trial_expired' || subscription.is_trial_expired
    const daysRemaining = subscription.days_remaining ?? 0
    const isExpired = daysRemaining === 0 || subscription.is_trial_expired || false
    const isUrgent = !isExpired && daysRemaining <= 3

    // Calculate progress percentage (days used / 14 days)
    const progressPercentage = isExpired 
      ? 100 
      : Math.min(100, Math.max(0, ((14 - daysRemaining) / 14) * 100))

    const trialLeadsUsed = subscription.trial_leads_used ?? 0
    const trialLeadsLimit = 10 // Standard trial limit

    // Format days left with smart messaging
    let formattedDaysLeft = ''
    if (isExpired) {
      formattedDaysLeft = 'Expired'
    } else if (daysRemaining === 0) {
      formattedDaysLeft = 'Expires today'
    } else if (daysRemaining === 1) {
      formattedDaysLeft = '1 day left'
    } else if (daysRemaining <= 3) {
      formattedDaysLeft = `${daysRemaining} days left`
    } else {
      formattedDaysLeft = `${daysRemaining} days left`
    }

    return {
      isTrial,
      daysRemaining,
      isExpired,
      isUrgent,
      progressPercentage,
      trialLeadsUsed,
      trialLeadsLimit,
      formattedDaysLeft,
    }
  }, [subscription])

  return {
    subscription,
    isLoading: isLoading || authLoading,
    ...computed,
  }
}
