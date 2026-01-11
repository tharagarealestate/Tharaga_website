/**
 * Process Pending Webhook Logs
 * 
 * This endpoint processes pending webhook_logs entries and triggers the intelligence-engine.
 * This is a backup mechanism if n8n is not configured or unavailable.
 * 
 * Can be called:
 * - Manually via API
 * - Via cron job (every 30 seconds)
 * - Via n8n workflow that polls this endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 300 // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication (internal API key or cron secret)
    const authHeader = req.headers.get('Authorization')
    const internalApiKey = process.env.INTERNAL_API_KEY
    const cronSecret = process.env.CRON_SECRET
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    if (token !== internalApiKey && token !== cronSecret) {
      return NextResponse.json(
        { error: 'Invalid authorization' },
        { status: 403 }
      )
    }

    // Fetch pending webhook logs (limit to 10 at a time to avoid overload)
    const { data: pendingWebhooks, error: fetchError } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('status', 'pending')
      .eq('event_type', 'property.insert')
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error('[Webhook Processor] Error fetching pending webhooks:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch pending webhooks', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!pendingWebhooks || pendingWebhooks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending webhooks to process',
        processed: 0,
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in'
    const results = []

    // Process each pending webhook
    for (const webhook of pendingWebhooks) {
      try {
        const propertyId = webhook.metadata?.property_id || webhook.event_id

        if (!propertyId) {
          // Mark as failed if no property_id
          await supabase
            .from('webhook_logs')
            .update({ status: 'failed', error: 'Missing property_id' })
            .eq('id', webhook.id)
          continue
        }

        // Verify property exists and is still active
        const { data: property } = await supabase
          .from('properties')
          .select('id, status, marketing_automation_enabled')
          .eq('id', propertyId)
          .single()

        if (!property || property.status !== 'active' || property.marketing_automation_enabled === false) {
          // Mark as skipped if property is not active
          await supabase
            .from('webhook_logs')
            .update({ 
              status: 'skipped', 
              error: 'Property not active or automation disabled',
              processed_at: new Date().toISOString(),
            })
            .eq('id', webhook.id)
          continue
        }

        // Call intelligence-engine
        const intelligenceResponse = await fetch(`${baseUrl}/api/automation/marketing/intelligence-engine`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${internalApiKey || ''}`,
          },
          body: JSON.stringify({
            record: webhook.body?.record || { id: propertyId },
          }),
        })

        if (intelligenceResponse.ok) {
          const intelligenceData = await intelligenceResponse.json()
          
          // Mark as processed
          await supabase
            .from('webhook_logs')
            .update({ 
              status: 'processed',
              processed_at: new Date().toISOString(),
              response_data: intelligenceData,
            })
            .eq('id', webhook.id)

          results.push({
            webhook_id: webhook.id,
            property_id: propertyId,
            status: 'success',
            strategy_id: intelligenceData.strategy_id,
          })
        } else {
          const errorData = await intelligenceResponse.json().catch(() => ({}))
          
          // Mark as failed
          await supabase
            .from('webhook_logs')
            .update({ 
              status: 'failed',
              error: errorData.error || 'Intelligence engine failed',
              processed_at: new Date().toISOString(),
            })
            .eq('id', webhook.id)

          results.push({
            webhook_id: webhook.id,
            property_id: propertyId,
            status: 'failed',
            error: errorData.error || 'Intelligence engine failed',
          })
        }
      } catch (error: any) {
        console.error(`[Webhook Processor] Error processing webhook ${webhook.id}:`, error)
        
        // Mark as failed
        await supabase
          .from('webhook_logs')
          .update({ 
            status: 'failed',
            error: error.message,
            processed_at: new Date().toISOString(),
          })
          .eq('id', webhook.id)

        results.push({
          webhook_id: webhook.id,
          status: 'failed',
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} webhooks`,
      processed: results.length,
      results,
    })
  } catch (error: any) {
    console.error('[Webhook Processor] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}






















