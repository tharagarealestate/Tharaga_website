import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json();
    const {
      eventName,
      eventCategory,
      properties = {},
      sessionId,
      deviceType,
      browser,
      os,
      city,
      country
    } = body;

    // Track event using Supabase function
    const { error } = await supabase.rpc('track_event', {
      p_user_id: user?.id || null,
      p_event_name: eventName,
      p_event_category: eventCategory,
      p_properties: properties,
      p_session_id: sessionId || null,
      p_device_type: deviceType || null,
      p_browser: browser || null,
      p_os: os || null,
      p_city: city || null,
      p_country: country || null
    });

    if (error) {
      console.error('Error tracking event:', error);
      // Still return success to not break the app
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Track event error:', error);
    // Return success even on error to not break the app
    return NextResponse.json({ success: false, error: error.message });
  }
}

