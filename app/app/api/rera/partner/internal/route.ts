/**
 * Internal RERA Partner API
 * 
 * This endpoint is used internally by the verification engine.
 * It provides the same interface as external partner APIs but uses our own service.
 */

import { NextResponse } from 'next/server';
import { reraPartnerAPIService } from '@/lib/rera/partner-api-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rera_number, state, type = 'builder' } = body;

    if (!rera_number || !state) {
      return NextResponse.json({
        found: false,
        error: 'RERA number and state are required',
      }, { status: 400 });
    }

    const result = await reraPartnerAPIService.verify({
      rera_number,
      state,
      type,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Internal RERA Partner API error:', error);
    return NextResponse.json({
      found: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}



