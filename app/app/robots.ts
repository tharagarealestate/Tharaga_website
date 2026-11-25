import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard/', '/builder/', '/admin/', '/auth/', '/private/'] }],
    sitemap: 'https://tharaga.in/sitemap.xml',
    host: 'https://tharaga.in',
  }
}
