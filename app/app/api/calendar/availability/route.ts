// =============================================
// GET AVAILABILITY SLOTS
// Returns available time slots for bookings
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { googleCalendarClient } from '@/lib/integrations/calendar/googleCalendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================
// GET - Get available time slots
// =============================================
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;

    // =============================================
    // PARSE QUERY PARAMETERS
    // =============================================
    const builder_id = searchParams.get('builder_id');
    const start_date = searchParams.get('start_date'); // YYYY-MM-DD
    const end_date = searchParams.get('end_date'); // YYYY-MM-DD
    const duration_minutes = parseInt(
      searchParams.get('duration_minutes') || '60'
    );

    // =============================================
    // VALIDATE PARAMETERS
    // =============================================
    // Validate parameters
    if (!builder_id || !start_date || !end_date) {
      return NextResponse.json(
        {
          error:
            'Missing required parameters: builder_id, start_date, end_date',
        },
        { status: 400 }
      );
    }

    // Validate date format
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'start_date must be before or equal to end_date' },
        { status: 400 }
      );
    }

    // Validate duration
    if (duration_minutes < 15 || duration_minutes > 480) {
      return NextResponse.json(
        { error: 'duration_minutes must be between 15 and 480 (8 hours)' },
        { status: 400 }
      );
    }

    // =============================================
    // GET AVAILABLE SLOTS FROM DATABASE
    // =============================================
    // Get available slots from database function
    const { data: slots, error: rpcError } = await supabase.rpc(
      'get_available_slots',
      {
        p_builder_id: builder_id,
        p_start_date: start_date,
        p_end_date: end_date,
        p_duration_minutes: duration_minutes,
      }
    );

    if (rpcError) {
      console.error('Error calling get_available_slots:', rpcError);
      throw rpcError;
    }

    // =============================================
    // GET GOOGLE CALENDAR FREE/BUSY
    // =============================================
    // Get Google Calendar free/busy
    const start = new Date(start_date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(end_date);
    end.setHours(23, 59, 59, 999);

    const freeBusy = await googleCalendarClient.getFreeBusy({
      builder_id,
      start,
      end,
    });

    // =============================================
    // COMBINE AVAILABILITY FROM BOTH SOURCES
    // =============================================
    // Combine availability from both sources
    const availableSlots = (slots || []).filter((slot: any) => {
      if (!slot.is_available) return false;

      // Check against Google Calendar busy times
      const slotStart = new Date(slot.slot_datetime);
      const slotEnd = new Date(
        slotStart.getTime() + duration_minutes * 60000
      );

      for (const busySlot of freeBusy) {
        if (!busySlot.available) {
          if (
            (slotStart >= busySlot.start && slotStart < busySlot.end) ||
            (slotEnd > busySlot.start && slotEnd <= busySlot.end) ||
            (slotStart <= busySlot.start && slotEnd >= busySlot.end)
          ) {
            return false; // Overlaps with busy time
          }
        }
      }

      return true;
    });

    // =============================================
    // GROUP BY DATE
    // =============================================
    // Group by date
    const slotsByDate: Record<string, any[]> = {};

    for (const slot of availableSlots) {
      const date = slot.slot_date;
      if (!slotsByDate[date]) {
        slotsByDate[date] = [];
      }
      slotsByDate[date].push({
        datetime: slot.slot_datetime,
        time: slot.slot_time,
      });
    }

    // =============================================
    // RETURN RESPONSE
    // =============================================
    return NextResponse.json({
      slots: slotsByDate,
      total_slots: availableSlots.length,
    });
  } catch (error: any) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

// =============================================
// POST - Set availability preferences
// =============================================
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // =============================================
    // AUTHENTICATION
    // =============================================
    // Get current user
    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // =============================================
    // PARSE REQUEST BODY
    // =============================================
    const body = await request.json();

    // =============================================
    // VALIDATE REQUIRED FIELDS
    // =============================================
    // Validate required fields
    if (
      body.day_of_week === undefined ||
      !body.start_time ||
      !body.end_time
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: day_of_week, start_time, end_time',
        },
        { status: 400 }
      );
    }

    // =============================================
    // VALIDATE DAY OF WEEK
    // =============================================
    // Validate day_of_week (0-6)
    if (body.day_of_week < 0 || body.day_of_week > 6) {
      return NextResponse.json(
        {
          error:
            'day_of_week must be between 0 (Sunday) and 6 (Saturday)',
        },
        { status: 400 }
      );
    }

    // =============================================
    // VALIDATE TIME RANGE
    // =============================================
    // Validate time range
    const startTime = new Date(`2000-01-01T${body.start_time}`);
    const endTime = new Date(`2000-01-01T${body.end_time}`);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM:SS or HH:MM' },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'start_time must be before end_time' },
        { status: 400 }
      );
    }

    // =============================================
    // VALIDATE SLOT DURATION
    // =============================================
    // Validate slot_duration_minutes if provided
    if (
      body.slot_duration_minutes !== undefined &&
      (body.slot_duration_minutes < 15 || body.slot_duration_minutes > 480)
    ) {
      return NextResponse.json(
        {
          error:
            'slot_duration_minutes must be between 15 and 480 (8 hours)',
        },
        { status: 400 }
      );
    }

    // =============================================
    // INSERT AVAILABILITY SLOT
    // =============================================
    // Insert availability slot
    const { data: slot, error } = await supabase
      .from('availability_slots')
      .insert({
        builder_id: user.id,
        day_of_week: body.day_of_week,
        start_time: body.start_time,
        end_time: body.end_time,
        is_available: body.is_available !== false,
        slot_duration_minutes: body.slot_duration_minutes || 60,
        buffer_time_minutes: body.buffer_time_minutes || 15,
        max_bookings_per_slot: body.max_bookings_per_slot || 1,
        override_dates: body.override_dates || null,
      })
      .select()
      .single();

    if (error) throw error;

    // =============================================
    // RETURN RESPONSE
    // =============================================
    return NextResponse.json({
      success: true,
      slot,
    });
  } catch (error: any) {
    console.error('Error setting availability:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set availability' },
      { status: 500 }
    );
  }
}

// =============================================
// DELETE - Remove availability slot
// =============================================
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();

    // =============================================
    // AUTHENTICATION
    // =============================================
    // Get current user
    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // =============================================
    // PARSE QUERY PARAMETERS
    // =============================================
    const searchParams = request.nextUrl.searchParams;
    const slot_id = searchParams.get('slot_id');

    // =============================================
    // VALIDATE PARAMETERS
    // =============================================
    if (!slot_id) {
      return NextResponse.json(
        { error: 'slot_id is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(slot_id)) {
      return NextResponse.json(
        { error: 'Invalid slot_id format' },
        { status: 400 }
      );
    }

    // =============================================
    // VERIFY SLOT OWNERSHIP
    // =============================================
    // Verify slot belongs to user
    const { data: existingSlot, error: verifyError } = await supabase
      .from('availability_slots')
      .select('builder_id')
      .eq('id', slot_id)
      .single();

    if (verifyError || !existingSlot) {
      return NextResponse.json(
        { error: 'Availability slot not found' },
        { status: 404 }
      );
    }

    if (existingSlot.builder_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Slot does not belong to user' },
        { status: 403 }
      );
    }

    // =============================================
    // DELETE SLOT
    // =============================================
    // Delete slot
    const { error } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', slot_id)
      .eq('builder_id', user.id); // Ensure user owns this slot

    if (error) throw error;

    // =============================================
    // RETURN RESPONSE
    // =============================================
    return NextResponse.json({
      success: true,
      message: 'Availability slot deleted',
    });
  } catch (error: any) {
    console.error('Error deleting availability slot:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete availability slot' },
      { status: 500 }
    );
  }
}

