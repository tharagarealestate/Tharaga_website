import './globals.css'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { ToastProvider } from '@/components/ui/toast'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { AuthModal } from '@/components/auth/AuthModal'
import { Suspense } from 'react'

export const runtime = 'nodejs'

const SITE_URL = 'https://tharaga.in'

export const metadata: Metadata = {
  title: {
    default: 'Tharaga Real Estate — Commercial & Land Advisory',
    template: '%s | Tharaga Real Estate',
  },
  description: 'Private commercial real estate and industrial land advisory in Tamil Nadu. Direct advisory for high-extent land parcels, solar power sites, and limestone quarries.',
  metadataBase: new URL(SITE_URL),
  applicationName: 'Tharaga Real Estate',
  keywords: [
    'Tharaga Real Estate',
    'Commercial land Tamil Nadu',
    'Solar ready land Tuticorin',
    'Limestone quarry lease Ariyalur',
    'Industrial land Sriperumbudur Oragadam',
    'Hosur logistics warehouse land',
    'Commercial asset advisory Chennai',
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
    title: 'Tharaga Real Estate — Commercial & Land Advisory',
    description: 'Direct advisory for high-extent commercial land banks, solar power parcels, and limestone quarries across Tamil Nadu.',
    url: SITE_URL,
    siteName: 'Tharaga Real Estate',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/images/tharaga-logo.jpg', width: 1200, height: 630, alt: 'Tharaga Real Estate' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tharaga Real Estate — Commercial & Land Advisory',
    description: 'Direct advisory for high-extent commercial land banks, solar power parcels, and limestone quarries across Tamil Nadu.',
    images: ['/images/tharaga-logo.jpg'],
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
      logo: `${SITE_URL}/images/tharaga-logo.jpg`,
      image: `${SITE_URL}/images/tharaga-logo.jpg`,
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
      name: 'Tharaga Real Estate',
      inLanguage: 'en-IN',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/#projects?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#FAF8F5" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preload" as="image" href="/images/tharaga-logo.jpg" />
        {/* Luxury Perfume Editorial Typography: Instrument Serif, Jost, and Playfair Display */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Jost:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-[#FAF8F5] text-[#1A1816] selection:bg-[#EAE2D2] selection:text-[#1A1816]">
        <NextIntlClientProvider locale="en" messages={{}}>
          <NotificationProvider>
            <ToastProvider>
              <Suspense fallback={null}>
                {children}
              </Suspense>
              <AuthModal />
            </ToastProvider>
          </NotificationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
