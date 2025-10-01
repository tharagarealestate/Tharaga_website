import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://auth.tharaga.co.in'
  const urls = [
    '',
    '/app',
    '/property-listing/',
    '/buyer-form/',
    '/search-filter-home/',
    '/rating/',
    '/registration/',
    '/builders/add-property',
  ]
  const now = new Date()
  return urls.map(u => ({ url: base + u, lastModified: now, changeFrequency: 'daily', priority: u === '' ? 1 : 0.6 }))
}

