/**
 * Ultra Automation Processing API
 * Processes properties through all 10 layers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { processPropertyUltraAutomation } from '@/lib/services/ultra-automation/orchestrator';

export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, builderId } = body;

    if (!propertyId || !builderId) {
      return NextResponse.json(
        { error: 'propertyId and builderId are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Verify property belongs to builder
    const { data: property } = await supabase
      .from('properties')
      .select('id, builder_id')
      .eq('id', propertyId)
      .single();

    if (!property || property.builder_id !== builderId) {
      return NextResponse.json(
        { error: 'Property not found or access denied' },
        { status: 404 }
      );
    }

    // Process through ultra automation
    const result = await processPropertyUltraAutomation(propertyId, builderId);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Ultra Process API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

