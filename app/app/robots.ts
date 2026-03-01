import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/builder/',
          '/admin/',
          '/auth/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/builder/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}











