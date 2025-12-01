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
    .select('property_name, locality, city')
    .eq('id', propertyId)
    .single();

  const { data: lead } = await supabase
    .from('generated_leads')
    .select('lead_buyer_name, lead_buyer_email, lead_buyer_phone')
    .eq('id', leadId)
    .single();

  // Create calendar event (if Google Calendar integration exists)
  let calendarEventId: string | undefined;
  try {
    calendarEventId = await createCalendarEvent({
      title: `Property Viewing: ${property?.property_name || 'Property'}`,
      description: `Viewing scheduled for ${lead?.lead_buyer_name}`,
      location: `${property?.locality || ''}, ${property?.city || ''}`,
      startTime: scheduledAt,
      duration: duration,
      attendeeEmail: lead?.lead_buyer_email
    });
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
  await scheduleViewingReminders(viewing.id, scheduledAt);

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
 * Create calendar event (placeholder - integrate with Google Calendar API)
 */
async function createCalendarEvent(event: {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  duration: number;
  attendeeEmail?: string;
}): Promise<string | undefined> {
  // TODO: Integrate with Google Calendar API
  // For now, return undefined
  return undefined;
}

/**
 * Schedule viewing reminders
 */
async function scheduleViewingReminders(
  viewingId: string,
  scheduledAt: Date
): Promise<void> {
  const supabase = getSupabase();

  const reminders = [
    { type: '24h_before', hours: 24 },
    { type: '1h_before', hours: 1 },
    { type: '30min_before', hours: 0.5 }
  ];

  for (const reminder of reminders) {
    const reminderTime = new Date(scheduledAt.getTime() - reminder.hours * 60 * 60 * 1000);
    
    await supabase
      .from('viewing_reminders')
      .insert([{
        viewing_id: viewingId,
        reminder_type: reminder.type,
        reminder_content: buildReminderContent(reminder.type)
      }]);
  }
}

function buildReminderContent(type: string): string {
  const templates: Record<string, string> = {
    '24h_before': 'Reminder: Your property viewing is scheduled for tomorrow. We look forward to showing you the property!',
    '1h_before': 'Your property viewing is in 1 hour. See you soon!',
    '30min_before': 'Your property viewing is in 30 minutes. Please confirm you\'re on your way.',
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

  // Determine follow-up message based on interest level
  let followUpType = 'interested';
  if (interestLevel >= 8) {
    followUpType = 'high_interest';
  } else if (interestLevel >= 5) {
    followUpType = 'moderate_interest';
  } else {
    followUpType = 'low_interest';
  }

  // This would trigger Layer 2 email sequence
  // For now, just log
  console.log(`[Layer 4] Post-viewing follow-up needed for journey ${journeyId}, interest: ${interestLevel}`);
}

