// =============================================
// GOOGLE CALENDAR OAUTH - CONNECT
// Redirects user to Google consent screen
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { googleCalendarClient } from '@/lib/integrations/calendar/googleCalendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // =============================================
    // AUTHENTICATION
    // =============================================
    // Get current user (builder)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a builder
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'builder') {
      return NextResponse.json(
        { error: 'Forbidden - Builders only' },
        { status: 403 }
      );
    }

    // =============================================
    // GENERATE OAUTH URL
    // =============================================
    // Generate OAuth URL with builder_id in state
    const authUrl = googleCalendarClient.getAuthUrl(user.id);

    // =============================================
    // RETURN RESPONSE
    // =============================================
    // Return redirect URL
    return NextResponse.json({ 
      auth_url: authUrl,
      message: 'Redirect user to this URL to connect Google Calendar'
    });
  } catch (error: any) {
    console.error('Error initiating calendar connection:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate calendar connection' },
      { status: 500 }
    );
  }
}

