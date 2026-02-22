import './globals.css'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { ToastProvider } from '@/components/ui/toast'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { AuthModal } from '@/components/auth/AuthModal'

export const runtime = 'nodejs'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display-loaded',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body-loaded',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tharaga — AI-Powered Real Estate Platform',
  description: 'India\'s first AI-powered zero-commission real estate platform. Connect directly with verified builders and save lakhs on brokerage.',
  metadataBase: new URL('https://tharaga.co.in'),
  openGraph: {
    title: 'Tharaga — AI-Powered Real Estate Platform',
    description: 'India\'s first AI-powered zero-commission real estate platform.',
    url: 'https://tharaga.co.in',
    siteName: 'Tharaga',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tharaga — AI-Powered Real Estate Platform',
    description: 'India\'s first AI-powered zero-commission real estate platform.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable}`}>
      <head>
        <meta name="theme-color" content="#09090b" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="font-body antialiased">
        <NextIntlClientProvider locale="en" messages={{}}>
          <NotificationProvider>
            <ToastProvider>
              {children}
              <AuthModal />
            </ToastProvider>
          </NotificationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
