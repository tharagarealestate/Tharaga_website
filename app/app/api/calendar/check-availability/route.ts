// =============================================
// CHECK SPECIFIC TIME SLOT AVAILABILITY
// Quick check before booking
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================
// POST - Check availability for a specific time slot
// =============================================
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // =============================================
    // AUTHENTICATION
    // =============================================
    // Get current user (optional - can be used for rate limiting)
    const { data: { user } } = await supabase.auth.getUser();
    // Note: Authentication is optional for this endpoint as it's a public availability check

    // =============================================
    // PARSE REQUEST BODY
    // =============================================
    const body = await request.json();

    // =============================================
    // VALIDATE PARAMETERS
    // =============================================
    if (!body.builder_id || !body.datetime) {
      return NextResponse.json(
        { error: 'Missing required parameters: builder_id, datetime' },
        { status: 400 }
      );
    }

    // Validate datetime format
    const datetime = new Date(body.datetime);
    if (isNaN(datetime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid datetime format. Use ISO 8601 format (e.g., 2024-01-01T10:00:00Z)' },
        { status: 400 }
      );
    }

    // Validate duration
    const duration = body.duration_minutes || 60;
    if (duration < 15 || duration > 480) {
      return NextResponse.json(
        { error: 'Duration must be between 15 and 480 minutes' },
        { status: 400 }
      );
    }

    // Validate builder_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.builder_id)) {
      return NextResponse.json(
        { error: 'Invalid builder_id format. Must be a valid UUID' },
        { status: 400 }
      );
    }

    // =============================================
    // CHECK AVAILABILITY USING DATABASE FUNCTION
    // =============================================
    const { data, error } = await supabase.rpc('check_slot_availability', {
      p_builder_id: body.builder_id,
      p_datetime: datetime.toISOString(),
      p_duration_minutes: duration,
    });

    if (error) {
      console.error('Error checking slot availability:', error);
      throw error;
    }

    // =============================================
    // PROCESS RESULT
    // =============================================
    const result = data?.[0] || { is_available: false, reason: 'Unknown error' };

    // =============================================
    // RETURN RESPONSE
    // =============================================
    return NextResponse.json({
      available: result.is_available,
      reason: result.reason,
      datetime: datetime.toISOString(),
      duration_minutes: duration,
      builder_id: body.builder_id,
    });
  } catch (error: any) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to check availability',
        available: false,
      },
      { status: 500 }
    );
  }
}

