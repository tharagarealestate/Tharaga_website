// =============================================
// AI VIRTUAL STAGING API
// POST /api/ai/virtual-staging - Start staging job
// GET /api/ai/virtual-staging?job_id=xxx - Get job status
// GET /api/ai/virtual-staging?property_id=xxx - Get all jobs for property
// =============================================
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for image processing

const stagingRequestSchema = z.object({
  property_id: z.string().uuid(),
  original_image_url: z.string().url(),
  staging_style: z.enum(['modern', 'luxury', 'minimalist', 'traditional', 'scandinavian']),
  room_type: z.enum(['living_room', 'bedroom', 'kitchen', 'bathroom', 'dining_room'])
});

// POST endpoint - Start staging job
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Auth check
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse and validate
    const body = await request.json();
    const validatedData = stagingRequestSchema.parse(body);
    
    // Verify property belongs to user (builder only)
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, builder_id')
      .eq('id', validatedData.property_id)
      .single();
    
    if (propertyError || !property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }
    
    // Check if user is builder (builder_id can be null, so allow if property exists and user is builder)
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'builder');
    
    const isBuilder = userRoles && userRoles.length > 0;
    
    if (!isBuilder && property.builder_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Property not found or access denied' },
        { status: 403 }
      );
    }
    
    // Create staging job
    const { data: job, error: jobError } = await supabase
      .from('virtual_staging_jobs')
      .insert({
        property_id: validatedData.property_id,
        original_image_url: validatedData.original_image_url,
        staging_style: validatedData.staging_style,
        room_type: validatedData.room_type,
        status: 'pending',
        created_by: session.user.id
      })
      .select()
      .single();
    
    if (jobError) {
      console.error('Job creation error:', jobError);
      throw jobError;
    }
    
    // Initialize progress tracking
    await supabase
      .from('staging_progress')
      .insert({
        job_id: job.id,
        progress_pct: 0,
        current_step: 'queued',
        estimated_time_remaining_sec: 60
      });
    
    // Trigger backend processing
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const stagingResponse = await fetch(`${backendUrl}/ai/staging/process`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({
          job_id: job.id,
          original_image_url: validatedData.original_image_url,
          style: validatedData.staging_style,
          room_type: validatedData.room_type
        })
      });
      
      if (!stagingResponse.ok) {
        const errorText = await stagingResponse.text();
        throw new Error(`Staging service failed: ${errorText}`);
      }
    } catch (error: any) {
      console.error('Staging service error:', error);
      // Mark job as failed
      await supabase
        .from('virtual_staging_jobs')
        .update({
          status: 'failed',
          error_message: error.message || 'Failed to start staging service'
        })
        .eq('id', job.id);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Staging service unavailable',
          details: error.message
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        job_id: job.id,
        status: 'processing',
        message: 'Virtual staging started. Monitor progress via real-time subscription.'
      }
    });
    
  } catch (error) {
    console.error('Virtual staging error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint - Fetch job status
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const job_id = searchParams.get('job_id');
    const property_id = searchParams.get('property_id');
    
    // Auth check
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (job_id) {
      // Get specific job with progress
      const { data: job, error: jobError } = await supabase
        .from('virtual_staging_jobs')
        .select(`
          *,
          staging_progress(*)
        `)
        .eq('id', job_id)
        .single();
      
      if (jobError) throw jobError;
      
      return NextResponse.json({ success: true, data: job });
    }
    
    if (property_id) {
      // Get all jobs for a property
      const { data: jobs, error: jobsError } = await supabase
        .from('virtual_staging_jobs')
        .select('*')
        .eq('property_id', property_id)
        .order('created_at', { ascending: false });
      
      if (jobsError) throw jobsError;
      
      return NextResponse.json({ success: true, data: jobs });
    }
    
    return NextResponse.json(
      { success: false, error: 'job_id or property_id required' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Get staging job error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staging job' },
      { status: 500 }
    );
  }
}

