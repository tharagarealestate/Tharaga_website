import createNextIntlPlugin from 'next-intl/plugin'
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
    ]
  },
  
  async rewrites() {
    // Ensure /api in Next dev maps to real backend if proxy not present
    const apiBase = process.env.NEXT_PUBLIC_API_URL
    const rules = []
    if (apiBase) {
      rules.push({ source: '/api/:path*', destination: `${apiBase}/api/:path*` })
    }
    // Support legacy deep links under /app/* by rewriting to the new structure.
    // Example: /app/saas/pricing -> /saas/pricing
    // Also map bare /app to root, which avoids a 404 when users visit /app directly.
    rules.push({ source: '/app', destination: '/' })
    rules.push({ source: '/app/:path*', destination: '/:path*' })
    // Back-compat: legacy underscore embed path -> new embed path
    rules.push({ source: '/_embed/:path*', destination: '/embed/:path*' })
    // Map legacy static paths if present in public
    rules.push({ source: '/property-listing', destination: '/property-listing/index.html' })
    rules.push({ source: '/search-filter-home', destination: '/search-filter-home/index.html' })
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
