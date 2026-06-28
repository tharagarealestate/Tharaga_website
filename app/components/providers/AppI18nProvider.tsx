"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import enMessages from '@/i18n/en.json'
import taMessages from '@/i18n/ta.json'
import hiMessages from '@/i18n/hi.json'

export type Locale = 'en' | 'ta' | 'hi'

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

function getStoredLocale(): Locale {
  try {
    const val = (localStorage.getItem('thg.lang') || '').trim()
    if (val === 'ta' || val === 'hi' || val === 'en') return val
  } catch (_) {}
  return 'en'
}

const ALL_MESSAGES: Record<Locale, Record<string, any>> = {
  en: enMessages as any,
  ta: taMessages as any,
  hi: hiMessages as any,
}

export function AppI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    setLocaleState(getStoredLocale())
  }, [])

  const setLocale = useCallback((next: Locale) => {
    try { localStorage.setItem('thg.lang', next) } catch (_) {}
    setLocaleState(next)
  }, [])

  const messages = useMemo(() => ALL_MESSAGES[locale] || enMessages, [locale])

  const ctx: I18nContextValue = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return (
    <I18nContext.Provider value={ctx}>
      <NextIntlClientProvider locale={locale} messages={messages as any} timeZone="Asia/Kolkata">
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  )
}

export function useAppI18n() {
  const v = useContext(I18nContext)
  if (!v) throw new Error('useAppI18n must be used within AppI18nProvider')
  return v
}
