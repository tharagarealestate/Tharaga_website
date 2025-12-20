"use client"

import { useEffect, useState } from "react"
import { AlertCircle, X, Crown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

interface SubscriptionData {
  tier: "trial" | "pro" | "enterprise" | "trial_expired" | string
  days_remaining?: number
  status?: string
  is_trial_expired?: boolean
}

export function TrialUpgradeBanner() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/builder/subscription", {
          next: { revalidate: 0 } as any,
        })
        if (!res.ok) throw new Error("Failed")
        const data = (await res.json()) as SubscriptionData
        if (!cancelled) setSubscription(data)
      } catch {
        if (!cancelled) {
          setSubscription({ tier: "trial", days_remaining: 14 })
        }
      }
    }
    load()
    const interval = setInterval(load, 60000) // Refresh every minute
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Check if banner should be shown
  const shouldShow = subscription && 
    (subscription.tier === 'trial' || subscription.tier === 'trial_expired' || subscription.is_trial_expired) && 
    !dismissed &&
    (subscription.days_remaining === 0 || subscription.is_trial_expired || (subscription.days_remaining ?? 14) <= 3)

  if (!shouldShow) return null

  const daysLeft = subscription.days_remaining ?? 0
  const isExpired = daysLeft === 0
  const isUrgent = daysLeft <= 1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`
          fixed top-0 left-0 right-0 z-40 border-b
          ${isExpired 
            ? 'bg-red-50 border-red-200' 
            : isUrgent 
            ? 'bg-orange-50 border-orange-200' 
            : 'bg-amber-50 border-amber-200'
          }
        `}
        style={{ marginLeft: '220px', width: 'calc(100% - 220px)' }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              {isExpired ? (
                <>
                  <Crown className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-red-900">
                      Your trial has expired
                    </div>
                    <div className="text-sm text-red-700">
                      Upgrade now to continue accessing all features and your leads.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isUrgent ? 'text-orange-600' : 'text-amber-600'}`} />
                  <div className="flex-1">
                    <div className={`font-semibold ${isUrgent ? 'text-orange-900' : 'text-amber-900'}`}>
                      {daysLeft === 1 
                        ? 'Last day of trial!' 
                        : `Only ${daysLeft} days left in your trial`}
                    </div>
                    <div className={`text-sm ${isUrgent ? 'text-orange-700' : 'text-amber-700'}`}>
                      Upgrade now to unlock unlimited leads, properties, and advanced features.
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/pricing"
                className={`
                  px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105
                  ${isExpired 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : isUrgent 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                  }
                `}
              >
                Upgrade Now
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

