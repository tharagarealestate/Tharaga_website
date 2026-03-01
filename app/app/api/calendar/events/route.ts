// =============================================
// CALENDAR EVENTS - CREATE, READ, UPDATE
// Full event management with Google Calendar sync
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { googleCalendarClient } from '@/lib/integrations/calendar/googleCalendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================
// GET - List calendar events
// =============================================
export async function GET(request: NextRequest) {
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
    // PARSE QUERY PARAMETERS
    // =============================================
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get('start'); // ISO date string
    const end = searchParams.get('end'); // ISO date string
    const event_type = searchParams.get('event_type');
    const status = searchParams.get('status');

    // =============================================
    // BUILD QUERY
    // =============================================
    // Build query - start with events only
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('builder_id', user.id)
      .order('start_time', { ascending: true });

    // Apply filters
    if (start) {
      query = query.gte('start_time', start);
    }

    if (end) {
      query = query.lte('end_time', end);
    }

    if (event_type) {
      query = query.eq('event_type', event_type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // =============================================
    // EXECUTE QUERY
    // =============================================
    const { data: events, error } = await query;

    if (error) throw error;

    // =============================================
    // ENRICH EVENTS WITH LEAD AND PROPERTY DATA
    // =============================================
    // Collect unique lead_ids and property_ids
    const leadIds = [...new Set((events || []).map((e) => e.lead_id).filter(Boolean))];
    const propertyIds = [...new Set((events || []).map((e) => e.property_id).filter(Boolean))];

    // Batch fetch leads
    const leadsMap = new Map();
    if (leadIds.length > 0) {
      const { data: leadsData } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone')
        .in('id', leadIds);

      if (leadsData) {
        leadsData.forEach((lead) => {
          leadsMap.set(lead.id, lead);
        });
      }
    }

    // Batch fetch properties
    const propertiesMap = new Map();
    if (propertyIds.length > 0) {
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, title, location')
        .in('id', propertyIds);

      if (propertiesData) {
        propertiesData.forEach((property) => {
          propertiesMap.set(property.id, property);
        });
      }
    }

    // Enrich events with lead and property data
    const enrichedEvents = (events || []).map((event) => ({
      ...event,
      lead: event.lead_id ? leadsMap.get(event.lead_id) || null : null,
      property: event.property_id ? propertiesMap.get(event.property_id) || null : null,
    }));

    // =============================================
    // RETURN RESPONSE
    // =============================================
    return NextResponse.json({
      events: enrichedEvents,
      total: enrichedEvents.length,
    });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

// =============================================
// POST - Create new calendar event
// =============================================
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
    // PARSE REQUEST BODY
    // =============================================
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.start_time || !body.end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: title, start_time, end_time' },
        { status: 400 }
      );
    }

    // =============================================
    // CHECK CALENDAR CONNECTION
    // =============================================
    // Check if calendar is connected
    const { data: connection } = await supabase
      .from('calendar_connections')
      .select('id')
      .eq('builder_id', user.id)
      .eq('is_active', true)
      .single();

    if (!connection) {
      return NextResponse.json(
        {
          error:
            'Google Calendar not connected. Please connect your calendar first.',
        },
        { status: 400 }
      );
    }

    // =============================================
    // BUILD GOOGLE CALENDAR EVENT
    // =============================================
    // Build Google Calendar event
    const calendarEvent = {
      summary: body.title,
      description: body.description,
      location: body.location,
      start: {
        dateTime: body.start_time,
        timeZone: body.timezone || 'Asia/Kolkata',
      },
      end: {
        dateTime: body.end_time,
        timeZone: body.timezone || 'Asia/Kolkata',
      },
      attendees: body.attendees || [],
      reminders:
        body.reminders || {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 1440 }, // 24 hours
            { method: 'popup', minutes: 120 }, // 2 hours
          ],
        },
    };

    // Add conference data if requested
    if (body.create_meet_link) {
      calendarEvent.conferenceData = {
        createRequest: {
          requestId: `event-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    // =============================================
    // CREATE EVENT IN GOOGLE CALENDAR
    // =============================================
    // Create event in Google Calendar
    const result = await googleCalendarClient.createEvent(
      user.id,
      calendarEvent
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // =============================================
    // UPDATE EVENT WITH ADDITIONAL DATA
    // =============================================
    // Update event in database with additional fields if provided
    if (body.lead_id || body.property_id || body.event_type) {
      const updateData: any = {};
      if (body.lead_id) updateData.lead_id = body.lead_id;
      if (body.property_id) updateData.property_id = body.property_id;
      if (body.event_type) updateData.event_type = body.event_type;

      await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('google_event_id', result.event_id);
    }

    // =============================================
    // FETCH CREATED EVENT
    // =============================================
    // Fetch the created event from database
    const { data: createdEvent, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('google_event_id', result.event_id)
      .single();

    if (fetchError) {
      console.error('Error fetching created event:', fetchError);
    }

    // =============================================
    // RETURN RESPONSE
    // =============================================
    return NextResponse.json({
      success: true,
      event: createdEvent,
      google_event_id: result.event_id,
    });
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}

// =============================================
// PATCH - Update calendar event
// =============================================
export async function PATCH(request: NextRequest) {
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
    // PARSE REQUEST BODY
    // =============================================
    const body = await request.json();
    const { event_id, google_event_id, ...updates } = body;

    if (!google_event_id) {
      return NextResponse.json(
        { error: 'google_event_id is required' },
        { status: 400 }
      );
    }

    // =============================================
    // VERIFY EVENT OWNERSHIP
    // =============================================
    // Verify event belongs to user
    const { data: existingEvent, error: verifyError } = await supabase
      .from('calendar_events')
      .select('builder_id')
      .eq('google_event_id', google_event_id)
      .single();

    if (verifyError || !existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existingEvent.builder_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Event does not belong to user' },
        { status: 403 }
      );
    }

    // =============================================
    // BUILD UPDATE PAYLOAD FOR GOOGLE CALENDAR
    // =============================================
    // Build update payload for Google Calendar
    const calendarUpdates: any = {};

    if (updates.title) calendarUpdates.summary = updates.title;
    if (updates.description) calendarUpdates.description = updates.description;
    if (updates.location) calendarUpdates.location = updates.location;

    if (updates.start_time) {
      calendarUpdates.start = {
        dateTime: updates.start_time,
        timeZone: updates.timezone || 'Asia/Kolkata',
      };
    }

    if (updates.end_time) {
      calendarUpdates.end = {
        dateTime: updates.end_time,
        timeZone: updates.timezone || 'Asia/Kolkata',
      };
    }

    if (updates.attendees) calendarUpdates.attendees = updates.attendees;

    // =============================================
    // UPDATE IN GOOGLE CALENDAR
    // =============================================
    // Update in Google Calendar (only if calendar fields are provided)
    if (Object.keys(calendarUpdates).length > 0) {
      const result = await googleCalendarClient.updateEvent(
        user.id,
        google_event_id,
        calendarUpdates
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
    }

    // =============================================
    // UPDATE DATABASE FIELDS
    // =============================================
    // Update database fields that don't need Google Calendar sync
    const dbUpdates: any = {};
    if (updates.lead_id !== undefined) dbUpdates.lead_id = updates.lead_id;
    if (updates.property_id !== undefined)
      dbUpdates.property_id = updates.property_id;
    if (updates.event_type !== undefined)
      dbUpdates.event_type = updates.event_type;

    if (Object.keys(dbUpdates).length > 0) {
      await supabase
        .from('calendar_events')
        .update(dbUpdates)
        .eq('google_event_id', google_event_id);
    }

    // =============================================
    // FETCH UPDATED EVENT
    // =============================================
    // Fetch updated event
    const { data: updatedEvent, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('google_event_id', google_event_id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated event:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch updated event' },
        { status: 500 }
      );
    }

    // =============================================
    // RETURN RESPONSE
    // =============================================
    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

// =============================================
// DELETE - Cancel calendar event
// =============================================
export async function DELETE(request: NextRequest) {
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
    // PARSE QUERY PARAMETERS
    // =============================================
    const searchParams = request.nextUrl.searchParams;
    const google_event_id = searchParams.get('google_event_id');

    if (!google_event_id) {
      return NextResponse.json(
        { error: 'google_event_id is required' },
        { status: 400 }
      );
    }

    // =============================================
    // VERIFY EVENT OWNERSHIP
    // =============================================
    // Verify event belongs to user
    const { data: existingEvent, error: verifyError } = await supabase
      .from('calendar_events')
      .select('builder_id')
      .eq('google_event_id', google_event_id)
      .single();

    if (verifyError || !existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existingEvent.builder_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Event does not belong to user' },
        { status: 403 }
      );
    }

    // =============================================
    // DELETE FROM GOOGLE CALENDAR
    // =============================================
    // Delete from Google Calendar
    const result = await googleCalendarClient.deleteEvent(
      user.id,
      google_event_id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // =============================================
    // RETURN RESPONSE
    // =============================================
    return NextResponse.json({
      success: true,
      message: 'Event cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}
