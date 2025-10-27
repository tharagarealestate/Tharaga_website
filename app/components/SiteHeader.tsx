"use client"

import { useTranslations } from 'next-intl'

export default function SiteHeader() {
  const t = useTranslations('nav')
  return (
    <header
      role="banner"
      className="sticky top-0 z-50 text-white border-b border-white/10"
      style={{
        background: 'linear-gradient(180deg, rgba(110,13,37,.82), rgba(110,13,37,.66))',
        backdropFilter: 'blur(12px) saturate(1.25)'
      }}
    >
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 py-2">
          {/* Left: Brand + trust pill (matches homepage) */}
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="font-extrabold tracking-wide"
              aria-label={t('brand')}
              style={{ fontFamily: 'var(--font-display, inherit)', fontSize: '24px' }}
            >
              THARAGA
            </a>
            <span className="hidden md:inline-flex items-center gap-2 rounded-full bg-white text-black border border-white/80 px-2 py-1 text-[12px]">
              <span>Verified</span>
              <span aria-hidden>•</span>
              <span>Broker‑free</span>
            </span>
          </div>

          {/* Center: Primary nav (identical items to homepage) */}
          <nav className="flex items-center gap-3 sm:gap-4 text-sm font-bold" aria-label="Primary">
            {/* Features dropdown */}
            <details className="relative group">
              <summary className="list-none cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-white/10">
                <span>Features</span>
                <span
                  className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white/90 transition-transform group-open:-rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="absolute right-0 mt-2 min-w-[240px] bg-white/98 text-black rounded-xl border border-white/20 shadow-xl p-2 z-50 opacity-0 -translate-y-1 scale-95 invisible transition group-open:opacity-100 group-open:translate-y-0 group-open:scale-100 group-open:visible">
                <div className="h-[3px] rounded-t-xl bg-gradient-to-r from-gold-500 to-rose-700" aria-hidden="true" />
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/vastu/">Vastu</a>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/environment/">Climate & environment</a>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/voice-tamil/">Voice (Tamil)</a>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/verification/">Verification</a>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/roi/">ROI</a>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/currency-risk/">Currency risk</a>
                <div className="my-1 h-px bg-black/10 md:hidden" aria-hidden="true" />
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5 md:hidden" href="/pricing/">Pricing</a>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5 md:hidden" href="/about/">About</a>
              </div>
            </details>
            <span className="hidden md:inline-block w-px h-4 bg-white/30" aria-hidden="true" />
            {/* Portal dropdown (Builder + Buyer Dashboard) */}
            <details className="relative group">
              <summary
                className="list-none cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-white/10"
                aria-haspopup="menu"
              >
                <span>Portal</span>
                <span
                  className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white/90 transition-transform group-open:-rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div
                role="menu"
                aria-label="Portal menu"
                className="absolute right-0 mt-2 min-w-[240px] bg-white/98 text-black rounded-xl border border-white/20 shadow-xl p-2 z-50 opacity-0 -translate-y-1 scale-95 invisible transition group-open:opacity-100 group-open:translate-y-0 group-open:scale-100 group-open:visible"
              >
                <div className="h-[3px] rounded-t-xl bg-gradient-to-r from-gold-500 to-rose-700" aria-hidden="true" />
                <a role="menuitem" tabIndex={0} className="block px-3 py-2 rounded-lg hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-rose-600/40" href="/builder">Builder Dashboard</a>
                <a role="menuitem" tabIndex={0} className="block px-3 py-2 rounded-lg hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-rose-600/40" href="/my-dashboard">Buyer Dashboard</a>
              </div>
            </details>
            <span className="hidden md:inline-block w-px h-4 bg-white/30" aria-hidden="true" />
            <a href="/pricing/" className="hover:underline">Pricing</a>
            <span className="hidden md:inline-block w-px h-4 bg-white/30" aria-hidden="true" />
            <a href="/about/" className="hover:underline">About</a>
          </nav>

          {/* Right: Auth button (opens modal, no redirect) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                try {
                  const next = location.pathname + location.search
                  const g = (window as any).authGate
                  if (g && typeof g.openLoginModal === 'function') {
                    g.openLoginModal({ next })
                    return
                  }
                  if (typeof (window as any).__thgOpenAuthModal === 'function') {
                    ;(window as any).__thgOpenAuthModal({ next })
                    return
                  }
                  location.href = '/login_signup_glassdrop/?next=' + encodeURIComponent(next)
                } catch {
                  location.href = '/login_signup_glassdrop/'
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/90 px-3 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Login / Signup
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
