import {NextIntlClientProvider} from 'next-intl'
export const runtime = 'edge'
import type {ReactNode} from 'react'

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode
  params: { locale: string }
}) {
  let messages: Record<string, any>
  try {
    messages = (await import(`../../i18n/${locale}.json`)).default
  } catch {
    messages = (await import('../../i18n/en.json')).default
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Kolkata">
      {children}
    </NextIntlClientProvider>
  )
}
