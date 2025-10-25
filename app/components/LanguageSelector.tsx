"use client"
import { useEffect, useState } from 'react'
import type { Locale } from '@/components/providers/AppI18nProvider'
import { useAppI18n } from '@/components/providers/AppI18nProvider'

export default function LanguageSelector({ className }: { className?: string }) {
  const { locale, setLocale } = useAppI18n()
  const [value, setValue] = useState<Locale>(locale)

  useEffect(() => { setValue(locale) }, [locale])

  return (
    <select
      aria-label="Select language"
      className={className}
      value={value}
      onChange={(e) => setLocale(e.target.value as Locale)}
    >
      <option value="en">English</option>
      <option value="ta">தமிழ்</option>
      <option value="hi">हिन्दी</option>
    </select>
  )
}
