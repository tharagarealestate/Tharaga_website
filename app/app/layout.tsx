// Brand typography (self-hosted), matched to the Tharaga Estates logo:
// Cinzel = wordmark capitals · Cormorant Garamond = editorial serif · Montserrat = spaced labels
import '@fontsource/cinzel/400.css'
import '@fontsource/cinzel/500.css'
import '@fontsource/cinzel/600.css'
import '@fontsource/cormorant-garamond/300.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/300-italic.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/montserrat/300.css'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
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
    default: 'Tharaga Estates — Commercial & Land Advisory',
    template: '%s | Tharaga Estates',
  },
  description: 'Private commercial real estate and industrial land advisory in Tamil Nadu. Direct advisory for high-extent land parcels, solar power sites, and limestone quarries.',
  metadataBase: new URL(SITE_URL),
  applicationName: 'Tharaga Estates',
  keywords: [
    'Tharaga Estates',
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
    title: 'Tharaga Estates — Commercial & Land Advisory',
    description: 'Direct advisory for high-extent commercial land banks, solar power parcels, and limestone quarries across Tamil Nadu.',
    url: SITE_URL,
    siteName: 'Tharaga Estates',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/brand/tharaga-og.jpg', width: 1200, height: 630, alt: 'Tharaga Estates' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tharaga Estates — Commercial & Land Advisory',
    description: 'Direct advisory for high-extent commercial land banks, solar power parcels, and limestone quarries across Tamil Nadu.',
    images: ['/brand/tharaga-og.jpg'],
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
      name: 'Tharaga Estates',
      url: SITE_URL,
      logo: `${SITE_URL}/brand/tharaga-full-navy.png`,
      image: `${SITE_URL}/brand/tharaga-og.jpg`,
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
      name: 'Tharaga Estates',
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
        <meta name="theme-color" content="#F7F3EC" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-[#F7F3EC] text-[#15213A] selection:bg-[#E6C9A0] selection:text-[#15213A]">
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
