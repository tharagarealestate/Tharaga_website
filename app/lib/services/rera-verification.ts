import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// RERA Number validation schemas by state
const RERA_PATTERNS: Record<string, RegExp> = {
  'Tamil Nadu': /^TN\/\d{2}\/Building\/\d{4,6}\/\d{4}$/i,
  'Karnataka': /^PRM\/KA\/RERA\/\d{4}\/\d{4,6}$/i,
  'Maharashtra': /^P\d{8}$/i,
  'Gujarat': /^PR\/GJ\/\d{4}\/\d{4,6}$/i,
  'Telangana': /^P\d{8}$/i,
  'Kerala': /^K-RERA\/\d{4}\/\d{4,6}$/i,
};

// Verification request schema
const VerifyReraSchema = z.object({
  reraNumber: z.string().min(5).max(100),
  state: z.string().default('Tamil Nadu'),
  type: z.enum(['builder', 'project', 'agent']).default('builder'),
  builderId: z.string().uuid().optional(),
  forceRefresh: z.boolean().default(false),
});

type VerifyReraInput = z.infer<typeof VerifyReraSchema>;

interface ReraVerificationResult {
  success: boolean;
  verified: boolean;
  registrationId?: string;
  data?: {
    reraNumber: string;
    registeredName: string;
    registrationType: string;
    registrationDate: string;
    expiryDate: string;
    promoterName: string;
    promoterType: string;
    registeredAddress: string;
    contactEmail: string;
    contactPhone: string;
    isActive: boolean;
    complianceScore: number;
    complaintsCount: number;
  };
  verificationMethod: 'api' | 'manual' | 'partner' | 'cached';
  confidence: number;
  source: string;
  error?: string;
  warnings?: string[];
}

export class ReraVerificationService {
  private supabase: ReturnType<typeof createClient> | null = null;
  private partnerApiKey?: string;
  private partnerApiUrl?: string;

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

  private getPartnerApiKey(): string | undefined {
    if (this.partnerApiKey === undefined) {
      this.partnerApiKey = process.env.RERA_PARTNER_API_KEY;
    }
    return this.partnerApiKey;
  }

  private getPartnerApiUrl(): string | undefined {
    if (this.partnerApiUrl === undefined) {
      this.partnerApiUrl = process.env.RERA_PARTNER_API_URL;
    }
    return this.partnerApiUrl;
  }

  /**
   * Main verification entry point
   */
  async verifyRera(input: VerifyReraInput): Promise<ReraVerificationResult> {
    const startTime = Date.now();
    const validation = VerifyReraSchema.safeParse(input);
    
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

    const { reraNumber, state, type, builderId, forceRefresh } = validation.data;
    
    // Validate RERA number format
    const formatValidation = this.validateReraFormat(reraNumber, state);
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

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await this.getCachedVerification(reraNumber, state);
      if (cached && this.isCacheValid(cached)) {
        return {
          success: true,
          verified: cached.verification_status === 'verified',
          registrationId: cached.id,
          data: this.mapToResponse(cached),
          verificationMethod: 'cached',
          confidence: 0.95,
          source: 'cache',
        };
      }
    }

    // Try partner API first (if available)
    if (this.getPartnerApiKey() && this.getPartnerApiUrl()) {
      const partnerResult = await this.verifyViaPartner(reraNumber, state, type);
      if (partnerResult.success) {
        await this.saveVerificationResult(partnerResult, builderId, 'partner');
        return partnerResult;
      }
    }

    // Fall back to manual verification queue
    const manualResult = await this.queueManualVerification(reraNumber, state, type, builderId);
    return manualResult;
  }

  /**
   * Validate RERA number format
   */
  private validateReraFormat(reraNumber: string, state: string): {
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
   * Check cached verification
   */
  private async getCachedVerification(reraNumber: string, state: string) {
    const { data, error } = await this.getSupabase()
      .from('rera_registrations')
      .select('*')
      .eq('rera_number', reraNumber.toUpperCase())
      .eq('rera_state', state)
      .single();

    if (error || !data) return null;
    return data;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(cached: any): boolean {
    if (!cached.updated_at) return false;
    
    const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (cached.verification_status !== 'verified') {
      return cacheAge < 24 * 60 * 60 * 1000; // 24 hours
    }
    
    return cacheAge < maxAge;
  }

  /**
   * Verify via partner API
   */
  private async verifyViaPartner(
    reraNumber: string,
    state: string,
    type: string
  ): Promise<ReraVerificationResult> {
    try {
      const apiUrl = this.getPartnerApiUrl();
      const apiKey = this.getPartnerApiKey();
      if (!apiUrl || !apiKey) {
        throw new Error('Partner API not configured');
      }
      const response = await fetch(`${apiUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          rera_number: reraNumber,
          state: state,
          type: type,
        }),
      });

      if (!response.ok) {
        throw new Error(`Partner API returned ${response.status}`);
      }

      const result = await response.json();

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
            contactEmail: result.data.email || '',
            contactPhone: result.data.phone || '',
            isActive: result.data.status === 'active',
            complianceScore: result.data.compliance_score || 100,
            complaintsCount: result.data.complaints || 0,
          },
          verificationMethod: 'partner',
          confidence: 0.95,
          source: 'partner_api',
        };
      }

      return {
        success: false,
        verified: false,
        verificationMethod: 'partner',
        confidence: 0,
        source: 'partner_api',
        error: result.message || 'RERA number not found in partner database',
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
   * Queue for manual verification
   */
  private async queueManualVerification(
    reraNumber: string,
    state: string,
    type: string,
    builderId?: string
  ): Promise<ReraVerificationResult> {
    const { data, error } = await this.getSupabase()
      .from('rera_registrations')
      .upsert({
        rera_number: reraNumber.toUpperCase(),
        rera_state: state,
        registration_type: type,
        builder_id: builderId,
        verification_status: 'pending',
        verification_method: 'manual',
        metadata: {
          queued_at: new Date().toISOString(),
          automated_attempts: ['partner'],
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
    await this.getSupabase().from('rera_compliance_alerts').insert({
      rera_registration_id: data.id,
      alert_type: 'update_required',
      severity: 'medium',
      title: 'Manual RERA Verification Required',
      description: `RERA number ${reraNumber} requires manual verification`,
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
   * Save verification result to database
   */
  private async saveVerificationResult(
    result: ReraVerificationResult,
    builderId?: string,
    method?: string
  ): Promise<void> {
    if (!result.data) return;
    
    const { error } = await this.getSupabase()
      .from('rera_registrations')
      .upsert({
        rera_number: result.data.reraNumber.toUpperCase(),
        rera_state: 'Tamil Nadu',
        registration_type: result.data.registrationType,
        builder_id: builderId,
        verification_status: result.verified ? 'verified' : 'failed',
        verification_method: method || result.verificationMethod,
        verification_date: new Date().toISOString(),
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
        compliance_score: result.data.complianceScore,
        complaints_count: result.data.complaintsCount,
        last_compliance_check: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'rera_number,rera_state',
      });

    if (error) {
      console.error('Failed to save verification result:', error);
    }
  }

  /**
   * Map database record to response format
   */
  private mapToResponse(cached: any): ReraVerificationResult['data'] {
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
    };
  }
}

// Export lazy singleton instance
let reraVerificationServiceInstance: ReraVerificationService | null = null;

export const reraVerificationService = {
  getInstance(): ReraVerificationService {
    if (!reraVerificationServiceInstance) {
      reraVerificationServiceInstance = new ReraVerificationService();
    }
    return reraVerificationServiceInstance;
  },
  verifyRera: (...args: Parameters<ReraVerificationService['verifyRera']>) =>
    reraVerificationService.getInstance().verifyRera(...args),
};



