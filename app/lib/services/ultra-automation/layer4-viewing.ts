/**
 * LAYER 4: VIEWING AUTOMATION
 * Calendar integration and viewing management
 */

import { getSupabase } from '@/lib/supabase';

export interface ViewingSchedule {
  viewingId: string;
  scheduledAt: Date;
  duration: number;
  viewingType: 'in_person' | 'virtual' | 'video_call';
  calendarEventId?: string;
}

/**
 * Schedule property viewing
 */
export async function schedulePropertyViewing(
  journeyId: string,
  propertyId: string,
  leadId: string,
  builderId: string,
  scheduledAt: Date,
  viewingType: 'in_person' | 'virtual' | 'video_call' = 'in_person',
  duration: number = 30
): Promise<ViewingSchedule> {
  const supabase = getSupabase();

  // Create viewing record
  const { data: viewing, error } = await supabase
    .from('property_viewings')
    .insert([{
      journey_id: journeyId,
      property_id: propertyId,
      lead_id: leadId,
      builder_id: builderId,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: duration,
      viewing_type: viewingType,
      status: 'scheduled'
    }])
    .select('id')
    .single();

  if (error || !viewing) {
    throw new Error(`Failed to schedule viewing: ${error?.message}`);
  }

  // Get property and lead details for calendar
  const { data: property } = await supabase
    .from('properties')
    .select('property_name, locality, city, title')
    .eq('id', propertyId)
    .single();

  const { data: lead } = await supabase
    .from('generated_leads')
    .select('lead_buyer_name, lead_buyer_email, lead_buyer_phone')
    .eq('id', leadId)
    .single();

  // Create calendar event using Google Calendar API
  let calendarEventId: string | undefined;
  try {
    const { getGoogleCalendarClient } = await import('@/lib/integrations/calendar/googleCalendar');
    const calendarClient = getGoogleCalendarClient();
    
    // Check if builder has calendar connected
    const connectionStatus = await calendarClient.getConnectionStatus(builderId);
    
    if (connectionStatus.connected) {
      const propertyName = property?.property_name || property?.title || 'Property';
      const propertyLocation = `${property?.locality || ''}, ${property?.city || ''}`.trim();
      
      const result = await calendarClient.createSiteVisitEvent({
        builder_id: builderId,
        lead_name: lead?.lead_buyer_name || 'Buyer',
        lead_email: lead?.lead_buyer_email || '',
        lead_phone: lead?.lead_buyer_phone || '',
        property_title: propertyName,
        property_address: propertyLocation,
        visit_datetime: scheduledAt,
        duration_minutes: duration,
      });
      
      if (result.success && result.event_id) {
        calendarEventId = result.event_id;
      }
    }
  } catch (error) {
    console.error('[Layer 4] Calendar event creation failed:', error);
    // Continue without calendar event
  }

  // Update viewing with calendar event ID
  if (calendarEventId) {
    await supabase
      .from('property_viewings')
      .update({ calendar_event_id: calendarEventId })
      .eq('id', viewing.id);
  }

  // Schedule reminders
  await scheduleViewingReminders(viewing.id, scheduledAt, lead?.lead_buyer_email, lead?.lead_buyer_name, property);

  // Update journey stage
  await supabase
    .from('buyer_journey')
    .update({ current_stage: 'viewing_scheduled' })
    .eq('id', journeyId);

  return {
    viewingId: viewing.id,
    scheduledAt,
    duration,
    viewingType,
    calendarEventId
  };
}

/**
 * Create calendar event using Google Calendar API
 */
async function createCalendarEvent(event: {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  duration: number;
  attendeeEmail?: string;
}): Promise<string | undefined> {
  try {
    const { getGoogleCalendarClient } = await import('@/lib/integrations/calendar/googleCalendar');
    const calendarClient = getGoogleCalendarClient();
    
    // Get builder ID from context (would be passed from parent function)
    // For now, we'll need to get it from the viewing record
    const supabase = getSupabase();
    
    // Get builder ID from the most recent viewing or property
    // This is a simplified approach - in production, builderId should be passed as parameter
    const endTime = new Date(event.startTime);
    endTime.setMinutes(endTime.getMinutes() + event.duration);
    
    const calendarEvent = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      attendees: event.attendeeEmail ? [{
        email: event.attendeeEmail,
        responseStatus: 'needsAction',
      }] : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 }, // 24 hours before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };
    
    // Note: This requires builder_id to be passed from the calling function
    // For now, return undefined if builder_id is not available
    // The actual implementation should pass builder_id as a parameter
    return undefined;
  } catch (error) {
    console.error('[Layer 4] Calendar event creation failed:', error);
    return undefined;
  }
}

/**
 * Schedule viewing reminders
 */
async function scheduleViewingReminders(
  viewingId: string,
  scheduledAt: Date,
  buyerEmail?: string,
  buyerName?: string,
  property?: any
): Promise<void> {
  const supabase = getSupabase();

  const reminders = [
    { type: '24h_before', hours: 24 },
    { type: '1h_before', hours: 1 },
    { type: '30min_before', hours: 0.5 }
  ];

  for (const reminder of reminders) {
    const reminderTime = new Date(scheduledAt.getTime() - reminder.hours * 60 * 60 * 1000);
    
    const reminderContent = buildReminderContent(reminder.type, buyerName, property);
    
    await supabase
      .from('viewing_reminders')
      .insert([{
        viewing_id: viewingId,
        reminder_type: reminder.type,
        reminder_content: reminderContent,
        reminder_scheduled_at: reminderTime.toISOString(),
        is_sent: false
      }]);
    
    // Send email reminder if buyer email is available and reminder time is in the future
    if (buyerEmail && reminderTime > new Date()) {
      // Schedule email sending (would be handled by a cron job or queue)
      // For now, we'll send immediately if it's a past reminder or schedule it
      if (reminderTime <= new Date()) {
        await sendReminderEmail(buyerEmail, buyerName, reminder.type, scheduledAt, property);
      }
    }
  }
}

/**
 * Send reminder email to buyer
 */
async function sendReminderEmail(
  buyerEmail: string,
  buyerName: string | undefined,
  reminderType: string,
  scheduledAt: Date,
  property: any
): Promise<void> {
  try {
    const { resendClient } = await import('@/lib/integrations/email/resendClient');
    
    const propertyName = property?.property_name || property?.title || 'Property';
    const propertyLocation = `${property?.locality || ''}, ${property?.city || ''}`.trim();
    
    let subject = '';
    let message = '';
    
    switch (reminderType) {
      case '24h_before':
        subject = `Reminder: Property Viewing Tomorrow - ${propertyName}`;
        message = `
          <h2>Property Viewing Reminder</h2>
          <p>Hi ${buyerName || 'there'},</p>
          <p>This is a reminder that your property viewing is scheduled for <strong>tomorrow</strong>.</p>
          <p><strong>Property:</strong> ${propertyName}</p>
          <p><strong>Location:</strong> ${propertyLocation}</p>
          <p><strong>Date & Time:</strong> ${scheduledAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          <p>We look forward to showing you the property!</p>
        `;
        break;
      case '1h_before':
        subject = `Reminder: Property Viewing in 1 Hour - ${propertyName}`;
        message = `
          <h2>Property Viewing in 1 Hour</h2>
          <p>Hi ${buyerName || 'there'},</p>
          <p>Your property viewing is in <strong>1 hour</strong>.</p>
          <p><strong>Property:</strong> ${propertyName}</p>
          <p><strong>Location:</strong> ${propertyLocation}</p>
          <p>See you soon!</p>
        `;
        break;
      case '30min_before':
        subject = `Reminder: Property Viewing in 30 Minutes - ${propertyName}`;
        message = `
          <h2>Property Viewing in 30 Minutes</h2>
          <p>Hi ${buyerName || 'there'},</p>
          <p>Your property viewing is in <strong>30 minutes</strong>.</p>
          <p><strong>Property:</strong> ${propertyName}</p>
          <p><strong>Location:</strong> ${propertyLocation}</p>
          <p>Please confirm you're on your way!</p>
        `;
        break;
    }
    
    await resendClient.sendEmail({
      to: buyerEmail,
      subject: subject,
      html: message,
    });
  } catch (error) {
    console.error('[Layer 4] Error sending reminder email:', error);
    // Don't throw - reminder email failure shouldn't break the flow
  }
}

function buildReminderContent(type: string, buyerName?: string, property?: any): string {
  const propertyName = property?.property_name || property?.title || 'Property';
  const templates: Record<string, string> = {
    '24h_before': `Reminder: Your property viewing for ${propertyName} is scheduled for tomorrow. We look forward to showing you the property!`,
    '1h_before': `Your property viewing for ${propertyName} is in 1 hour. See you soon!`,
    '30min_before': `Your property viewing for ${propertyName} is in 30 minutes. Please confirm you're on your way.`,
    'questions_prep': 'Here are some questions to consider during your viewing: [Property features, neighborhood, amenities, payment options]'
  };

  return templates[type] || 'Reminder: Property viewing scheduled';
}

/**
 * Complete viewing and record results
 */
export async function completeViewing(
  viewingId: string,
  results: {
    buyerAttended: boolean;
    viewingDuration?: number;
    interestLevel: number; // 1-10
    builderNotes?: string;
    buyerFeedback?: string;
  }
): Promise<void> {
  const supabase = getSupabase();

  await supabase
    .from('property_viewings')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      buyer_attended: results.buyerAttended,
      viewing_duration_minutes: results.viewingDuration,
      interest_level: results.interestLevel,
      builder_notes: results.builderNotes,
      buyer_feedback: results.buyerFeedback
    })
    .eq('id', viewingId);

  // Update journey
  const { data: viewing } = await supabase
    .from('property_viewings')
    .select('journey_id')
    .eq('id', viewingId)
    .single();

  if (viewing) {
    await supabase
      .from('buyer_journey')
      .update({ current_stage: 'viewing_completed' })
      .eq('id', viewing.journey_id);

    // Send post-viewing follow-up
    await sendPostViewingFollowUp(viewing.journey_id, results.interestLevel);
  }
}

/**
 * Send post-viewing follow-up email
 */
async function sendPostViewingFollowUp(
  journeyId: string,
  interestLevel: number
): Promise<void> {
  const supabase = getSupabase();

  // Get journey details
  const { data: journey } = await supabase
    .from('buyer_journey')
    .select(`
      *,
      lead:generated_leads(*),
      property:properties(*)
    `)
    .eq('id', journeyId)
    .single();

  if (!journey) return;

  const lead = (journey as any).lead;
  const property = (journey as any).property;

  if (!lead?.lead_buyer_email) return;

  // Determine follow-up message based on interest level
  let followUpType = 'interested';
  if (interestLevel >= 8) {
    followUpType = 'high_interest';
  } else if (interestLevel >= 5) {
    followUpType = 'moderate_interest';
  } else {
    followUpType = 'low_interest';
  }

  // Send personalized follow-up email
  try {
    const { resendClient } = await import('@/lib/integrations/email/resendClient');
    
    const propertyName = property?.property_name || property?.title || 'Property';
    const propertyLocation = `${property?.locality || ''}, ${property?.city || ''}`.trim();
    
    let subject = '';
    let message = '';
    
    if (followUpType === 'high_interest') {
      subject = `Thank You for Viewing ${propertyName} - Next Steps`;
      message = `
        <h2>Thank You for Viewing!</h2>
        <p>Hi ${lead.lead_buyer_name || 'there'},</p>
        <p>Thank you for taking the time to view <strong>${propertyName}</strong> at ${propertyLocation}.</p>
        <p>We noticed you showed great interest in the property. Would you like to discuss pricing and next steps?</p>
        <p>I'm here to answer any questions and help make this property yours.</p>
        <p>Best regards,<br>Tharaga Team</p>
      `;
    } else if (followUpType === 'moderate_interest') {
      subject = `Thank You for Viewing ${propertyName}`;
      message = `
        <h2>Thank You for Viewing!</h2>
        <p>Hi ${lead.lead_buyer_name || 'there'},</p>
        <p>Thank you for viewing <strong>${propertyName}</strong> at ${propertyLocation}.</p>
        <p>I'd love to hear your thoughts and answer any questions you might have.</p>
        <p>If this property isn't quite right, I can also show you some alternatives that might be a better fit.</p>
        <p>Best regards,<br>Tharaga Team</p>
      `;
    } else {
      subject = `Thank You for Viewing ${propertyName}`;
      message = `
        <h2>Thank You for Viewing!</h2>
        <p>Hi ${lead.lead_buyer_name || 'there'},</p>
        <p>Thank you for taking the time to view <strong>${propertyName}</strong>.</p>
        <p>I understand this property might not be exactly what you're looking for. I'd be happy to show you other properties that might be a better match for your needs.</p>
        <p>Please let me know what you're looking for, and I'll find the perfect property for you.</p>
        <p>Best regards,<br>Tharaga Team</p>
      `;
    }
    
    await resendClient.sendEmail({
      to: lead.lead_buyer_email,
      subject: subject,
      html: message,
    });
    
    // Trigger Layer 2 email sequence based on interest level
    const { processBuyerAction } = await import('./layer2-buyer-journey');
    await processBuyerAction(journeyId, interestLevel >= 7 ? 'responded' : 'no_response', {
      type: followUpType,
      interestLevel
    });
    
  } catch (error) {
    console.error('[Layer 4] Error sending post-viewing follow-up:', error);
  }
}

