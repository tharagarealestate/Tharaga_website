// =============================================
// GOOGLE CALENDAR STATUS
// Get calendar connection status
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { googleCalendarClient } from '@/lib/integrations/calendar/googleCalendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // =============================================
    // AUTHENTICATION
    // =============================================
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a builder
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'builder') {
      return NextResponse.json({ error: 'Forbidden - Builders only' }, { status: 403 });
    }

    // =============================================
    // GET CONNECTION STATUS
    // =============================================
    const status = await googleCalendarClient.getConnectionStatus(user.id);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    console.error('Error getting calendar status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get calendar status' },
      { status: 500 }
    );
  }
}

