// =============================================
// SITE VISIT BOOKINGS
// Create, read, update, cancel site visits
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient, createUserWithProfile } from '@/lib/supabase/admin';
import { googleCalendarClient } from '@/lib/integrations/calendar/googleCalendar';
import { resendClient } from '@/lib/integrations/email/resendClient';
import { twilioClient } from '@/lib/integrations/messaging/twilioClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================
// POST - Book site visit
// =============================================
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // =============================================
    // VALIDATE REQUIRED FIELDS
    // =============================================
    // Validate required fields
    const required = [
      'builder_id',
      'property_id',
      'visitor_name',
      'visitor_email',
      'visitor_phone',
      'visit_datetime',
    ];

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // =============================================
    // VALIDATE DATE AND TIME
    // =============================================
    // Check slot availability
    const visitDateTime = new Date(body.visit_datetime);
    const duration = body.duration_minutes || 60;

    if (isNaN(visitDateTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid visit_datetime format' },
        { status: 400 }
      );
    }

    // Validate duration
    if (duration < 15 || duration > 480) {
      return NextResponse.json(
        { error: 'duration_minutes must be between 15 and 480 (8 hours)' },
        { status: 400 }
      );
    }

    // =============================================
    // CHECK SLOT AVAILABILITY
    // =============================================
    // Check slot availability
    const { data: availabilityCheck, error: availabilityError } =
      await supabase.rpc('check_slot_availability', {
        p_builder_id: body.builder_id,
        p_datetime: visitDateTime.toISOString(),
        p_duration_minutes: duration,
      });

    if (availabilityError) {
      console.error('Error checking availability:', availabilityError);
      // Continue with booking even if availability check fails
    }

    if (availabilityCheck && availabilityCheck.length > 0) {
      if (!availabilityCheck[0].is_available) {
        return NextResponse.json(
          {
            error: 'Time slot is not available',
            reason: availabilityCheck[0].reason,
          },
          { status: 400 }
        );
      }
    }

    // =============================================
    // GET PROPERTY DETAILS
    // =============================================
    // Get property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, title, location, address')
      .eq('id', body.property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // =============================================
    // GET BUILDER DETAILS
    // =============================================
    // Get builder details from profiles table
    const { data: builder, error: builderError } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, avatar_url')
      .eq('id', body.builder_id)
      .single();

    if (builderError || !builder) {
      return NextResponse.json(
        { error: 'Builder not found' },
        { status: 404 }
      );
    }

    // =============================================
    // GET OR CREATE LEAD
    // =============================================
    // Get or create lead
    let lead_id = body.lead_id;

    if (!lead_id) {
      // Try to find existing user by email in profiles table
      const { data: existingLead, error: leadLookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', body.visitor_email)
        .maybeSingle();

      if (leadLookupError) {
        console.error('Error looking up lead:', leadLookupError);
        // Continue - will handle below
      }

      if (existingLead) {
        lead_id = existingLead.id;
      } else {
        // Lead not found - create new user with admin client
        try {
          const { user: newUser, error: createError } =
            await createUserWithProfile({
              email: body.visitor_email,
              email_confirm: true,
              user_metadata: {
                full_name: body.visitor_name,
                phone: body.visitor_phone,
                user_type: 'buyer',
              },
            });

          if (createError || !newUser) {
            console.error('Error creating user:', createError);
            return NextResponse.json(
              {
                error:
                  'Failed to create user account. Please ensure the visitor has an account or try again later.',
              },
              { status: 500 }
            );
          }

          lead_id = newUser.id;
        } catch (error: any) {
          console.error('Error creating user:', error);
          return NextResponse.json(
            {
              error:
                'Failed to create user account. Please ensure the visitor has an account or try again later.',
            },
            { status: 500 }
          );
        }
      }
    } else {
      // Verify lead exists
      const { data: leadExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', lead_id)
        .maybeSingle();

      if (!leadExists) {
        return NextResponse.json(
          { error: 'Lead not found with provided lead_id' },
          { status: 404 }
        );
      }
    }

    // =============================================
    // CREATE CALENDAR EVENT
    // =============================================
    // Create calendar event
    let eventResult: {
      success: boolean;
      event_id?: string;
      meet_link?: string;
      error?: string;
    } = { success: false };

    try {
      eventResult = await googleCalendarClient.createSiteVisitEvent({
        builder_id: body.builder_id,
        lead_name: body.visitor_name,
        lead_email: body.visitor_email,
        lead_phone: body.visitor_phone,
        property_title: property.title,
        property_address: property.address || property.location || '',
        visit_datetime: visitDateTime,
        duration_minutes: duration,
      });

      if (!eventResult.success) {
        console.error(
          'Failed to create calendar event:',
          eventResult.error
        );
        // Continue with booking even if calendar fails
      }
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
      // Continue with booking even if calendar fails
    }

    // =============================================
    // CREATE SITE VISIT BOOKING
    // =============================================
    // Create site visit booking
    const { data: booking, error: bookingError } = await supabase
      .from('site_visit_bookings')
      .insert({
        lead_id,
        builder_id: body.builder_id,
        property_id: body.property_id,
        calendar_event_id: null, // Will be updated if calendar event is created
        visit_date: visitDateTime.toISOString().split('T')[0],
        visit_time: visitDateTime.toTimeString().split(' ')[0],
        visit_datetime: visitDateTime.toISOString(),
        duration_minutes: duration,
        visitor_name: body.visitor_name,
        visitor_email: body.visitor_email,
        visitor_phone: body.visitor_phone,
        visitor_count: body.visitor_count || 1,
        meeting_point: body.meeting_point,
        special_instructions: body.special_instructions,
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      throw bookingError;
    }

    // =============================================
    // UPDATE BOOKING WITH CALENDAR EVENT ID
    // =============================================
    // Update booking with calendar event ID if available
    if (eventResult.success && eventResult.event_id) {
      // Get calendar event from database
      const { data: calendarEvent } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('google_event_id', eventResult.event_id)
        .single();

      if (calendarEvent) {
        await supabase
          .from('site_visit_bookings')
          .update({ calendar_event_id: calendarEvent.id })
          .eq('id', booking.id);
      }
    }

    // =============================================
    // SEND CONFIRMATION EMAIL TO VISITOR
    // =============================================
    // Send confirmation email to visitor
    try {
      await resendClient.sendTemplateEmail({
        template_id: 'site_visit_confirmation',
        to: body.visitor_email,
        variables: {
          name: body.visitor_name,
          property_title: property.title,
          date: visitDateTime.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          time: visitDateTime.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          address: property.address || property.location || '',
          builder_name: builder.full_name || 'Builder',
          builder_phone: builder.phone || '',
          meet_link: eventResult.meet_link || '',
        },
      });
    } catch (error: any) {
      console.error('Error sending confirmation email:', error);
      // Continue even if email fails
    }

    // =============================================
    // SEND SMS CONFIRMATION
    // =============================================
    // Send SMS confirmation
    try {
      // Try to find SMS template
      const { data: smsTemplate } = await supabase
        .from('message_templates')
        .select('id')
        .eq('type', 'sms')
        .eq('is_active', true)
        .ilike('name', '%site%visit%')
        .limit(1)
        .maybeSingle();

      if (smsTemplate) {
        await twilioClient.sendTemplateSMS({
          template_id: smsTemplate.id,
          to: body.visitor_phone,
          variables: {
            name: body.visitor_name,
            property_title: property.title,
            date: visitDateTime.toLocaleDateString('en-IN'),
            time: visitDateTime.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            address: property.address || property.location || '',
            builder_phone: builder.phone || '',
          },
        });
      } else {
        // Send simple SMS if template not found
        const smsBody = `Hi ${body.visitor_name}, your site visit for ${property.title} is confirmed for ${visitDateTime.toLocaleDateString('en-IN')} at ${visitDateTime.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}. Address: ${property.address || property.location || ''}`;
        await twilioClient.sendSMS({
          to: body.visitor_phone,
          body: smsBody,
        });
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      // Continue even if SMS fails
    }

    // =============================================
    // NOTIFY BUILDER
    // =============================================
    // Notify builder
    try {
      if (builder.email) {
        await resendClient.sendEmail({
          to: builder.email,
          subject: `New Site Visit Booking: ${property.title}`,
          html: `
            <h2>New Site Visit Booked!</h2>
            <p><strong>Property:</strong> ${property.title}</p>
            <p><strong>Visitor:</strong> ${body.visitor_name}</p>
            <p><strong>Phone:</strong> ${body.visitor_phone}</p>
            <p><strong>Email:</strong> ${body.visitor_email}</p>
            <p><strong>Date & Time:</strong> ${visitDateTime.toLocaleString('en-IN')}</p>
            <p><strong>Number of Visitors:</strong> ${body.visitor_count || 1}</p>
            ${
              body.meeting_point
                ? `<p><strong>Meeting Point:</strong> ${body.meeting_point}</p>`
                : ''
            }
            ${
              body.special_instructions
                ? `<p><strong>Special Instructions:</strong> ${body.special_instructions}</p>`
                : ''
            }
            <p><a href="https://tharaga.co.in/builder/site-visits/${booking.id}">View Details</a></p>
          `,
        });
      }
    } catch (error: any) {
      console.error('Error sending builder notification:', error);
      // Continue even if notification fails
    }

    // =============================================
    // RETURN RESPONSE
    // =============================================
    return NextResponse.json({
      success: true,
      booking,
      calendar_event_id: eventResult.event_id,
      meet_link: eventResult.meet_link,
    });
  } catch (error: any) {
    console.error('Error creating site visit booking:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create site visit booking' },
      { status: 500 }
    );
  }
}

// =============================================
// GET - List site visit bookings
// =============================================
export async function GET(request: NextRequest) {
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
    const status = searchParams.get('status');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    // =============================================
    // BUILD QUERY
    // =============================================
    // Build query - get bookings for builder or lead
    let query = supabase
      .from('site_visit_bookings')
      .select('*')
      .or(`builder_id.eq.${user.id},lead_id.eq.${user.id}`)
      .order('visit_datetime', { ascending: true });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (start_date) {
      query = query.gte('visit_date', start_date);
    }

    if (end_date) {
      query = query.lte('visit_date', end_date);
    }

    // =============================================
    // EXECUTE QUERY
    // =============================================
    const { data: bookings, error } = await query;

    if (error) throw error;

    // =============================================
    // ENRICH BOOKINGS WITH RELATED DATA (BATCH)
    // =============================================
    // Collect unique IDs for batch fetching
    const leadIds = [
      ...new Set((bookings || []).map((b: any) => b.lead_id).filter(Boolean)),
    ];
    const propertyIds = [
      ...new Set(
        (bookings || []).map((b: any) => b.property_id).filter(Boolean)
      ),
    ];
    const calendarEventIds = [
      ...new Set(
        (bookings || [])
          .map((b: any) => b.calendar_event_id)
          .filter(Boolean)
      ),
    ];

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
        .select('id, title, location, image')
        .in('id', propertyIds);

      if (propertiesData) {
        propertiesData.forEach((property) => {
          propertiesMap.set(property.id, property);
        });
      }
    }

    // Batch fetch calendar events
    const calendarEventsMap = new Map();
    if (calendarEventIds.length > 0) {
      const { data: calendarEventsData } = await supabase
        .from('calendar_events')
        .select('id, meet_link')
        .in('id', calendarEventIds);

      if (calendarEventsData) {
        calendarEventsData.forEach((event) => {
          calendarEventsMap.set(event.id, event);
        });
      }
    }

    // Enrich bookings with related data
    const enrichedBookings = (bookings || []).map((booking: any) => ({
      ...booking,
      lead: booking.lead_id ? leadsMap.get(booking.lead_id) || null : null,
      property: booking.property_id
        ? propertiesMap.get(booking.property_id) || null
        : null,
      calendar_event: booking.calendar_event_id
        ? calendarEventsMap.get(booking.calendar_event_id) || null
        : null,
    }));

    // =============================================
    // RETURN RESPONSE
    // =============================================
    return NextResponse.json({
      bookings: enrichedBookings,
      total: enrichedBookings.length,
    });
  } catch (error: any) {
    console.error('Error fetching site visit bookings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch site visit bookings' },
      { status: 500 }
    );
  }
}

// =============================================
// PATCH - Update site visit status
// =============================================
export async function PATCH(request: NextRequest) {
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
    const {
      booking_id,
      status,
      cancellation_reason,
      feedback_rating,
      feedback_comments,
    } = body;

    // =============================================
    // VALIDATE PARAMETERS
    // =============================================
    if (!booking_id) {
      return NextResponse.json(
        { error: 'booking_id is required' },
        { status: 400 }
      );
    }

    // =============================================
    // VERIFY BOOKING OWNERSHIP
    // =============================================
    // Verify booking belongs to user (builder or lead)
    const { data: existingBooking, error: verifyError } = await supabase
      .from('site_visit_bookings')
      .select('builder_id, lead_id, status')
      .eq('id', booking_id)
      .single();

    if (verifyError || !existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (
      existingBooking.builder_id !== user.id &&
      existingBooking.lead_id !== user.id
    ) {
      return NextResponse.json(
        { error: 'Unauthorized - Booking does not belong to user' },
        { status: 403 }
      );
    }

    // =============================================
    // BUILD UPDATE OBJECT
    // =============================================
    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      // Validate status
      const validStatuses = [
        'pending',
        'confirmed',
        'completed',
        'cancelled',
        'no_show',
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }

      updates.status = status;

      if (status === 'cancelled') {
        updates.cancellation_reason = cancellation_reason;
        updates.cancelled_by =
          existingBooking.builder_id === user.id ? 'builder' : 'lead';
      }

      if (status === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
        updates.confirmed_by = user.id;
      }

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
    }

    if (feedback_rating !== undefined) {
      if (feedback_rating < 1 || feedback_rating > 5) {
        return NextResponse.json(
          { error: 'feedback_rating must be between 1 and 5' },
          { status: 400 }
        );
      }
      updates.feedback_rating = feedback_rating;
    }

    if (feedback_comments !== undefined) {
      updates.feedback_comments = feedback_comments;
    }

    // =============================================
    // UPDATE BOOKING
    // =============================================
    // Update booking
    const { data: booking, error: updateError } = await supabase
      .from('site_visit_bookings')
      .update(updates)
      .eq('id', booking_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // =============================================
    // FETCH RELATED DATA FOR NOTIFICATIONS
    // =============================================
    // Fetch related data for notifications
    const { data: leadData } = await supabase
      .from('profiles')
      .select('email, full_name, phone')
      .eq('id', booking.lead_id)
      .single();

    const { data: propertyData } = await supabase
      .from('properties')
      .select('title')
      .eq('id', booking.property_id)
      .single();

    // =============================================
    // SEND NOTIFICATIONS BASED ON STATUS CHANGE
    // =============================================
    // Send notifications based on status change
    if (status === 'confirmed' && leadData?.email) {
      try {
        await resendClient.sendEmail({
          to: leadData.email,
          subject: 'Site Visit Confirmed!',
          html: `
            <h2>Site Visit Confirmed!</h2>
            <p>Hello ${leadData.full_name || 'Guest'},</p>
            <p>Your site visit for <strong>${propertyData?.title || 'Property'}</strong> has been confirmed for ${new Date(
            booking.visit_datetime
          ).toLocaleString('en-IN')}.</p>
            <p>We look forward to meeting you!</p>
          `,
        });
      } catch (error: any) {
        console.error('Error sending confirmation email:', error);
        // Continue even if email fails
      }
    }

    if (status === 'cancelled' && leadData?.email) {
      try {
        await resendClient.sendEmail({
          to: leadData.email,
          subject: 'Site Visit Cancelled',
          html: `
            <h2>Site Visit Cancelled</h2>
            <p>Hello ${leadData.full_name || 'Guest'},</p>
            <p>Your site visit for <strong>${propertyData?.title || 'Property'}</strong> has been cancelled.</p>
            ${
              cancellation_reason
                ? `<p><strong>Reason:</strong> ${cancellation_reason}</p>`
                : ''
            }
            <p>If you have any questions, please contact us.</p>
          `,
        });
      } catch (error: any) {
        console.error('Error sending cancellation email:', error);
        // Continue even if email fails
      }
    }

    // =============================================
    // RETURN RESPONSE
    // =============================================
    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        lead: leadData,
        property: propertyData,
      },
    });
  } catch (error: any) {
    console.error('Error updating site visit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update site visit' },
      { status: 500 }
    );
  }
}

