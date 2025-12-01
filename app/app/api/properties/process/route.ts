/**
 * Property Processing API
 * Handles background processing of properties
 * Can be called directly or via webhook/cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { processProperty, createProcessingJob, updateProcessingJob } from '@/lib/services/propertyProcessor';

export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes for processing

/**
 * POST /api/properties/process
 * Process a property (background job)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, builderId, jobId } = body;

    if (!propertyId || !builderId) {
      return NextResponse.json(
        { error: 'propertyId and builderId are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Verify property belongs to builder
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, builder_id')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Update job status if jobId provided
    if (jobId) {
      await updateProcessingJob(jobId, 'processing');
    }

    // Process property
    const result = await processProperty(propertyId, builderId);

    // Update job status
    if (jobId) {
      if (result.success) {
        await updateProcessingJob(jobId, 'completed', {
          leadsGenerated: result.leadsGenerated,
          emailSent: result.emailSent,
          smsSent: result.smsSent
        });
      } else {
        await updateProcessingJob(jobId, 'failed', null, result.error);
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Property Process API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/properties/process
 * Get processing status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const propertyId = searchParams.get('propertyId');
    const builderId = searchParams.get('builderId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get property processing status
    const { data: property } = await supabase
      .from('properties')
      .select('processing_status, processing_metadata')
      .eq('id', propertyId)
      .single();

    // Get processing jobs
    const { data: jobs } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get generated leads count
    const { count: leadsCount } = await supabase
      .from('generated_leads')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId);

    return NextResponse.json({
      propertyId,
      status: property?.processing_status || 'unknown',
      metadata: property?.processing_metadata || {},
      jobs: jobs || [],
      leadsGenerated: leadsCount || 0
    });

  } catch (error) {
    console.error('[Property Process API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

