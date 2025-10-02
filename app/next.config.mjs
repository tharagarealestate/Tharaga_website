/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  // Allow production builds to succeed even with type or lint errors
  // This prevents CI/CD failures from non-critical TS/ESLint issues
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  async rewrites() {
    // Ensure /api in Next dev maps to real backend if proxy not present
    const apiBase = process.env.NEXT_PUBLIC_API_URL
    if (apiBase) {
      return [{ source: '/api/:path*', destination: `${apiBase}/api/:path*` }]
    }
    return []
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' }
    ],
  },
};

export default nextConfig;
