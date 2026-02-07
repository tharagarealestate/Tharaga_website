import { NextResponse } from 'next/server';
import { reraVerificationEngine } from '@/lib/rera/verification-engine';

/**
 * Advanced RERA Verification API Route
 * 
 * Uses the comprehensive RERA verification engine to:
 * - Validate RERA number format
 * - Scrape RERA portals
 * - Verify documents via OCR
 * - Calculate confidence scores
 * - Store results in database
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rera_number, reraNumber, state, type, builder_id, builderId, property_id, propertyId, project_name, projectName, promoter_name, promoterName, document_url, documentUrl, force_refresh, forceRefresh } = body;

    // Normalize input (support both snake_case and camelCase)
    const input = {
      reraNumber: reraNumber || rera_number,
      state: state || 'Tamil Nadu',
      type: type || 'builder',
      builderId: builderId || builder_id,
      propertyId: propertyId || property_id,
      projectName: projectName || project_name,
      promoterName: promoterName || promoter_name,
      documentUrl: documentUrl || document_url,
      forceRefresh: forceRefresh || force_refresh || false,
    };

    if (!input.reraNumber || !input.state) {
      return NextResponse.json({ 
        error: 'RERA number and state are required',
        valid: false 
      }, { status: 400 });
    }

    // Use the verification engine
    const result = await reraVerificationEngine.verify(input);

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Verification failed',
        valid: false,
        warnings: result.warnings,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verified: result.verified,
      registrationId: result.registrationId,
      data: result.data,
      verificationMethod: result.verificationMethod,
      confidence: result.confidence,
      source: result.source,
      warnings: result.warnings,
      snapshot: result.snapshot,
      message: result.verified 
        ? 'RERA number verified successfully' 
        : 'RERA number requires manual verification',
    });

  } catch (error) {
    console.error('RERA verification error:', error);
    return NextResponse.json({ 
      error: 'Verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to retrieve RERA verification status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reraNumber = searchParams.get('rera_number') || searchParams.get('reraNumber');
    const state = searchParams.get('state') || 'Tamil Nadu';
    const propertyId = searchParams.get('property_id') || searchParams.get('propertyId');

    if (!reraNumber) {
      return NextResponse.json({ 
        error: 'RERA number is required' 
      }, { status: 400 });
    }

    // Get cached verification
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('rera_registrations')
      .select('*')
      .eq('rera_number', reraNumber.toUpperCase())
      .eq('rera_state', state)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        verified: false,
        message: 'RERA number not found'
      });
    }

    return NextResponse.json({
      verified: data.verified || data.verification_status === 'verified',
      data: {
        reraNumber: data.rera_number,
        registeredName: data.registered_name,
        registrationType: data.registration_type,
        registrationDate: data.registration_date,
        expiryDate: data.expiry_date,
        promoterName: data.promoter_name,
        status: data.status,
        isActive: data.is_active,
        complianceScore: data.compliance_score,
        projectName: data.project_name,
      },
      verificationMethod: data.verification_method,
      lastVerifiedAt: data.last_verified_at,
    });

  } catch (error) {
    console.error('RERA retrieval error:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve RERA information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
