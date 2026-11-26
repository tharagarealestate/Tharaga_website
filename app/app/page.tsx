import type { Metadata } from 'next'
import { HomeClient } from '@/components/home/HomeClient'
import { MANDATES } from '@/lib/mandates'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

const itemList = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Properties represented by Tharaga Estates',
  itemListElement: MANDATES.map((m, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `https://tharaga.in/properties/${m.slug}`,
    name: m.name,
  })),
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <HomeClient />
    </>
  )
}
