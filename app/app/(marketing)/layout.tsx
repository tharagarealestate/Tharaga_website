import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing - Tharaga Real Estate',
  description: 'Transparent pricing for builders and buyers. Choose your growth path with Tharaga Real Estate platform.',
  openGraph: {
    title: 'Pricing - Tharaga Real Estate',
    description: 'Transparent pricing for builders and buyers. Choose your growth path with Tharaga Real Estate platform.',
    images: [{
      url: 'https://tharaga.co.in/og-pricing.jpg',
      width: 1200,
      height: 630,
      alt: 'Tharaga Pricing',
    }],
    url: 'https://tharaga.co.in/pricing',
    type: 'website',
    siteName: 'Tharaga Real Estate',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing - Tharaga Real Estate',
    description: 'Transparent pricing for builders and buyers. Choose your growth path.',
    images: ['https://tharaga.co.in/og-pricing.jpg'],
  },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

