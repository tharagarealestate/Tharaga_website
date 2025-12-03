import { createClient } from '@supabase/supabase-js';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export class SitemapGenerator {
  private supabase: ReturnType<typeof createClient>;
  private baseUrl: string;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in';
  }

  /**
   * Generate main sitemap index
   */
  async generateSitemapIndex(): Promise<string> {
    const sitemaps = [
      { loc: `${this.baseUrl}/sitemap-static.xml`, lastmod: new Date().toISOString() },
      { loc: `${this.baseUrl}/sitemap-properties.xml`, lastmod: new Date().toISOString() },
      { loc: `${this.baseUrl}/sitemap-builders.xml`, lastmod: new Date().toISOString() },
      { loc: `${this.baseUrl}/sitemap-localities.xml`, lastmod: new Date().toISOString() },
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;
  }

  /**
   * Generate static pages sitemap
   */
  async generateStaticSitemap(): Promise<string> {
    const staticUrls: SitemapUrl[] = [
      { loc: this.baseUrl, changefreq: 'daily', priority: 1.0 },
      { loc: `${this.baseUrl}/properties`, changefreq: 'hourly', priority: 0.9 },
      { loc: `${this.baseUrl}/builders`, changefreq: 'daily', priority: 0.8 },
      { loc: `${this.baseUrl}/pricing`, changefreq: 'weekly', priority: 0.7 },
      { loc: `${this.baseUrl}/about`, changefreq: 'monthly', priority: 0.5 },
      { loc: `${this.baseUrl}/contact`, changefreq: 'monthly', priority: 0.5 },
      { loc: `${this.baseUrl}/privacy`, changefreq: 'yearly', priority: 0.3 },
      { loc: `${this.baseUrl}/terms`, changefreq: 'yearly', priority: 0.3 },
    ];

    return this.buildSitemap(staticUrls);
  }

  /**
   * Generate properties sitemap
   */
  async generatePropertiesSitemap(): Promise<string> {
    const { data: properties } = await this.supabase
      .from('properties')
      .select('slug, updated_at')
      .eq('listing_status', 'active')
      .order('updated_at', { ascending: false })
      .limit(10000);

    const urls: SitemapUrl[] = (properties || []).map((p) => ({
      loc: `${this.baseUrl}/properties/${p.slug || p.id}`,
      lastmod: p.updated_at,
      changefreq: 'weekly' as const,
      priority: 0.8,
    }));

    return this.buildSitemap(urls);
  }

  /**
   * Generate builders sitemap
   */
  async generateBuildersSitemap(): Promise<string> {
    const { data: builders } = await this.supabase
      .from('builder_profiles')
      .select('id, updated_at')
      .eq('is_verified', true)
      .order('updated_at', { ascending: false })
      .limit(5000);

    const urls: SitemapUrl[] = (builders || []).map((b) => ({
      loc: `${this.baseUrl}/builders/${b.id}`,
      lastmod: b.updated_at,
      changefreq: 'weekly' as const,
      priority: 0.7,
    }));

    return this.buildSitemap(urls);
  }

  /**
   * Generate localities sitemap
   */
  async generateLocalitiesSitemap(): Promise<string> {
    const { data: localities } = await this.supabase
      .from('properties')
      .select('city, locality')
      .eq('listing_status', 'active');

    const uniqueLocalities = new Map<string, Set<string>>();

    for (const p of localities || []) {
      if (!uniqueLocalities.has(p.city)) {
        uniqueLocalities.set(p.city, new Set());
      }
      if (p.locality) {
        uniqueLocalities.get(p.city)!.add(p.locality);
      }
    }

    const urls: SitemapUrl[] = [];

    for (const [city, localitySet] of uniqueLocalities) {
      // City page
      urls.push({
        loc: `${this.baseUrl}/properties/${this.slugify(city)}`,
        changefreq: 'daily',
        priority: 0.8,
      });

      // Locality pages
      for (const locality of localitySet) {
        urls.push({
          loc: `${this.baseUrl}/properties/${this.slugify(city)}/${this.slugify(locality)}`,
          changefreq: 'daily',
          priority: 0.7,
        });
      }
    }

    return this.buildSitemap(urls);
  }

  /**
   * Build sitemap XML
   */
  private buildSitemap(urls: SitemapUrl[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;
  }

  /**
   * Slugify string
   */
  private slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

// Export singleton
export const sitemapGenerator = new SitemapGenerator();



