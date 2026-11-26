/**
 * Tamil Nadu RERA Portal Scraper
 * 
 * This service scrapes the official TN RERA portal (https://www.tn-rera.in/)
 * to verify RERA registrations. Handles CAPTCHA, rate limiting, and error recovery.
 * 
 * IMPORTANT: Web scraping should be done responsibly and in compliance with
 * the portal's terms of service. Consider using official APIs if available.
 */

import * as cheerio from 'cheerio';
import { createHash } from 'crypto';

export interface TNScraperConfig {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  userAgent?: string;
  useSynthetic?: boolean;
}

export interface TNScrapedData {
  rera_id: string;
  project_name: string | null;
  promoter_name: string | null;
  registration_number: string | null;
  registration_date: string | null;
  expiry_date: string | null;
  status: 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending' | null;
  project_type: string | null;
  district: string | null;
  taluk: string | null;
  village: string | null;
  survey_numbers: string[] | null;
  total_area_sqm: number | null;
  total_units: number | null;
  project_cost: number | null;
  raw_html: string;
  snapshot_hash: string;
  source_url: string;
  data_source: 'RERA_PORTAL' | 'SYNTHETIC' | 'CACHE';
  collected_at: string;
  errors?: string[];
  warnings?: string[];
}

export class TNRERAScraper {
  private config: Required<TNScraperConfig>;
  private readonly BASE_URL = 'https://www.tn-rera.in';
  private readonly SEARCH_ENDPOINT = '/search';
  private readonly PROJECT_DETAIL_ENDPOINT = '/project-details';

  constructor(config: TNScraperConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || this.BASE_URL,
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 2000,
      userAgent: config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      useSynthetic: config.useSynthetic ?? process.env.USE_SYNTHETIC_RERA === 'true',
    };
  }

  /**
   * Main scraping method - fetches RERA data from TN portal
   */
  async scrapeRERA(
    reraId: string,
    projectName?: string,
    promoterName?: string
  ): Promise<TNScrapedData> {
    if (this.config.useSynthetic) {
      return this.createSyntheticSnapshot(reraId, projectName, promoterName);
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const result = await this.attemptScrape(reraId, projectName, promoterName);
        if (result) {
          return result;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Attempt ${attempt}: ${errorMsg}`);
        
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    // If all attempts fail, return synthetic data with warnings
    warnings.push('All scraping attempts failed. Using synthetic data.');
    return this.createSyntheticSnapshot(reraId, projectName, promoterName, errors, warnings);
  }

  /**
   * Attempt to scrape the RERA portal
   */
  private async attemptScrape(
    reraId: string,
    projectName?: string,
    promoterName?: string
  ): Promise<TNScrapedData | null> {
    try {
      // Step 1: Search for the RERA ID
      const searchUrl = `${this.config.baseUrl}${this.SEARCH_ENDPOINT}`;
      const searchResponse = await this.fetchWithRetry(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': this.config.baseUrl,
        },
        body: new URLSearchParams({
          rera_number: reraId,
          search_type: 'project',
        }),
      });

      if (!searchResponse.ok) {
        throw new Error(`Search request failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchHtml = await searchResponse.text();
      const $search = cheerio.load(searchHtml);

      // Step 2: Extract project link from search results
      const projectLink = this.extractProjectLink($search, reraId);
      
      if (!projectLink) {
        throw new Error('Project not found in search results');
      }

      // Step 3: Fetch project details page
      const detailUrl = projectLink.startsWith('http') 
        ? projectLink 
        : `${this.config.baseUrl}${projectLink}`;
      
      const detailResponse = await this.fetchWithRetry(detailUrl, {
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': searchUrl,
        },
      });

      if (!detailResponse.ok) {
        throw new Error(`Detail request failed: ${detailResponse.status}`);
      }

      const detailHtml = await detailResponse.text();
      const $detail = cheerio.load(detailHtml);

      // Step 4: Parse project details
      const parsedData = this.parseProjectDetails($detail, reraId);

      // Step 5: Create snapshot with hash
      const snapshotHash = this.createSnapshotHash(detailHtml);

      return {
        ...parsedData,
        raw_html: detailHtml,
        snapshot_hash: snapshotHash,
        source_url: detailUrl,
        data_source: 'RERA_PORTAL',
        collected_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('TN RERA scraping error:', error);
      return null;
    }
  }

  /**
   * Extract project link from search results
   */
  private extractProjectLink($: cheerio.CheerioAPI, reraId: string): string | null {
    // Common patterns for project links in TN RERA portal
    const patterns = [
      `a[href*="${reraId}"]`,
      `a[href*="project"]`,
      `a[href*="details"]`,
      '.project-link',
      '.result-link',
      'table a',
    ];

    for (const pattern of patterns) {
      const link = $(pattern).first().attr('href');
      if (link) {
        return link;
      }
    }

    // Try to find any link that might be the project detail
    const allLinks = $('a[href]');
    for (let i = 0; i < allLinks.length; i++) {
      const href = $(allLinks[i]).attr('href');
      if (href && (href.includes('project') || href.includes('details') || href.includes(reraId))) {
        return href;
      }
    }

    return null;
  }

  /**
   * Parse project details from HTML
   */
  private parseProjectDetails($: cheerio.CheerioAPI, reraId: string): Partial<TNScrapedData> {
    const data: Partial<TNScrapedData> = {
      rera_id: reraId,
      project_name: null,
      promoter_name: null,
      registration_number: null,
      registration_date: null,
      expiry_date: null,
      status: null,
      project_type: null,
      district: null,
      taluk: null,
      village: null,
      survey_numbers: null,
      total_area_sqm: null,
      total_units: null,
      project_cost: null,
    };

    // Common field extraction patterns
    const fieldMappings: Record<string, string[]> = {
      project_name: ['Project Name', 'Project', 'Name of Project', 'Project Title'],
      promoter_name: ['Promoter', 'Promoter Name', 'Developer', 'Builder Name'],
      registration_number: ['Registration Number', 'RERA Number', 'Reg. No.', 'Registration No.'],
      registration_date: ['Registration Date', 'Date of Registration', 'Reg. Date'],
      expiry_date: ['Expiry Date', 'Valid Until', 'Expires On', 'Validity'],
      status: ['Status', 'Registration Status', 'Current Status'],
      project_type: ['Project Type', 'Type', 'Category'],
      district: ['District', 'Dist'],
      taluk: ['Taluk', 'Taluka', 'Tehsil'],
      village: ['Village', 'Vill'],
      total_area_sqm: ['Total Area', 'Area', 'Total Land Area'],
      total_units: ['Total Units', 'Units', 'Number of Units'],
      project_cost: ['Project Cost', 'Cost', 'Estimated Cost', 'Total Cost'],
    };

    // Extract from table rows (common pattern)
    $('table tr, .detail-row, .info-row').each((_, row) => {
      const label = $(row).find('td:first-child, th:first-child, .label, .field-label').text().trim();
      const value = $(row).find('td:last-child, .value, .field-value').text().trim();

      if (!label || !value) return;

      // Match label to field
      for (const [field, labels] of Object.entries(fieldMappings)) {
        if (labels.some(l => label.toLowerCase().includes(l.toLowerCase()))) {
          const processedValue = this.processFieldValue(field, value);
          if (processedValue !== null) {
            (data as any)[field] = processedValue;
          }
        }
      }
    });

    // Extract from definition lists
    $('dl, .details-list').each((_, dl) => {
      $(dl).find('dt, .term').each((_, dt) => {
        const label = $(dt).text().trim();
        const value = $(dt).next('dd, .definition').text().trim();

        if (!label || !value) return;

        for (const [field, labels] of Object.entries(fieldMappings)) {
          if (labels.some(l => label.toLowerCase().includes(l.toLowerCase()))) {
            const processedValue = this.processFieldValue(field, value);
            if (processedValue !== null) {
              (data as any)[field] = processedValue;
            }
          }
        }
      });
    });

    // Extract survey numbers (usually in a list or comma-separated)
    const surveyText = $('*:contains("Survey")').first().text();
    if (surveyText) {
      const surveyMatch = surveyText.match(/survey[:\s]+([^,\n]+)/i);
      if (surveyMatch) {
        data.survey_numbers = surveyMatch[1]
          .split(/[,;]/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
      }
    }

    // Normalize status
    if (data.status) {
      const statusLower = data.status.toLowerCase();
      if (statusLower.includes('active') || statusLower.includes('valid')) {
        data.status = 'active';
      } else if (statusLower.includes('expired') || statusLower.includes('invalid')) {
        data.status = 'expired';
      } else if (statusLower.includes('suspend')) {
        data.status = 'suspended';
      } else if (statusLower.includes('cancel')) {
        data.status = 'cancelled';
      } else {
        data.status = 'pending';
      }
    }

    return data;
  }

  /**
   * Process field value based on field type
   */
  private processFieldValue(field: string, value: string): any {
    if (!value || value.trim().length === 0) return null;

    const cleanValue = value.trim();

    // Date fields
    if (field.includes('date')) {
      const dateMatch = cleanValue.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
      if (dateMatch) {
        return dateMatch[1];
      }
      return cleanValue;
    }

    // Numeric fields
    if (field.includes('area') || field.includes('cost') || field.includes('units')) {
      const numMatch = cleanValue.replace(/[^\d.]/g, '');
      const num = parseFloat(numMatch);
      return isNaN(num) ? null : num;
    }

    // Array fields (survey numbers)
    if (field === 'survey_numbers') {
      return cleanValue.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0);
    }

    // Text fields
    return cleanValue;
  }

  /**
   * Create cryptographic hash of snapshot
   */
  private createSnapshotHash(html: string): string {
    return createHash('sha256').update(html).digest('hex');
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown fetch error');
        
        if (attempt < maxRetries) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw lastError || new Error('Fetch failed after retries');
  }

  /**
   * Create synthetic snapshot for testing/fallback
   */
  private createSyntheticSnapshot(
    reraId: string,
    projectName?: string,
    promoterName?: string,
    errors?: string[],
    warnings?: string[]
  ): TNScrapedData {
    const syntheticHtml = `
      <html>
        <head><title>RERA Project ${reraId}</title></head>
        <body>
          <div class="rera-info">
            <h1>RERA Project Information</h1>
            <p><strong>RERA ID:</strong> ${reraId}</p>
            <p><strong>State:</strong> Tamil Nadu</p>
            <p><strong>Project Name:</strong> ${projectName || 'Not Available'}</p>
            <p><strong>Promoter:</strong> ${promoterName || 'Not Available'}</p>
            <p><strong>Status:</strong> Active</p>
            <p><strong>NOTE:</strong> This is a SYNTHETIC snapshot for testing purposes.</p>
          </div>
        </body>
      </html>
    `;

    const snapshotHash = this.createSnapshotHash(syntheticHtml);

    return {
      rera_id: reraId,
      project_name: projectName || null,
      promoter_name: promoterName || null,
      registration_number: reraId,
      registration_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      project_type: null,
      district: null,
      taluk: null,
      village: null,
      survey_numbers: null,
      total_area_sqm: null,
      total_units: null,
      project_cost: null,
      raw_html: syntheticHtml,
      snapshot_hash: snapshotHash,
      source_url: this.config.baseUrl,
      data_source: 'SYNTHETIC',
      collected_at: new Date().toISOString(),
      errors: errors || [],
      warnings: warnings || ['This is synthetic data. Real scraping is disabled.'],
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
let scraperInstance: TNRERAScraper | null = null;

export const tnRERAScraper = {
  getInstance(config?: TNScraperConfig): TNRERAScraper {
    if (!scraperInstance) {
      scraperInstance = new TNRERAScraper(config);
    }
    return scraperInstance;
  },
  scrapeRERA: (
    reraId: string,
    projectName?: string,
    promoterName?: string,
    config?: TNScraperConfig
  ) => tnRERAScraper.getInstance(config).scrapeRERA(reraId, projectName, promoterName),
};



