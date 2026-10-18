import './globals.css'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { ToastProvider } from '@/components/ui/toast'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { AuthModal } from '@/components/auth/AuthModal'
import { FloatingAIChat } from '@/components/ai/FloatingAIChat'
import { Suspense } from 'react'

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

const SITE_URL = 'https://tharaga.in'

export const metadata: Metadata = {
  title: {
    default: 'Tharaga — AI-Powered Real Estate Platform in Chennai',
    template: '%s | Tharaga',
  },
  description: 'India\'s first AI-powered zero-commission real estate platform. Connect directly with verified builders in Chennai and save lakhs on brokerage.',
  metadataBase: new URL(SITE_URL),
  applicationName: 'Tharaga',
  keywords: [
    'Chennai real estate',
    'flats for sale in Chennai',
    'villas in Chennai',
    'plots in Chennai',
    'zero commission property',
    'verified builders Chennai',
    'new projects Chennai',
    'Tharaga',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'Tharaga — AI-Powered Real Estate Platform',
    description: 'India\'s first AI-powered zero-commission real estate platform.',
    url: SITE_URL,
    siteName: 'Tharaga',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Tharaga Real Estate' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tharaga — AI-Powered Real Estate Platform',
    description: 'India\'s first AI-powered zero-commission real estate platform.',
    images: ['/og-default.jpg'],
  },
  manifest: '/manifest.webmanifest',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'RealEstateAgent',
      '@id': `${SITE_URL}/#organization`,
      name: 'Tharaga Real Estate',
      url: SITE_URL,
      logo: `${SITE_URL}/og-default.jpg`,
      image: `${SITE_URL}/og-default.jpg`,
      telephone: '+91-8870980839',
      email: 'tharagarealestate@gmail.com',
      areaServed: { '@type': 'City', name: 'Chennai' },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Chennai',
        addressRegion: 'Tamil Nadu',
        addressCountry: 'IN',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Tharaga',
      inLanguage: 'en-IN',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/property-listing?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable}`}>
      <head>
        <meta name="theme-color" content="#09090b" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="font-body antialiased">
        <NextIntlClientProvider locale="en" messages={{}}>
          <NotificationProvider>
            <ToastProvider>
              <Suspense fallback={null}>
                {children}
              </Suspense>
              <AuthModal />
              <FloatingAIChat />
            </ToastProvider>
          </NotificationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
