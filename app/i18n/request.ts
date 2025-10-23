import {getRequestConfig} from 'next-intl/server'

// Central next-intl request config for the App Router.
// This fixes runtime error: "Couldn't find next-intl config file".
export default getRequestConfig(async ({requestLocale}) => {
  const supportedLocales = ['en', 'ta', 'hi'] as const
  const fallbackLocale = 'en' as const

  let locale = requestLocale
  if (!locale || !supportedLocales.includes(locale as any)) {
    locale = fallbackLocale
  }

  const messages = (await import(`./${locale}.json`)).default

  return {
    locale,
    messages,
    timeZone: 'Asia/Kolkata',
  }
})
