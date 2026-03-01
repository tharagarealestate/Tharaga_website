import type { MetadataRoute } from 'next'
import { getSupabase } from '@/lib/supabase'

const base = 'https://tharaga.co.in'

/**
 * Enhanced sitemap with dynamic routes from Supabase
 * Includes:
 * - Static pages (weekly changefreq)
 * - All active properties (daily changefreq)
 * - All verified builder profiles (weekly changefreq)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const urls: MetadataRoute.Sitemap = []

  // Static pages with weekly changefreq
  const staticPages = [
    { path: '', priority: 1.0 },
    { path: '/property-listing', priority: 0.9 },
    { path: '/pricing', priority: 0.8 },
    { path: '/about', priority: 0.7 },
    { path: '/contact', priority: 0.7 },
    { path: '/privacy', priority: 0.5 },
    { path: '/terms', priority: 0.5 },
  ]

  staticPages.forEach(({ path, priority }) => {
    urls.push({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority,
    })
  })

  try {
    const supabase = getSupabase()

    // Fetch all active properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, updated_at, created_at, listing_status')
      .in('listing_status', ['active', 'verified', 'published'])
      .order('updated_at', { ascending: false })
      .limit(10000) // Limit to prevent sitemap from being too large

    if (!propertiesError && properties) {
      properties.forEach((property) => {
        urls.push({
          url: `${base}/properties/${property.id}`,
          lastModified: property.updated_at ? new Date(property.updated_at) : new Date(property.created_at),
          changeFrequency: 'daily',
          priority: 0.8,
        })
      })
    }

    // Fetch all verified builder profiles
    const { data: builders, error: buildersError } = await supabase
      .from('builder_profiles')
      .select('user_id, updated_at, created_at, verification_status')
      .eq('verification_status', 'verified')
      .order('updated_at', { ascending: false })
      .limit(1000)

    if (!buildersError && builders) {
      builders.forEach((builder) => {
        urls.push({
          url: `${base}/builders/${builder.user_id}`,
          lastModified: builder.updated_at ? new Date(builder.updated_at) : new Date(builder.created_at),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      })
    }
  } catch (error) {
    console.error('Error generating dynamic sitemap routes:', error)
    // Continue with static pages even if dynamic routes fail
  }

  return urls
}

