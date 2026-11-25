import type { MetadataRoute } from 'next'
import { MANDATES } from '@/lib/mandates'

const base = 'https://tharaga.in'

/** Every public page of the site, including one entry per property page. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const pages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/properties`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/feasibility`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/refund`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]
  const properties: MetadataRoute.Sitemap = MANDATES.map(m => ({
    url: `${base}/properties/${m.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: m.featured ? 0.9 : 0.8,
  }))
  return [...pages, ...properties]
}
