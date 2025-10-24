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
            <a href="/" className="font-extrabold tracking-wide" aria-label={t('brand')} style={{ fontFamily: 'var(--font-display, inherit)', fontSize: '24px' }}>{t('brand').toUpperCase()}</a>
          </div>
          <nav className="flex items-center gap-4 text-sm" aria-label="Primary">
            <a href="/tools/vastu" className="hover:underline">{t('vastu')}</a>
            <a href="/builder" className="hover:underline">{t('builder')}</a>
            <a href="/pricing/" className="hover:underline">{t('pricing')}</a>
            <a href="/about/" className="hover:underline">About</a>
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
