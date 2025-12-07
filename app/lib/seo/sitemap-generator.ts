import { createClient } from '@supabase/supabase-js';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export class SitemapGenerator {
  private supabase: ReturnType<typeof createClient> | null = null;
  private baseUrl: string | null = null;

  private getSupabase(): ReturnType<typeof createClient> {
    if (!this.supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and service role key are required');
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    return this.supabase;
  }

  private getBaseUrl(): string {
    if (!this.baseUrl) {
      this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in';
    }
    return this.baseUrl;
  }

  /**
   * Generate main sitemap index
   */
  async generateSitemapIndex(): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const sitemaps = [
      { loc: `${baseUrl}/sitemap-static.xml`, lastmod: new Date().toISOString() },
      { loc: `${baseUrl}/sitemap-properties.xml`, lastmod: new Date().toISOString() },
      { loc: `${baseUrl}/sitemap-builders.xml`, lastmod: new Date().toISOString() },
      { loc: `${baseUrl}/sitemap-localities.xml`, lastmod: new Date().toISOString() },
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
    const baseUrl = this.getBaseUrl();
    const staticUrls: SitemapUrl[] = [
      { loc: baseUrl, changefreq: 'daily', priority: 1.0 },
      { loc: `${baseUrl}/properties`, changefreq: 'hourly', priority: 0.9 },
      { loc: `${baseUrl}/builders`, changefreq: 'daily', priority: 0.8 },
      { loc: `${baseUrl}/pricing`, changefreq: 'weekly', priority: 0.7 },
      { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: 0.5 },
      { loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: 0.5 },
      { loc: `${baseUrl}/privacy`, changefreq: 'yearly', priority: 0.3 },
      { loc: `${baseUrl}/terms`, changefreq: 'yearly', priority: 0.3 },
    ];

    return this.buildSitemap(staticUrls);
  }

  /**
   * Generate properties sitemap
   */
  async generatePropertiesSitemap(): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const { data: properties } = await this.getSupabase()
      .from('properties')
      .select('slug, updated_at')
      .eq('listing_status', 'active')
      .order('updated_at', { ascending: false })
      .limit(10000);

    const urls: SitemapUrl[] = (properties || []).map((p) => ({
      loc: `${baseUrl}/properties/${p.slug || p.id}`,
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
    const baseUrl = this.getBaseUrl();
    const { data: builders } = await this.getSupabase()
      .from('builder_profiles')
      .select('id, updated_at')
      .eq('is_verified', true)
      .order('updated_at', { ascending: false })
      .limit(5000);

    const urls: SitemapUrl[] = (builders || []).map((b) => ({
      loc: `${baseUrl}/builders/${b.id}`,
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
    const baseUrl = this.getBaseUrl();
    const { data: localities } = await this.getSupabase()
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
        loc: `${baseUrl}/properties/${this.slugify(city)}`,
        changefreq: 'daily',
        priority: 0.8,
      });

      // Locality pages
      for (const locality of localitySet) {
        urls.push({
          loc: `${baseUrl}/properties/${this.slugify(city)}/${this.slugify(locality)}`,
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

// Export lazy singleton
let sitemapGeneratorInstance: SitemapGenerator | null = null;

export const sitemapGenerator = {
  getInstance(): SitemapGenerator {
    if (!sitemapGeneratorInstance) {
      sitemapGeneratorInstance = new SitemapGenerator();
    }
    return sitemapGeneratorInstance;
  },
  generateSitemapIndex: () => sitemapGenerator.getInstance().generateSitemapIndex(),
  generateStaticSitemap: () => sitemapGenerator.getInstance().generateStaticSitemap(),
  generatePropertiesSitemap: () => sitemapGenerator.getInstance().generatePropertiesSitemap(),
  generateBuildersSitemap: () => sitemapGenerator.getInstance().generateBuildersSitemap(),
  generateLocalitiesSitemap: () => sitemapGenerator.getInstance().generateLocalitiesSitemap(),
};



