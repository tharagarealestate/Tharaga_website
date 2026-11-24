'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import type { CookiePreferences } from '@/types/legal'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/brand/Button'

const KEY = 'tharaga_cookie_consent'

/** Records consent in the background. Never blocks the UI and never throws. */
function persistConsent(prefs: CookiePreferences) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
    localStorage.setItem(`${KEY}_date`, new Date().toISOString())
  } catch {}

  const gtag = (window as any).gtag
  if (gtag) {
    gtag('consent', 'update', {
      analytics_storage: prefs.analytics ? 'granted' : 'denied',
      ad_storage: prefs.marketing ? 'granted' : 'denied',
    })
  }

  // Fire-and-forget audit record; failures are ignored.
  ;(async () => {
    try {
      const supabase = getSupabase()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      await supabase.from('cookie_consents').insert({
        session_id: crypto.randomUUID(),
        user_id: user?.id || null,
        essential_cookies: true,
        analytics_cookies: prefs.analytics,
        marketing_cookies: prefs.marketing,
        preference_cookies: prefs.preferences,
        user_agent: navigator.userAgent,
      })
    } catch {}
  })()
}

const OPTIONS: { key: keyof CookiePreferences; title: string; body: string; locked?: boolean }[] = [
  { key: 'essential', title: 'Essential', body: 'Keep the site secure and remember your sign-in. Always on.', locked: true },
  { key: 'analytics', title: 'Analytics', body: 'Anonymous visit statistics that help us improve the site.' },
  { key: 'marketing', title: 'Marketing', body: 'Measure our advertising so we reach the right buyers.' },
  { key: 'preferences', title: 'Preferences', body: 'Remember choices such as filters and your shortlist.' },
]

export function CookieConsentBanner() {
  const [show, setShow] = useState(false)
  const [settings, setSettings] = useState(false)
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false,
  })

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(KEY)
    } catch {}
    if (saved) {
      try {
        setPrefs(JSON.parse(saved))
        return
      } catch {}
    }
    const t = setTimeout(() => setShow(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const decide = (p: CookiePreferences) => {
    setShow(false) // close immediately; saving happens in the background
    setSettings(false)
    persistConsent(p)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie preferences"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 bottom-3 z-[90] sm:inset-x-6 sm:bottom-6"
        >
          <div className="mx-auto max-w-5xl border border-[#B0834A]/40 bg-[#F7F3EC] shadow-[0_30px_80px_-30px_rgba(14,23,41,0.55)]">
            <div className="h-[3px] bg-[#15213A]" />
            {!settings ? (
              <div className="flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:gap-10">
                <div className="flex-1">
                  <p className="font-display text-[15px] tracking-[0.06em] text-[#15213A]">Your privacy, your choice</p>
                  <p className="mt-2 font-serif text-[1.08rem] leading-relaxed text-[#2E3648]">
                    We use essential cookies to run this site, and — only with your consent — analytics and marketing
                    cookies. Read our{' '}
                    <Link href="/privacy" className="text-[#94643A] underline decoration-[#B0834A]/50 underline-offset-4 hover:text-[#15213A]">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                  <button
                    type="button"
                    onClick={() => setSettings(true)}
                    className="col-span-2 h-12 font-sans text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[#4A5163] underline decoration-[#B0834A]/50 underline-offset-[6px] hover:text-[#15213A] sm:col-span-1 sm:px-3"
                  >
                    Preferences
                  </button>
                  <Button variant="secondary" onClick={() => decide({ essential: true, analytics: false, marketing: false, preferences: false })}>
                    Essential only
                  </Button>
                  <Button onClick={() => decide({ essential: true, analytics: true, marketing: true, preferences: true })}>
                    Accept all
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-6">
                  <p className="font-display text-lg tracking-[0.06em] text-[#15213A]">Cookie preferences</p>
                  <button
                    type="button"
                    onClick={() => setSettings(false)}
                    className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7D8292] hover:text-[#15213A]"
                  >
                    Back
                  </button>
                </div>
                <ul className="mt-5 divide-y divide-[#D6CAB5] border-y border-[#D6CAB5]">
                  {OPTIONS.map(o => {
                    const on = o.locked || prefs[o.key]
                    return (
                      <li key={o.key} className="flex items-center justify-between gap-6 py-4">
                        <div>
                          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#15213A]">{o.title}</p>
                          <p className="mt-1 font-serif text-[1.02rem] text-[#4A5163]">{o.body}</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={on}
                          aria-label={o.title}
                          disabled={o.locked}
                          onClick={() => setPrefs(p => ({ ...p, [o.key]: !p[o.key] }))}
                          className={`relative h-7 w-12 shrink-0 border transition-colors duration-200 ${
                            on ? 'border-[#15213A] bg-[#15213A]' : 'border-[#A9A190] bg-transparent'
                          } ${o.locked ? 'opacity-60' : ''}`}
                        >
                          <span
                            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 transition-all duration-200 ${
                              on ? 'left-[26px] bg-[#E6C9A0]' : 'left-[4px] bg-[#A9A190]'
                            }`}
                          />
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:flex sm:justify-end">
                  <Button variant="secondary" onClick={() => decide({ essential: true, analytics: false, marketing: false, preferences: false })}>
                    Essential only
                  </Button>
                  <Button onClick={() => decide({ ...prefs, essential: true })}>Save my choices</Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
