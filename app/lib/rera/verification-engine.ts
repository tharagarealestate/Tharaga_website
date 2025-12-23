/**
 * RERA Verification Engine
 * 
 * Orchestrates the complete RERA verification process:
 * 1. Format validation
 * 2. Portal scraping/API verification
 * 3. Document verification (OCR)
 * 4. Confidence scoring
 * 5. Database storage
 */

import { createClient } from '@supabase/supabase-js';
import { tnRERAScraper, TNScrapedData } from './tn-rera-scraper';
import { z } from 'zod';

// Validation schemas
const RERA_PATTERNS: Record<string, RegExp> = {
  'Tamil Nadu': /^TN\/\d{2}\/(Building|Layout|Plot)\/\d{4,6}\/\d{4}$/i,
  'Karnataka': /^PRM\/KA\/RERA\/\d{4}\/\d{4,6}$/i,
  'Maharashtra': /^P\d{8,11}$/i,
  'Gujarat': /^PR\/GJ\/\d{4}\/\d{4,6}$/i,
  'Telangana': /^P\d{8,11}$/i,
  'Kerala': /^K-RERA\/\d{4}\/\d{4,6}$/i,
  'Delhi': /^DL\/\d{2}\/\d{4}\/\d{6}$/i,
  'Punjab': /^PB\/\d{2}\/\d{4}\/\d{6}$/i,
  'Haryana': /^HR\/\d{2}\/\d{4}\/\d{6}$/i,
  'Rajasthan': /^RJ\/\d{2}\/\d{4}\/\d{6}$/i,
  'Uttar Pradesh': /^UP\/\d{2}\/\d{4}\/\d{6}$/i,
  'West Bengal': /^WB\/\d{2}\/\d{4}\/\d{6}$/i,
};

const VerifyReraInputSchema = z.object({
  reraNumber: z.string().min(5).max(100),
  state: z.string().default('Tamil Nadu'),
  type: z.enum(['builder', 'project', 'agent']).default('builder'),
  builderId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  projectName: z.string().optional(),
  promoterName: z.string().optional(),
  documentUrl: z.string().url().optional(),
  forceRefresh: z.boolean().default(false),
});

export type VerifyReraInput = z.infer<typeof VerifyReraInputSchema>;

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  registrationId?: string;
  data?: {
    reraNumber: string;
    registeredName: string;
    registrationType: string;
    registrationDate: string | null;
    expiryDate: string | null;
    promoterName: string | null;
    promoterType: string | null;
    registeredAddress: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    isActive: boolean;
    complianceScore: number;
    complaintsCount: number;
    projectName: string | null;
    projectType: string | null;
    district: string | null;
    status: string | null;
  };
  verificationMethod: 'api' | 'manual' | 'partner' | 'cached' | 'scraper';
  confidence: number;
  source: string;
  error?: string;
  warnings?: string[];
  snapshot?: TNScrapedData;
}

export class RERAVerificationEngine {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and service role key are required');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Main verification entry point
   */
  async verify(input: VerifyReraInput): Promise<VerificationResult> {
    const startTime = Date.now();

    // Step 1: Validate input
    const validation = VerifyReraInputSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        verified: false,
        verificationMethod: 'api',
        confidence: 0,
        source: 'validation',
        error: validation.error.errors[0].message,
      };
    }

    const { reraNumber, state, type, builderId, propertyId, projectName, promoterName, documentUrl, forceRefresh } = validation.data;

    // Step 2: Validate RERA format
    const formatValidation = this.validateFormat(reraNumber, state);
    if (!formatValidation.valid) {
      return {
        success: false,
        verified: false,
        verificationMethod: 'api',
        confidence: 0,
        source: 'format_validation',
        error: formatValidation.error,
        warnings: formatValidation.warnings,
      };
    }

    // Step 3: Check cache (unless force refresh)
    if (!forceRefresh) {
      const cached = await this.getCachedVerification(reraNumber, state);
      if (cached && this.isCacheValid(cached)) {
        return {
          success: true,
          verified: cached.verification_status === 'verified' || cached.verified === true,
          registrationId: cached.id,
          data: this.mapToResponse(cached),
          verificationMethod: 'cached',
          confidence: 0.95,
          source: 'cache',
        };
      }
    }

    // Step 4: Try partner API (if configured)
    const partnerResult = await this.tryPartnerAPI(reraNumber, state, type);
    if (partnerResult.success && partnerResult.verified) {
      await this.saveVerificationResult(partnerResult, builderId, propertyId, 'partner');
      return partnerResult;
    }

    // Step 5: Scrape RERA portal
    const scraperResult = await this.scrapeRERAPortal(reraNumber, state, projectName, promoterName);
    
    // Step 6: Verify document (if provided)
    let documentVerification = null;
    if (documentUrl) {
      documentVerification = await this.verifyDocument(documentUrl, reraNumber);
    }

    // Step 7: Calculate confidence
    const confidence = this.calculateConfidence(scraperResult, documentVerification, partnerResult);

    // Step 8: Determine verification status
    const verified = confidence >= 0.8 && scraperResult?.status === 'active';

    // Step 9: Save to database
    const savedResult = await this.saveVerificationResult(
      {
        success: true,
        verified,
        data: scraperResult ? this.mapScrapedToResponse(scraperResult, reraNumber, type) : undefined,
        verificationMethod: 'scraper',
        confidence,
        source: scraperResult?.data_source || 'unknown',
        snapshot: scraperResult,
      },
      builderId,
      propertyId,
      'scraper'
    );

    // Step 10: Log verification attempt
    await this.logVerification({
      reraRegistrationId: savedResult.registrationId,
      reraNumber,
      verificationType: 'scraper',
      verificationStatus: verified ? 'success' : 'failed',
      found: scraperResult !== null,
      statusOnPortal: scraperResult?.status || null,
      expiryStatus: this.getExpiryStatus(scraperResult?.expiry_date),
      apiResponse: scraperResult ? { snapshot: scraperResult } : null,
      responseTimeMs: Date.now() - startTime,
    });

    return {
      ...savedResult,
      warnings: scraperResult?.warnings,
      snapshot: scraperResult,
    };
  }

  /**
   * Validate RERA number format
   */
  private validateFormat(reraNumber: string, state: string): {
    valid: boolean;
    error?: string;
    warnings?: string[];
  } {
    const pattern = RERA_PATTERNS[state];
    const warnings: string[] = [];
    
    if (!reraNumber || reraNumber.length < 5) {
      return { valid: false, error: 'RERA number is too short' };
    }
    
    if (reraNumber.length > 100) {
      return { valid: false, error: 'RERA number is too long' };
    }

    if (pattern && !pattern.test(reraNumber)) {
      warnings.push(`RERA number format may not match ${state} pattern`);
    }

    if (/[<>"'&]/.test(reraNumber)) {
      return { valid: false, error: 'RERA number contains invalid characters' };
    }

    return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
  }

  /**
   * Get cached verification
   */
  private async getCachedVerification(reraNumber: string, state: string) {
    const { data, error } = await this.supabase
      .from('rera_registrations')
      .select('*')
      .eq('rera_number', reraNumber.toUpperCase())
      .eq('rera_state', state)
      .single();

    if (error || !data) return null;
    return data;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(cached: any): boolean {
    if (!cached.updated_at) return false;
    
    const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (cached.verification_status !== 'verified' && cached.verified !== true) {
      return cacheAge < 24 * 60 * 60 * 1000; // 24 hours for unverified
    }
    
    return cacheAge < maxAge;
  }

  /**
   * Try partner API verification (uses our own internal service)
   */
  private async tryPartnerAPI(
    reraNumber: string,
    state: string,
    type: string
  ): Promise<VerificationResult> {
    try {
      // Use our own internal partner API service
      const { reraPartnerAPIService } = await import('./partner-api-service');
      
      const result = await reraPartnerAPIService.verify({
        rera_number: reraNumber,
        state: state,
        type: type,
      });

      if (result.found && result.data) {
        return {
          success: true,
          verified: result.data.status === 'active',
          data: {
            reraNumber: reraNumber,
            registeredName: result.data.registered_name,
            registrationType: type,
            registrationDate: result.data.registration_date,
            expiryDate: result.data.expiry_date,
            promoterName: result.data.promoter_name,
            promoterType: result.data.promoter_type || 'company',
            registeredAddress: result.data.address,
            contactEmail: result.data.email || null,
            contactPhone: result.data.phone || null,
            isActive: result.data.status === 'active',
            complianceScore: result.data.compliance_score || 100,
            complaintsCount: result.data.complaints || 0,
            projectName: result.data.project_name || null,
            projectType: result.data.project_type || null,
            district: result.data.district || null,
            status: result.data.status,
          },
          verificationMethod: 'partner',
          confidence: result.cached ? 0.98 : 0.95,
          source: result.source === 'cache' ? 'partner_cache' : 'partner_api',
        };
      }

      return {
        success: false,
        verified: false,
        verificationMethod: 'partner',
        confidence: 0,
        source: 'partner_api',
        error: result.message || 'RERA number not found',
      };
    } catch (error) {
      console.error('Partner API error:', error);
      return {
        success: false,
        verified: false,
        verificationMethod: 'partner',
        confidence: 0,
        source: 'partner_api',
        error: error instanceof Error ? error.message : 'Partner API unavailable',
      };
    }
  }

  /**
   * Scrape RERA portal
   */
  private async scrapeRERAPortal(
    reraNumber: string,
    state: string,
    projectName?: string,
    promoterName?: string
  ): Promise<TNScrapedData | null> {
    try {
      // For now, only TN scraper is implemented
      if (state === 'Tamil Nadu' || state === 'TN') {
        const scraper = tnRERAScraper.getInstance({
          useSynthetic: process.env.USE_SYNTHETIC_RERA === 'true',
        });
        return await scraper.scrapeRERA(reraNumber, projectName, promoterName);
      }

      // For other states, return null (would need state-specific scrapers)
      return null;
    } catch (error) {
      console.error('RERA scraping error:', error);
      return null;
    }
  }

  /**
   * Verify document using OCR
   */
  private async verifyDocument(documentUrl: string, expectedRERA: string): Promise<{
    rera_found: boolean;
    rera_matches: boolean;
    confidence: number;
    notes: string;
  }> {
    try {
      // TODO: Implement actual OCR verification
      // This would use Google Cloud Vision API, Tesseract.js, or similar
      // For now, return mock data
      
      return {
        rera_found: true,
        rera_matches: true,
        confidence: 0.95,
        notes: 'Document OCR verification (mock - implement actual OCR)',
      };
    } catch (error) {
      console.error('Document verification error:', error);
      return {
        rera_found: false,
        rera_matches: false,
        confidence: 0,
        notes: 'Unable to verify document',
      };
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    scraperResult: TNScrapedData | null,
    documentVerification: { rera_matches: boolean; confidence: number } | null,
    partnerResult: VerificationResult
  ): number {
    let score = 0;

    // Scraper result (70% weight)
    if (scraperResult) {
      if (scraperResult.data_source === 'RERA_PORTAL') {
        score += 0.7;
      } else if (scraperResult.data_source === 'SYNTHETIC') {
        score += 0.3; // Lower confidence for synthetic
      }

      if (scraperResult.status === 'active') {
        score += 0.1;
      }
    }

    // Document verification (20% weight)
    if (documentVerification?.rera_matches) {
      score += 0.2 * documentVerification.confidence;
    }

    // Partner API (10% weight if available)
    if (partnerResult.success && partnerResult.verified) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Get expiry status
   */
  private getExpiryStatus(expiryDate: string | null | undefined): 'valid' | 'expiring_soon' | 'expired' | null {
    if (!expiryDate) return null;

    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring_soon';
    return 'valid';
  }

  /**
   * Save verification result to database
   */
  private async saveVerificationResult(
    result: VerificationResult,
    builderId?: string,
    propertyId?: string,
    method?: string
  ): Promise<VerificationResult> {
    if (!result.data) {
      // Queue for manual verification
      return await this.queueManualVerification(
        result.snapshot?.rera_id || 'unknown',
        'Tamil Nadu',
        'builder',
        builderId,
        propertyId
      );
    }

    const { data, error } = await this.supabase
      .from('rera_registrations')
      .upsert({
        rera_number: result.data.reraNumber.toUpperCase(),
        rera_state: 'Tamil Nadu',
        registration_type: result.data.registrationType,
        builder_id: builderId,
        property_id: propertyId,
        verification_status: result.verified ? 'verified' : 'pending',
        verified: result.verified,
        verification_method: method || result.verificationMethod,
        verification_date: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
        verification_source: result.source,
        registered_name: result.data.registeredName,
        registration_date: result.data.registrationDate,
        expiry_date: result.data.expiryDate,
        promoter_name: result.data.promoterName,
        promoter_type: result.data.promoterType,
        registered_address: result.data.registeredAddress,
        contact_email: result.data.contactEmail,
        contact_phone: result.data.contactPhone,
        is_active: result.data.isActive,
        status: result.data.status || (result.data.isActive ? 'active' : 'pending'),
        compliance_score: result.data.complianceScore,
        complaints_count: result.data.complaintsCount,
        project_name: result.data.projectName,
        project_type: result.data.projectType,
        district: result.data.district,
        raw_data: result.snapshot ? {
          snapshot: result.snapshot,
          confidence: result.confidence,
        } : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'rera_number,rera_state',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save verification result:', error);
      return {
        ...result,
        success: false,
        error: 'Failed to save verification result',
      };
    }

    return {
      ...result,
      registrationId: data.id,
    };
  }

  /**
   * Queue for manual verification
   */
  private async queueManualVerification(
    reraNumber: string,
    state: string,
    type: string,
    builderId?: string,
    propertyId?: string
  ): Promise<VerificationResult> {
    const { data, error } = await this.supabase
      .from('rera_registrations')
      .upsert({
        rera_number: reraNumber.toUpperCase(),
        rera_state: state,
        registration_type: type,
        builder_id: builderId,
        property_id: propertyId,
        verification_status: 'pending',
        verification_method: 'manual',
        metadata: {
          queued_at: new Date().toISOString(),
          automated_attempts: ['partner', 'scraper'],
        },
      }, {
        onConflict: 'rera_number,rera_state',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to queue manual verification:', error);
      return {
        success: false,
        verified: false,
        verificationMethod: 'manual',
        confidence: 0,
        source: 'manual_queue',
        error: 'Failed to queue for manual verification',
      };
    }

    // Create alert for admin
    await this.supabase.from('rera_alerts').insert({
      rera_registration_id: data.id,
      builder_id: builderId,
      alert_type: 'verification_failed',
      alert_priority: 'medium',
      title: 'Manual RERA Verification Required',
      message: `RERA number ${reraNumber} requires manual verification`,
      action_required: 'Verify RERA registration manually via official portal',
    });

    return {
      success: true,
      verified: false,
      registrationId: data.id,
      verificationMethod: 'manual',
      confidence: 0,
      source: 'manual_queue',
      warnings: [
        'RERA verification is pending manual review',
        'You will be notified once verification is complete',
        'Expected turnaround: 24-48 hours',
      ],
    };
  }

  /**
   * Log verification attempt
   */
  private async logVerification(log: {
    reraRegistrationId?: string;
    reraNumber: string;
    verificationType: string;
    verificationStatus: string;
    found: boolean;
    statusOnPortal: string | null;
    expiryStatus: 'valid' | 'expiring_soon' | 'expired' | null;
    apiResponse: any;
    responseTimeMs: number;
  }): Promise<void> {
    await this.supabase.from('rera_verification_logs').insert({
      rera_registration_id: log.reraRegistrationId,
      rera_number: log.reraNumber,
      verification_type: log.verificationType,
      verification_status: log.verificationStatus,
      found: log.found,
      status_on_portal: log.statusOnPortal,
      expiry_status: log.expiryStatus,
      api_response: log.apiResponse,
      response_time_ms: log.responseTimeMs,
      verified_at: new Date().toISOString(),
    });
  }

  /**
   * Map database record to response format
   */
  private mapToResponse(cached: any): VerificationResult['data'] {
    return {
      reraNumber: cached.rera_number,
      registeredName: cached.registered_name,
      registrationType: cached.registration_type,
      registrationDate: cached.registration_date,
      expiryDate: cached.expiry_date,
      promoterName: cached.promoter_name,
      promoterType: cached.promoter_type,
      registeredAddress: cached.registered_address,
      contactEmail: cached.contact_email,
      contactPhone: cached.contact_phone,
      isActive: cached.is_active,
      complianceScore: cached.compliance_score || 100,
      complaintsCount: cached.complaints_count || 0,
      projectName: cached.project_name,
      projectType: cached.project_type,
      district: cached.district,
      status: cached.status,
    };
  }

  /**
   * Map scraped data to response format
   */
  private mapScrapedToResponse(
    scraped: TNScrapedData,
    reraNumber: string,
    type: string
  ): VerificationResult['data'] {
    return {
      reraNumber: reraNumber,
      registeredName: scraped.project_name || scraped.promoter_name || null,
      registrationType: type,
      registrationDate: scraped.registration_date,
      expiryDate: scraped.expiry_date,
      promoterName: scraped.promoter_name,
      promoterType: null,
      registeredAddress: null,
      contactEmail: null,
      contactPhone: null,
      isActive: scraped.status === 'active',
      complianceScore: scraped.status === 'active' ? 100 : 50,
      complaintsCount: 0,
      projectName: scraped.project_name,
      projectType: scraped.project_type,
      district: scraped.district,
      status: scraped.status || 'pending',
    };
  }
}

// Export singleton instance
let engineInstance: RERAVerificationEngine | null = null;

export const reraVerificationEngine = {
  getInstance(): RERAVerificationEngine {
    if (!engineInstance) {
      engineInstance = new RERAVerificationEngine();
    }
    return engineInstance;
  },
  verify: (...args: Parameters<RERAVerificationEngine['verify']>) =>
    reraVerificationEngine.getInstance().verify(...args),
};

