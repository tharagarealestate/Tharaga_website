/**
 * Property Upload API
 * Handles property uploads and triggers background processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { createProcessingJob } from '@/lib/services/propertyProcessor';

// Use Node.js runtime since propertyProcessor module uses Node.js-specific dependencies
export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute for upload

/**
 * POST /api/properties/upload
 * Upload a new property and trigger processing
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const builderId = user.id;
    const body = await request.json();

    // Validate required fields
    const { 
      property_name, 
      title,
      location,
      city,
      locality,
      property_type,
      total_units,
      price_range,
      price_inr,
      description,
      images
    } = body;

    if (!property_name && !title) {
      return NextResponse.json(
        { error: 'property_name or title is required' },
        { status: 400 }
      );
    }

    // 1. Save property to database
    const propertyData: any = {
      builder_id: builderId,
      property_name: property_name || title,
      title: title || property_name,
      location: location || null,
      city: city || null,
      locality: locality || null,
      property_type: property_type || null,
      total_units: total_units || null,
      price_range: price_range || null,
      price_inr: price_inr || null,
      description: description || null,
      images: images ? (Array.isArray(images) ? images : [images]) : [],
      processing_status: 'pending',
      listing_status: 'draft',
      processing_metadata: {
        uploaded_at: new Date().toISOString()
      }
    };

    const { data: property, error: insertError } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()
      .single();

    if (insertError || !property) {
      console.error('[Property Upload] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save property', details: insertError?.message },
        { status: 500 }
      );
    }

    // 2. Create processing job
    let jobId: string | null = null;
    try {
      jobId = await createProcessingJob(property.id, builderId);
    } catch (jobError) {
      console.error('[Property Upload] Job creation error:', jobError);
      // Continue even if job creation fails
    }

    // 3. Trigger background processing (fire and forget)
    // Use Vercel Queue or call processing API asynchronously
    try {
      // Option 1: Call processing API directly (for immediate processing)
      // This will run in background if we don't await
      const processingUrl = new URL('/api/properties/process', request.url);
      fetch(processingUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify({
          propertyId: property.id,
          builderId: builderId,
          jobId: jobId
        })
      }).catch(err => {
        console.error('[Property Upload] Background processing trigger failed:', err);
        // Non-critical - job will be picked up by cron if needed
      });
    } catch (triggerError) {
      console.error('[Property Upload] Error triggering processing:', triggerError);
      // Non-critical - processing can happen via cron
    }

    // 4. Return immediate response to user
    return NextResponse.json({
      success: true,
      message: 'Property uploaded successfully. Generating leads...',
      propertyId: property.id,
      jobId: jobId,
      status: 'processing'
    }, { status: 200 });

  } catch (error) {
    console.error('[Property Upload] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

