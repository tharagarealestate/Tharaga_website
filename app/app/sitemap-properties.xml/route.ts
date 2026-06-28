import { NextResponse } from 'next/server';
import { sitemapGenerator } from '@/lib/seo/sitemap-generator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Skip during build - env vars not available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }
    const sitemap = await sitemapGenerator.generatePropertiesSitemap();
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Properties sitemap generation error:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}











