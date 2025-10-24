"use client"

import { useTranslations } from 'next-intl'
import LanguageSelector from '@/components/LanguageSelector'

export default function SiteHeader() {
  const t = useTranslations('nav')
  return (
    <header role="banner" className="sticky top-0 z-50 text-white border-b border-white/10" style={{ background: 'linear-gradient(180deg, rgba(110,13,37,.82), rgba(110,13,37,.66))', backdropFilter: 'blur(12px) saturate(1.25)' }}>
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-3">
            <a href="/" className="font-extrabold tracking-wide" aria-label={t('brand')} style={{ fontFamily: 'var(--font-display, inherit)', fontSize: '24px' }}>{t('brand')}</a>
          </div>
          <nav className="flex items-center gap-4 text-sm" aria-label="Primary">
            {/* Features dropdown */}
            <details className="relative group">
              <summary className="list-none cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-white/10">
                <span>{t('features')}</span>
                <span className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-6 border-t-white/90 group-open:-rotate-180 transition-transform" aria-hidden="true"></span>
              </summary>
              <div className="absolute right-0 mt-2 min-w-[240px] bg-white/98 text-black rounded-xl border border-white/20 shadow-xl p-2 z-50 opacity-0 translate-y-[-6px] scale-[.98] invisible group-open:opacity-100 group-open:translate-y-0 group-open:scale-100 group-open:visible transition">
                <div className="h-[3px] rounded-t-xl bg-gradient-to-r from-gold-500 to-rose-700" aria-hidden="true"></div>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/vastu">{t('vastu')}</a>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/environment">{t('env')}</a>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/voice-tamil">{t('tamilVoice')}</a>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/verification">{t('verification', { default: 'Verification' })}</a>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/roi">{t('roi')}</a>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/currency-risk">{t('fx')}</a>
                <div className="my-1 h-px bg-black/10 md:hidden" aria-hidden="true"></div>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5 md:hidden" href="/pricing/">{t('pricing')}</a>
                <a className="block px-3 py-2 rounded-lg hover:bg-black/5 md:hidden" href="/about/">{t('about')}</a>
              </div>
            </details>
            <span className="hidden md:inline-block w-px h-4 bg-white/30" aria-hidden="true"></span>
            <a href="/builder" className="hover:underline">{t('builder')}</a>
            <a href="/pricing/" className="hover:underline">{t('pricing')}</a>
            <span className="hidden md:inline-block w-px h-4 bg-white/30" aria-hidden="true"></span>
            <a href="/about/" className="hover:underline">{t('about')}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSelector className="rounded-full border border-white/80 bg-transparent text-white text-xs px-2 py-1" />
            <a href="/login_signup_glassdrop/" className="inline-flex items-center gap-2 rounded-full border border-white/90 px-3 py-2 text-sm font-semibold hover:bg-white/10">Login / Signup</a>
          </div>
        </div>
      </div>
    </header>
  )
}
