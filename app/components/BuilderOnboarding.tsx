"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { getSupabase } from '@/lib/supabase'
import { trackEvent } from '@/lib/analytics'

type MaybeMeta = { onboarding_completed?: boolean; [k: string]: any }

export function BuilderOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false)
  const supabaseRef = useRef<ReturnType<typeof getSupabase> | null>(null)

  useEffect(() => {
    supabaseRef.current = getSupabase()
  }, [])

  const steps = useMemo(() => [
    {
      element: '#sidebar-leads',
      popover: {
        title: 'Leads Dashboard 🎯',
        description:
          'All your property inquiries appear here. Each lead is scored by our AI from 1-10 based on purchase intent.',
        position: 'right',
      },
    },
    {
      element: '#trial-progress',
      popover: {
        title: 'Your Trial Progress 📊',
        description:
          "You get 10 free leads during your 14-day trial. No credit card needed! After that, choose a plan that works for you.",
        position: 'bottom',
      },
    },
    {
      element: '#add-property-button',
      popover: {
        title: 'List Your First Property 🏠',
        description:
          'Click here to add a property. The faster you list, the faster leads start coming in. Most builders get their first lead within 24 hours!',
        position: 'left',
        onNext: () => {
          trackEvent('onboarding_step', 'engagement', { step: 'add_property_shown' })
        },
      },
    },
    {
      element: '#pipeline-board',
      popover: {
        title: 'Drag-and-Drop Pipeline 🎨',
        description: 'Move leads through stages with drag-and-drop. Track your sales progress visually.',
        position: 'top',
      },
    },
    {
      element: '#notifications-bell',
      popover: {
        title: 'Real-Time Notifications 🔔',
        description:
          "You'll get instant notifications for new leads, site visits, and important updates. Enable browser notifications for best experience.",
        position: 'bottom',
      },
    },
  ], [])

  useEffect(() => {
    async function checkAndRun() {
      try {
        // Prefer server state; fall back to localStorage
        const localSeen = typeof window !== 'undefined' && localStorage.getItem('builder_onboarding_completed') === 'true'
        let seen = localSeen

        const supabase = supabaseRef.current
        const { data: auth } = await supabase!.auth.getUser()
        const user = auth?.user
        if (user) {
          try {
            const { data } = await supabase!
              .from('profiles')
              .select('metadata')
              .eq('id', user.id)
              .single()
            const md = (data?.metadata as MaybeMeta) || null
            if (md && typeof md.onboarding_completed === 'boolean') {
              seen = !!md.onboarding_completed
            }
          } catch {
            // Column may not exist yet; ignore
          }
        }

        setHasSeenOnboarding(seen)

        if (!seen) {
          // Delay for smoother experience
          const timer = window.setTimeout(() => {
            const drv = driver({
              showProgress: true,
              steps: steps as any,
              allowClose: true,
              onDestroyed: async () => {
                // Try to persist completion
                try { localStorage.setItem('builder_onboarding_completed', 'true') } catch {}
                try {
                  if (user) {
                    // Attempt to upsert metadata if the column exists
                    await supabase!
                      .from('profiles')
                      .update({ metadata: { onboarding_completed: true } as any })
                      .eq('id', user.id)
                  }
                } catch { /* ignore */ }

                try {
                  // Celebrate (lazy import). This is optional; ignore on failure.
                  const mod = await import('canvas-confetti').catch(() => null as any)
                  if (mod && typeof mod === 'function') {
                    mod({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
                  } else if (mod && typeof mod.default === 'function') {
                    mod.default({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
                  }
                } catch {}

                trackEvent('onboarding_completed', 'engagement', { actor: 'builder' })

                try {
                  // Last resort notification
                  if (typeof window !== 'undefined') {
                    // eslint-disable-next-line no-alert
                    window.alert('Welcome to Tharaga! 🎉 Ready to get your first lead?')
                  }
                } catch {}
              },
            })
            drv.drive()
          }, 2000)
          return () => window.clearTimeout(timer)
        }
      } catch {
        // ignore
      }
    }

    checkAndRun()
  }, [steps])

  // Allow replay via a custom event
  useEffect(() => {
    function onReplay() {
      const drv = driver({ showProgress: true, steps: steps as any, allowClose: true })
      drv.drive()
    }
    window.addEventListener('thg:showOnboarding', onReplay)
    return () => window.removeEventListener('thg:showOnboarding', onReplay)
  }, [steps])

  return null
}
