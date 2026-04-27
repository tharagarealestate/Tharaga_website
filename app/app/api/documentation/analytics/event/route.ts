/**
 * Track Documentation Analytics Event API
 * POST /api/documentation/analytics/event
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user (optional - can be anonymous)
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json();
    const {
      eventType,
      featureKey,
      pageUrl,
      eventData,
      sessionId,
    } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: 'eventType is required' },
        { status: 400 }
      );
    }

    // Get client IP and user agent from headers
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '';

    // Insert event
    const { error: insertError } = await supabase
      .from('doc_analytics_events')
      .insert({
        user_id: user?.id || null,
        event_type: eventType,
        feature_key: featureKey || null,
        page_url: pageUrl || null,
        event_data: eventData || {},
        session_id: sessionId || null,
        user_agent: userAgent,
        ip_address: ipAddress || null,
      });

    if (insertError) {
      console.error('Error tracking event:', insertError);
      // Don't fail the request - analytics should be non-blocking
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking analytics event:', error);
    // Return success even on error - analytics should not break user experience
    return NextResponse.json({ success: true });
  }
}

































