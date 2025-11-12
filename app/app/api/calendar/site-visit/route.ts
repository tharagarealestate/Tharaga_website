// =============================================
// GOOGLE CALENDAR SITE VISIT
// Create site visit calendar event
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { googleCalendarClient } from '@/lib/integrations/calendar/googleCalendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
    // PARSE REQUEST BODY
    // =============================================
    const body = await request.json();
    const {
      lead_name,
      lead_email,
      lead_phone,
      property_title,
      property_address,
      visit_datetime,
      duration_minutes = 60,
    } = body;

    // Validate required fields
    if (
      !lead_name ||
      !lead_email ||
      !lead_phone ||
      !property_title ||
      !property_address ||
      !visit_datetime
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate date
    const visitDate = new Date(visit_datetime);
    if (isNaN(visitDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // =============================================
    // CREATE SITE VISIT EVENT
    // =============================================
    const result = await googleCalendarClient.createSiteVisitEvent({
      builder_id: user.id,
      lead_name,
      lead_email,
      lead_phone,
      property_title,
      property_address,
      visit_datetime: visitDate,
      duration_minutes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      event_id: result.event_id,
      meet_link: result.meet_link,
    });
  } catch (error: any) {
    console.error('Error creating site visit event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create site visit event' },
      { status: 500 }
    );
  }
}

