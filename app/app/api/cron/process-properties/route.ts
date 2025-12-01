/**
 * Cron Job: Process Pending Properties
 * Runs periodically to process properties that are pending
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { processProperty, updateProcessingJob } from '@/lib/services/propertyProcessor';

export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes

/**
 * GET /api/cron/process-properties
 * Process pending properties (called by Vercel Cron)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    // Get pending properties (limit to 10 per run to avoid timeout)
    const { data: pendingProperties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, builder_id, processing_status')
      .eq('processing_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (propertiesError) {
      throw new Error(`Failed to fetch pending properties: ${propertiesError.message}`);
    }

    if (!pendingProperties || pendingProperties.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending properties to process',
        processed: 0
      });
    }

    // Get associated processing jobs
    const propertyIds = pendingProperties.map(p => p.id);
    const { data: jobs } = await supabase
      .from('processing_jobs')
      .select('id, property_id, status')
      .in('property_id', propertyIds)
      .eq('status', 'pending');

    const jobMap = new Map(jobs?.map(j => [j.property_id, j.id]) || []);

    // Process each property
    const results = [];
    for (const property of pendingProperties) {
      try {
        const jobId = jobMap.get(property.id);

        // Update job status if exists
        if (jobId) {
          await updateProcessingJob(jobId, 'processing');
        }

        // Process property
        const result = await processProperty(property.id, property.builder_id);

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

        results.push({
          propertyId: property.id,
          success: result.success,
          leadsGenerated: result.leadsGenerated
        });

      } catch (error) {
        console.error(`[Cron] Error processing property ${property.id}:`, error);
        results.push({
          propertyId: property.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalLeads = results.reduce((sum, r) => sum + (r.leadsGenerated || 0), 0);

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful: successCount,
      failed: results.length - successCount,
      totalLeadsGenerated: totalLeads,
      results: results
    });

  } catch (error) {
    console.error('[Cron] Error:', error);
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
 * POST /api/cron/process-properties
 * Manual trigger (for testing)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

