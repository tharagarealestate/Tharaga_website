import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { reraVerificationService } from '@/lib/services/rera-verification';

const VerifyRequestSchema = z.object({
  reraNumber: z.string().min(5, 'RERA number is required'),
  state: z.string().default('Tamil Nadu'),
  type: z.enum(['builder', 'project', 'agent']).default('builder'),
  builderId: z.string().uuid().optional(),
  forceRefresh: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Auth check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request
    const body = await request.json();
    const validation = VerifyRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { reraNumber, state, type, builderId, forceRefresh } = validation.data;

    // Verify RERA
    const result = await reraVerificationService.verifyRera({
      reraNumber,
      state,
      type,
      builderId,
      forceRefresh,
    });

    return NextResponse.json({
      success: result.success,
      verified: result.verified,
      registrationId: result.registrationId,
      data: result.data,
      verificationMethod: result.verificationMethod,
      confidence: result.confidence,
      source: result.source,
      warnings: result.warnings,
      error: result.error,
    });
  } catch (error) {
    console.error('RERA verification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}





