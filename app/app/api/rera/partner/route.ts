/**
 * RERA Partner API Endpoint
 * 
 * This is our OWN internal RERA verification API that:
 * - Aggregates data from multiple sources
 * - Caches results for fast retrieval
 * - Provides unified interface
 * 
 * This replaces the need for third-party APIs.
 */

import { NextResponse } from 'next/server';
import { reraPartnerAPIService } from '@/lib/rera/partner-api-service';

/**
 * POST /api/rera/partner/verify
 * Verify a RERA number using our internal service
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rera_number, reraNumber, state, type = 'builder' } = body;

    const reraNumberValue = reraNumber || rera_number;

    if (!reraNumberValue || !state) {
      return NextResponse.json({
        found: false,
        error: 'RERA number and state are required',
      }, { status: 400 });
    }

    const result = await reraPartnerAPIService.verify({
      rera_number: reraNumberValue,
      state,
      type,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('RERA Partner API error:', error);
    return NextResponse.json({
      found: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET /api/rera/partner/stats
 * Get statistics about our RERA database
 */
export async function GET() {
  try {
    const stats = await reraPartnerAPIService.getStats();
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('RERA Partner API stats error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}



