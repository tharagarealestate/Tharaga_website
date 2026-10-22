import './globals.css'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { ToastProvider } from '@/components/ui/toast'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { AuthModal } from '@/components/auth/AuthModal'
import { FloatingAIChat } from '@/components/ai/FloatingAIChat'
import { Suspense } from 'react'

export const runtime = 'nodejs'

const SITE_URL = 'https://tharaga.in'

export const metadata: Metadata = {
  title: {
    default: 'Tharaga Institutional — Commercial & Industrial Asset Advisory',
    template: '%s | Tharaga Institutional',
  },
  description: 'Private commercial real estate and industrial asset advisory in Tamil Nadu. Direct syndication of industrial land banks, solar power parcels, and limestone quarries to MNC conglomerates and institutional capital.',
  metadataBase: new URL(SITE_URL),
  applicationName: 'Tharaga Institutional',
  keywords: [
    'Commercial land Tamil Nadu',
    'Solar ready land Tuticorin',
    'Limestone quarry for cement MNCs',
    'Industrial land Sriperumbudur Oragadam',
    'Hosur logistics warehouse land',
    'Commercial asset syndication',
    'Institutional real estate advisory Chennai',
    'Tharaga Institutional',
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
    title: 'Tharaga Institutional — Commercial & Industrial Asset Advisory',
    description: 'Direct syndication of industrial land banks, solar power parcels, and limestone quarries to MNC conglomerates and institutional capital.',
    url: SITE_URL,
    siteName: 'Tharaga Institutional',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Tharaga Institutional Asset Advisory' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tharaga Institutional — Commercial & Industrial Asset Advisory',
    description: 'Direct syndication of industrial land banks, solar power parcels, and limestone quarries to MNC conglomerates and institutional capital.',
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
      name: 'Tharaga Institutional Asset Advisory',
      url: SITE_URL,
      logo: `${SITE_URL}/og-default.jpg`,
      image: `${SITE_URL}/og-default.jpg`,
      telephone: '+91-8870980839',
      email: 'advisory@tharaga.in',
      areaServed: { '@type': 'State', name: 'Tamil Nadu' },
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
      name: 'Tharaga Institutional',
      inLanguage: 'en-IN',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/#mandates?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#09090b" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&display=swap" />
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
