// =============================================
// REAL-TIME BEHAVIOR TRACKING HOOK
// Production-ready with batching, debouncing, and error handling
// =============================================

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { UserBehavior } from '@/types/lead-generation'

// =============================================
// TYPES
// =============================================

interface BehaviorEvent {
  behavior_type: UserBehavior['behavior_type']
  property_id?: string
  duration?: number
  metadata?: Record<string, any>
}

interface TrackingConfig {
  batchSize: number // Number of events before auto-flush
  batchInterval: number // Milliseconds before auto-flush
  enableDebug: boolean
  autoCalculateScore: boolean // Auto-trigger score calculation
}

interface BehaviorTrackingHook {
  trackBehavior: (event: BehaviorEvent) => Promise<void>
  trackPropertyView: (propertyId: string, metadata?: Record<string, any>) => Promise<void>
  trackSearch: (searchQuery: string, filters: Record<string, any>) => Promise<void>
  trackFormInteraction: (formName: string, fieldName: string) => Promise<void>
  trackContactClick: (type: 'phone' | 'email' | 'whatsapp', propertyId?: string) => Promise<void>
  trackPropertySave: (propertyId: string) => Promise<void>
  trackPropertyCompare: (propertyIds: string[]) => Promise<void>
  trackFilterApplied: (filterType: string, filterValue: any) => Promise<void>
  flush: () => Promise<void> // Manually flush pending events
  isTracking: boolean
  pendingCount: number
}

// =============================================
// DEFAULT CONFIGURATION
// =============================================

const DEFAULT_CONFIG: TrackingConfig = {
  batchSize: 10, // Flush after 10 events
  batchInterval: 5000, // Flush every 5 seconds
  enableDebug: process.env.NODE_ENV === 'development',
  autoCalculateScore: true,
}

// =============================================
// UUID GENERATION (compatible with codebase patterns)
// =============================================

function generateUUID(): string {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback: generate UUID-like string compatible with Supabase
  const rand = Math.random().toString(36).slice(2)
  const time = Date.now().toString(36)
  return `${time}-${rand}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

// =============================================
// MAIN HOOK
// =============================================

export function useBehaviorTracking(
  config: Partial<TrackingConfig> = {}
): BehaviorTrackingHook {
  const supabase = getSupabase()

  // Merge config with defaults
  const fullConfig = { ...DEFAULT_CONFIG, ...config }

  // State
  const [isTracking, setIsTracking] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)

  // Refs to avoid re-renders
  const sessionId = useRef<string>(generateUUID())
  const eventQueue = useRef<UserBehavior[]>([])
  const flushTimer = useRef<NodeJS.Timeout | null>(null)
  const startTime = useRef<number>(Date.now())
  const lastActivityTime = useRef<number>(Date.now())

  // =============================================
  // GET CURRENT USER
  // =============================================

  useEffect(() => {
    let mounted = true

    async function loadUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (mounted && user && !error) {
          setCurrentUser({ id: user.id })
        } else if (mounted) {
          setCurrentUser(null)
        }
      } catch (error) {
        if (fullConfig.enableDebug) {
          console.warn('[BehaviorTracking] Failed to get user:', error)
        }
        if (mounted) {
          setCurrentUser(null)
        }
      }
    }

    loadUser()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setCurrentUser(session?.user ? { id: session.user.id } : null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fullConfig.enableDebug])

  // =============================================
  // DEVICE DETECTION
  // =============================================

  const getDeviceType = useCallback((): 'mobile' | 'tablet' | 'desktop' => {
    if (typeof window === 'undefined') return 'desktop'

    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }, [])

  // =============================================
  // TRIGGER SCORE CALCULATION (EDGE FUNCTION OR RPC)
  // =============================================

  const triggerScoreCalculation = useCallback(
    async (userId: string): Promise<void> => {
      if (!fullConfig.autoCalculateScore) return

      try {
        // Call the scoring function (gracefully handle if it doesn't exist)
        const { error } = await supabase.rpc('calculate_lead_score', {
          p_user_id: userId,
        })

        if (error) {
          // Don't log if function doesn't exist - it's optional
          if (
            fullConfig.enableDebug &&
            !error.message?.includes('function') &&
            !error.message?.includes('does not exist')
          ) {
            console.warn('[BehaviorTracking] Score calculation failed:', error)
          }
        } else if (fullConfig.enableDebug) {
          console.log('[BehaviorTracking] Score calculation triggered')
        }
      } catch (error) {
        // Silently fail if RPC doesn't exist
        if (fullConfig.enableDebug) {
          console.debug('[BehaviorTracking] Score trigger skipped:', error)
        }
      }
    },
    [supabase, fullConfig]
  )

  // =============================================
  // FLUSH QUEUE TO DATABASE
  // =============================================

  const flush = useCallback(async (): Promise<void> => {
    if (eventQueue.current.length === 0) return
    if (!currentUser?.id) {
      if (fullConfig.enableDebug) {
        console.debug('[BehaviorTracking] No user, skipping flush')
      }
      return
    }

    const eventsToFlush = [...eventQueue.current]
    eventQueue.current = [] // Clear queue immediately
    setPendingCount(0)

    setIsTracking(true)

    try {
      // Batch insert all events
      const { error } = await supabase.from('user_behavior').insert(eventsToFlush)

      if (error) {
        console.error('[BehaviorTracking] Failed to insert events:', error)
        // Re-add to queue on failure
        eventQueue.current.push(...eventsToFlush)
        setPendingCount(eventQueue.current.length)
        throw error
      }

      if (fullConfig.enableDebug) {
        console.log(`[BehaviorTracking] Flushed ${eventsToFlush.length} events`)
      }

      // Trigger score recalculation if enabled
      if (fullConfig.autoCalculateScore) {
        await triggerScoreCalculation(currentUser.id)
      }
    } catch (error) {
      console.error('[BehaviorTracking] Flush failed:', error)
    } finally {
      setIsTracking(false)
    }
  }, [currentUser, supabase, fullConfig, triggerScoreCalculation])

  // =============================================
  // SCHEDULE AUTO-FLUSH
  // =============================================

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) {
      clearTimeout(flushTimer.current)
    }

    flushTimer.current = setTimeout(() => {
      flush()
    }, fullConfig.batchInterval)
  }, [flush, fullConfig.batchInterval])

  // =============================================
  // CORE TRACKING FUNCTION
  // =============================================

  const trackBehavior = useCallback(
    async (event: BehaviorEvent): Promise<void> => {
      if (!currentUser?.id) {
        if (fullConfig.enableDebug) {
          console.debug('[BehaviorTracking] No user logged in, skipping event')
        }
        return
      }

      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityTime.current
      lastActivityTime.current = now

      // Calculate duration (time since last activity, capped at 5 minutes)
      const duration =
        event.duration || Math.min(timeSinceLastActivity / 1000, 300)

      const behaviorRecord: UserBehavior = {
        id: generateUUID(),
        user_id: currentUser.id,
        behavior_type: event.behavior_type,
        property_id: event.property_id || null,
        timestamp: new Date().toISOString(),
        duration,
        metadata: {
          ...event.metadata,
          user_agent:
            typeof navigator !== 'undefined' ? navigator.userAgent : null,
          referrer:
            typeof document !== 'undefined' ? document.referrer || null : null,
          page_url:
            typeof window !== 'undefined' ? window.location.href : null,
        },
        session_id: sessionId.current,
        device_type: getDeviceType(),
        created_at: new Date().toISOString(),
      }

      // Add to queue
      eventQueue.current.push(behaviorRecord)
      setPendingCount(eventQueue.current.length)

      if (fullConfig.enableDebug) {
        console.log(
          '[BehaviorTracking] Event queued:',
          behaviorRecord.behavior_type
        )
      }

      // Auto-flush if batch size reached
      if (eventQueue.current.length >= fullConfig.batchSize) {
        await flush()
      } else {
        scheduleFlush()
      }
    },
    [currentUser, fullConfig, flush, scheduleFlush, getDeviceType]
  )

  // =============================================
  // CONVENIENCE TRACKING FUNCTIONS
  // =============================================

  const trackPropertyView = useCallback(
    async (
      propertyId: string,
      metadata?: Record<string, any>
    ): Promise<void> => {
      await trackBehavior({
        behavior_type: 'property_view',
        property_id: propertyId,
        metadata: {
          ...metadata,
          viewed_at: new Date().toISOString(),
        },
      })
    },
    [trackBehavior]
  )

  const trackSearch = useCallback(
    async (
      searchQuery: string,
      filters: Record<string, any>
    ): Promise<void> => {
      await trackBehavior({
        behavior_type: 'search',
        metadata: {
          query: searchQuery,
          filters,
          results_count: filters.resultsCount || 0,
        },
      })
    },
    [trackBehavior]
  )

  const trackFormInteraction = useCallback(
    async (formName: string, fieldName: string): Promise<void> => {
      await trackBehavior({
        behavior_type: 'form_interaction',
        metadata: {
          form_name: formName,
          field_name: fieldName,
          interaction_type: 'focus', // or 'input', 'submit'
        },
      })
    },
    [trackBehavior]
  )

  const trackContactClick = useCallback(
    async (
      type: 'phone' | 'email' | 'whatsapp',
      propertyId?: string
    ): Promise<void> => {
      const behaviorTypeMap = {
        phone: 'phone_clicked' as const,
        email: 'email_clicked' as const,
        whatsapp: 'whatsapp_clicked' as const,
      }

      await trackBehavior({
        behavior_type: behaviorTypeMap[type],
        property_id: propertyId,
        metadata: {
          contact_type: type,
          clicked_at: new Date().toISOString(),
        },
      })
    },
    [trackBehavior]
  )

  const trackPropertySave = useCallback(
    async (propertyId: string): Promise<void> => {
      await trackBehavior({
        behavior_type: 'saved_property',
        property_id: propertyId,
        metadata: {
          action: 'save',
          saved_at: new Date().toISOString(),
        },
      })
    },
    [trackBehavior]
  )

  const trackPropertyCompare = useCallback(
    async (propertyIds: string[]): Promise<void> => {
      await trackBehavior({
        behavior_type: 'compared_properties',
        metadata: {
          property_ids: propertyIds,
          comparison_count: propertyIds.length,
          compared_at: new Date().toISOString(),
        },
      })
    },
    [trackBehavior]
  )

  const trackFilterApplied = useCallback(
    async (filterType: string, filterValue: any): Promise<void> => {
      await trackBehavior({
        behavior_type: 'filter_applied',
        metadata: {
          filter_type: filterType,
          filter_value: filterValue,
          applied_at: new Date().toISOString(),
        },
      })
    },
    [trackBehavior]
  )

  // =============================================
  // AUTO-FLUSH ON UNMOUNT & PAGE UNLOAD
  // =============================================

  useEffect(() => {
    // Flush on page unload (user leaving site)
    const handleBeforeUnload = () => {
      if (eventQueue.current.length > 0 && currentUser?.id) {
        // Use sendBeacon for guaranteed delivery
        const eventsToSend = eventQueue.current.map((event) => ({
          ...event,
          // Add session end metadata
          metadata: {
            ...event.metadata,
            session_end: true,
            session_duration: Date.now() - startTime.current,
          },
        }))

        // Attempt to send via sendBeacon to tracking flush endpoint
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          try {
            const blob = new Blob(
              [JSON.stringify({ events: eventsToSend, user_id: currentUser.id })],
              { type: 'application/json' }
            )
            // Use the dedicated tracking flush endpoint
            const apiUrl =
              process.env.NEXT_PUBLIC_API_URL || ''
            const endpoint = apiUrl
              ? `${apiUrl}/api/tracking/flush`
              : '/api/tracking/flush'
            navigator.sendBeacon(endpoint, blob)
            
            if (fullConfig.enableDebug) {
              console.log(
                `[BehaviorTracking] Sent ${eventsToSend.length} events via sendBeacon`
              )
            }
          } catch (error) {
            if (fullConfig.enableDebug) {
              console.warn('[BehaviorTracking] sendBeacon failed:', error)
            }
          }
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    // Cleanup: flush remaining events
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
      if (flushTimer.current) {
        clearTimeout(flushTimer.current)
      }
      // Synchronously flush if possible
      if (eventQueue.current.length > 0 && currentUser?.id) {
        flush().catch(() => {
          // Silently fail on unmount
        })
      }
    }
  }, [flush, currentUser, fullConfig.enableDebug])

  // =============================================
  // RETURN HOOK INTERFACE
  // =============================================

  return {
    trackBehavior,
    trackPropertyView,
    trackSearch,
    trackFormInteraction,
    trackContactClick,
    trackPropertySave,
    trackPropertyCompare,
    trackFilterApplied,
    flush,
    isTracking,
    pendingCount,
  }
}

// =============================================
// EXPORT NAMED TYPES
// =============================================

export type { BehaviorEvent, TrackingConfig, BehaviorTrackingHook }

