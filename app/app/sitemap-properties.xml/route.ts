import { NextResponse } from 'next/server';
import { sitemapGenerator } from '@/lib/seo/sitemap-generator';

export async function GET() {
  try {
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








