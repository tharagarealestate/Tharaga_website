/**
 * Property Upload API
 * Handles property uploads and triggers background processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { createProcessingJob } from '@/lib/services/propertyProcessor';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit';
import { z } from 'zod';

// Use Node.js runtime since propertyProcessor module uses Node.js-specific dependencies
export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute for upload

const propertyUploadSchema = z.object({
  property_name: z.string().optional(),
  title: z.string().optional(),
  location: z.any().optional(),
  city: z.string().optional(),
  locality: z.string().optional(),
  property_type: z.string().optional(),
  total_units: z.number().optional(),
  price_range: z.any().optional(),
  price_inr: z.number().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional()
}).refine(data => data.property_name || data.title, {
  message: 'property_name or title is required'
});

/**
 * POST /api/properties/upload
 * Upload a new property and trigger processing
 */
export const POST = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = getSupabase();
    
    // User is already authenticated via secureApiRoute
    const builderId = user.id;
    const body = await request.json();
    const validatedData = propertyUploadSchema.parse(body);

    // Input is already validated by secureApiRoute
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
    } = validatedData;

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
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.PROPERTY_CREATE,
    rateLimit: 'strict',
    validateSchema: propertyUploadSchema,
    auditAction: AuditActions.PROPERTY_CREATE,
    auditResourceType: AuditResourceTypes.PROPERTY
  }
)

