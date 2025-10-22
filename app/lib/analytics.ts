'use client'

type EventProps = Record<string, unknown>

export function trackEvent(event: string, category?: string, props?: EventProps) {
  try {
    if (typeof window === 'undefined') return
    const payload = { ...(props || {}), category }
    const anyWin = window as unknown as { thgTrack?: (e: string, p?: EventProps) => void; gtag?: (...args: any[]) => void }
    if (typeof anyWin.thgTrack === 'function') {
      anyWin.thgTrack(event, { ...payload })
    } else if (typeof anyWin.gtag === 'function') {
      anyWin.gtag('event', event, { ...payload })
    } else if (typeof console !== 'undefined' && (console as any).debug) {
      console.debug('[trackEvent]', event, payload)
    }
  } catch {}
}

export function setOnce(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}

export function getItem(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
