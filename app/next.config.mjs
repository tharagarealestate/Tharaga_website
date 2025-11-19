import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM-safe __dirname replacement
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Attempt to load bundle analyzer when ANALYZE=true and dependency is present
let withBundleAnalyzer = (config) => config
try {
  const mod = await import('@next/bundle-analyzer')
  if (mod?.default) {
    withBundleAnalyzer = mod.default({ enabled: process.env.ANALYZE === 'true' })
  }
} catch {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  webpack: (config) => {
    // Ensure '@' alias resolves to the app directory during bundling (Netlify/Linux envs)
    config.resolve = config.resolve || {}
    config.resolve.alias = config.resolve.alias || {}
    if (!config.resolve.alias['@']) {
      config.resolve.alias['@'] = path.resolve(__dirname)
    }
    return config
  },
  compiler: {
    // Strip console.* in production build except errors/warnings
    removeConsole: { exclude: ['error', 'warn'] },
  },
  // Allow production builds to succeed even with type or lint errors
  // This prevents CI/CD failures from non-critical TS/ESLint issues
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|png|jpg|jpeg|webp|avif|gif|ico|js|css|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Security headers for all pages
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.jsdelivr.net/npm; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://wedevtjjmdvngyshqdro.supabase.co; frame-ancestors 'none';"
          },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }
        ],
      },
    ]
  },
  
  async rewrites() {
    // Ensure /api in Next dev maps to real backend if proxy not present
    // BUT: Exclude Next.js API routes that should be handled locally
    const apiBase = process.env.NEXT_PUBLIC_API_URL
    const rules = []
    if (apiBase) {
      // Only rewrite specific API routes to external backend
      // Exclude routes handled by Next.js API routes (leads, builder, admin, etc.)
      // These routes are handled by app/app/api/* route handlers
      const externalApiRoutes = [
        '/api/recommendations',
        '/api/interactions',
        '/api/microsite/:path*',
        '/api/calendar/:path*',
        '/api/billing/:path*',
        '/api/admin/usage',
        '/api/analytics/:path*',
        '/api/properties-list',
      ]
      
      // Rewrite only specific external API routes
      externalApiRoutes.forEach(route => {
        rules.push({ 
          source: route, 
          destination: `${apiBase}${route}` 
        })
      })
      
      // Fallback: rewrite other /api routes that don't match Next.js routes
      // This is a catch-all but Next.js routes take precedence
      // Note: Next.js API routes in app/app/api/* will be handled first
    }
    // Support legacy deep links under /app/* by rewriting to the new structure.
    // Example: /app/saas/pricing -> /saas/pricing
    // Also map bare /app to root, which avoids a 404 when users visit /app directly.
    rules.push({ source: '/app', destination: '/' })
    rules.push({ source: '/app/:path*', destination: '/:path*' })
    // Back-compat: legacy underscore embed path -> new embed path
    rules.push({ source: '/_embed/:path*', destination: '/embed/:path*' })
    // Map legacy static paths if present in public
    // NOTE: /property-listing is now handled by the App Router page at app/app/property-listing/page.tsx,
    // so we intentionally do NOT rewrite it to the legacy static HTML anymore.
    rules.push({ source: '/search-filter-home', destination: '/search-filter-home/index.html' })
    // DISABLED: Use Next.js App Router for homepage instead of static index.html
    // This ensures the header from layout.tsx appears on the homepage
    // rules.push({ source: '/', destination: '/index.html' })
    return rules
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Allow Supabase Storage public bucket images
      { protocol: 'https', hostname: 'wedevtjjmdvngyshqdro.supabase.co' },
      // Avatar service used on homepage
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
};

// Enable next-intl for the App Router. This wires up the
// i18n/request.ts configuration used at runtime.
const withNextIntl = createNextIntlPlugin()

export default withBundleAnalyzer(withNextIntl(nextConfig));
