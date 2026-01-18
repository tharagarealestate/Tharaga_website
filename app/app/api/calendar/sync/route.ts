// =============================================
// SYNC CALENDAR EVENTS
// Pull latest events from Google Calendar
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { googleCalendarClient } from '@/lib/integrations/calendar/googleCalendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // =============================================
    // AUTHENTICATION
    // =============================================
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // =============================================
    // CHECK CALENDAR CONNECTION
    // =============================================
    // Check if calendar is connected
    const { data: connection, error: connectionError } = await supabase
      .from('calendar_connections')
      .select('id, last_sync_at')
      .eq('builder_id', user.id)
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      );
    }

    // =============================================
    // PERFORM SYNC
    // =============================================
    // Perform sync
    const result = await googleCalendarClient.syncEvents(user.id);

    // =============================================
    // FETCH UPDATED SYNC STATUS
    // =============================================
    // Fetch updated sync status from database
    const { data: updatedConnection } = await supabase
      .from('calendar_connections')
      .select('last_sync_at')
      .eq('builder_id', user.id)
      .eq('is_active', true)
      .single();

    // =============================================
    // RETURN RESPONSE
    // =============================================
    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      last_sync_at: updatedConnection?.last_sync_at || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error syncing calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}

