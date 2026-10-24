/**
 * Module 9: Behavioral Signal Tracker
 * - Session-based (sessionStorage UUID)
 * - Captures: page_view, scroll_depth, time_on_page, exit, cta_click, property_view
 * - Extracts fbclid → _fbc cookie (Meta spec)
 * - Fires via navigator.sendBeacon on exit (unload)
 * - Sends to /api/track (Next.js API → Supabase behavioral_signals)
 */

const TRACK_ENDPOINT = '/api/track'
const SCROLL_THRESHOLDS = [25, 50, 75, 100]
const MIN_TRACK_INTERVAL = 2000 // ms between duplicate sends

type SignalType =
  | 'page_view'
  | 'scroll_depth'
  | 'time_on_page'
  | 'exit'
  | 'cta_click'
  | 'property_view'
  | 'search'
  | 'lead_form_open'
  | 'lead_form_submit'

interface SignalPayload {
  session_id: string
  signal_type: SignalType
  signal_value: Record<string, unknown>
  page_url: string
  property_id?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  fbclid?: string
  gclid?: string
  fbc?: string
  fbp?: string
}

// ── Cookie helpers ─────────────────────────────────────────────────────────
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

// ── UTM + fbclid extraction ────────────────────────────────────────────────
function extractUrlParams(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const result: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid']) {
    const val = params.get(key)
    if (val) result[key] = val
  }
  return result
}

function buildFbcCookie(fbclid: string): string {
  // Meta _fbc format: fb.1.{timestamp}.{fbclid}
  const ts = Math.floor(Date.now() / 1000)
  return `fb.1.${ts}.${fbclid}`
}

// ── Session management ─────────────────────────────────────────────────────
function getOrCreateSession(): string {
  if (typeof window === 'undefined') return 'server'
  const key = 'tharaga_session_id'
  let sid = sessionStorage.getItem(key)
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem(key, sid)
  }
  return sid
}

// ── BehaviorTracker class ─────────────────────────────────────────────────
export class BehaviorTracker {
  private sessionId: string
  private urlParams: Record<string, string>
  private fbc: string | null
  private fbp: string | null
  private pageStartTime: number
  private scrolledThresholds: Set<number>
  private lastSentAt: number
  private pageUrl: string
  private cleanupFns: (() => void)[] = []

  constructor() {
    this.sessionId = getOrCreateSession()
    this.urlParams = extractUrlParams()
    this.pageStartTime = Date.now()
    this.scrolledThresholds = new Set()
    this.lastSentAt = 0
    this.pageUrl = typeof window !== 'undefined' ? window.location.href : ''

    // Persist fbclid → _fbc cookie (90 days per Meta spec)
    if (this.urlParams.fbclid) {
      const fbc = buildFbcCookie(this.urlParams.fbclid)
      setCookie('_fbc', fbc, 90)
    }
    // Store UTMs in sessionStorage for lead form attribution
    if (typeof sessionStorage !== 'undefined') {
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid']
      for (const key of utmKeys) {
        if (this.urlParams[key]) sessionStorage.setItem(`tharaga_${key}`, this.urlParams[key])
      }
    }

    this.fbc = getCookie('_fbc')
    this.fbp = getCookie('_fbp')
  }

  private buildPayload(type: SignalType, value: Record<string, unknown>, propertyId?: string): SignalPayload {
    return {
      session_id: this.sessionId,
      signal_type: type,
      signal_value: value,
      page_url: this.pageUrl,
      property_id: propertyId,
      utm_source: this.urlParams.utm_source || sessionStorage?.getItem('tharaga_utm_source') || undefined,
      utm_medium: this.urlParams.utm_medium || sessionStorage?.getItem('tharaga_utm_medium') || undefined,
      utm_campaign: this.urlParams.utm_campaign || sessionStorage?.getItem('tharaga_utm_campaign') || undefined,
      utm_content: this.urlParams.utm_content || undefined,
      utm_term: this.urlParams.utm_term || undefined,
      fbclid: this.urlParams.fbclid || sessionStorage?.getItem('tharaga_fbclid') || undefined,
      gclid: this.urlParams.gclid || sessionStorage?.getItem('tharaga_gclid') || undefined,
      fbc: this.fbc || undefined,
      fbp: this.fbp || undefined,
    }
  }

  private async send(payload: SignalPayload): Promise<void> {
    const now = Date.now()
    if (now - this.lastSentAt < MIN_TRACK_INTERVAL) return
    this.lastSentAt = now
    try {
      await fetch(TRACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      })
    } catch {
      // Silent fail — tracking must never break UX
    }
  }

  private sendBeacon(payload: SignalPayload): void {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) return
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    navigator.sendBeacon(TRACK_ENDPOINT, blob)
  }

  /** Track a page view immediately */
  trackPageView(): void {
    this.send(this.buildPayload('page_view', {
      title: typeof document !== 'undefined' ? document.title : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    }))
  }

  /** Track a property detail page view */
  trackPropertyView(propertyId: string, propertyTitle?: string): void {
    this.send(this.buildPayload('property_view', { title: propertyTitle }, propertyId))
  }

  /** Track a CTA click (buttons, links) */
  trackCtaClick(label: string, href?: string): void {
    this.send(this.buildPayload('cta_click', { label, href }))
  }

  /** Track search query */
  trackSearch(query: string, resultCount?: number): void {
    this.send(this.buildPayload('search', { query, result_count: resultCount }))
  }

  /** Track lead form open */
  trackLeadFormOpen(propertyId?: string): void {
    this.send(this.buildPayload('lead_form_open', {}, propertyId))
  }

  /** Track lead form submit */
  trackLeadFormSubmit(propertyId?: string): void {
    this.send(this.buildPayload('lead_form_submit', {}, propertyId))
  }

  /** Start scroll depth monitoring */
  startScrollTracking(): void {
    const handler = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return
      const pct = Math.round((scrollTop / docHeight) * 100)

      for (const threshold of SCROLL_THRESHOLDS) {
        if (pct >= threshold && !this.scrolledThresholds.has(threshold)) {
          this.scrolledThresholds.add(threshold)
          this.send(this.buildPayload('scroll_depth', { percent: threshold, page_url: this.pageUrl }))
        }
      }
    }
    window.addEventListener('scroll', handler, { passive: true })
    this.cleanupFns.push(() => window.removeEventListener('scroll', handler))
  }

  /** Start exit intent tracking (sends via sendBeacon) */
  startExitTracking(): void {
    const beforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - this.pageStartTime) / 1000)
      const payload = this.buildPayload('exit', { time_on_page_seconds: timeOnPage })
      this.sendBeacon(payload)
    }
    const visibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const timeOnPage = Math.round((Date.now() - this.pageStartTime) / 1000)
        const payload = this.buildPayload('time_on_page', { seconds: timeOnPage })
        this.sendBeacon(payload)
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('visibilitychange', visibilityChange)
    this.cleanupFns.push(() => {
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('visibilitychange', visibilityChange)
    })
  }

  /** Initialize all tracking. Call once per page. */
  init(): void {
    if (typeof window === 'undefined') return
    this.trackPageView()
    this.startScrollTracking()
    this.startExitTracking()
  }

  /** Clean up event listeners (call on page unmount) */
  destroy(): void {
    for (const fn of this.cleanupFns) fn()
    this.cleanupFns = []
  }
}

// ── Singleton instance ────────────────────────────────────────────────────
let _tracker: BehaviorTracker | null = null

export function getTracker(): BehaviorTracker {
  if (!_tracker) _tracker = new BehaviorTracker()
  return _tracker
}

/** Get stored UTM params from sessionStorage for lead form pre-fill */
export function getStoredAttribution(): Record<string, string> {
  if (typeof sessionStorage === 'undefined') return {}
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid']
  const result: Record<string, string> = {}
  for (const key of keys) {
    const val = sessionStorage.getItem(`tharaga_${key}`)
    if (val) result[key] = val
  }
  return result
}

/** Get fbc and fbp cookies for CAPI dedup */
export function getMetaCookies(): { fbc: string | null; fbp: string | null } {
  return { fbc: getCookie('_fbc'), fbp: getCookie('_fbp') }
}
