/**
 * LAYER 2: BUYER JOURNEY AUTOMATION
 * 5-sequence email automation based on buyer actions
 */

import { getSupabase } from '@/lib/supabase';
import { sendBuilderEmail } from '../emailService';
import { getEmailTemplate } from '../emailService';

export interface BuyerJourneyStage {
  stage: 'discovery' | 'social_proof' | 'urgency' | 'alternative' | 'builder_intro';
  triggeredAt: Date;
  emailSent: boolean;
  opened: boolean;
  clicked: boolean;
  responded: boolean;
}

/**
 * Initialize buyer journey for a lead
 */
export async function initializeBuyerJourney(
  leadId: string,
  propertyId: string,
  builderId: string
): Promise<string> {
  const supabase = getSupabase();

  // Create journey
  const { data: journey, error } = await supabase
    .from('buyer_journey')
    .insert([{
      lead_id: leadId,
      property_id: propertyId,
      builder_id: builderId,
      current_stage: 'discovery',
      next_action_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    }])
    .select('id')
    .single();

  if (error || !journey) {
    throw new Error(`Failed to create journey: ${error?.message}`);
  }

  // Send first email (Discovery)
  await sendJourneyEmail(journey.id, 'discovery', 1);

  return journey.id;
}

/**
 * Send journey email based on stage
 */
export async function sendJourneyEmail(
  journeyId: string,
  stage: string,
  emailNumber: number
): Promise<boolean> {
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

  if (!journey) return false;

  // Get email sequence template
  const { data: sequence } = await supabase
    .from('email_sequences')
    .select('*')
    .eq('sequence_type', stage)
    .eq('email_number', emailNumber)
    .eq('is_active', true)
    .single();

  if (!sequence) {
    // Use default template if custom not found
    return await sendDefaultJourneyEmail(journey, stage, emailNumber);
  }

  // Personalize email
  const personalizedSubject = personalizeTemplate(sequence.subject_template, journey);
  const personalizedHtml = personalizeTemplate(sequence.html_body_template, journey);

  // Get builder email template for sending
  const { data: subscription } = await supabase
    .from('builder_subscriptions')
    .select('tier')
    .eq('builder_id', journey.builder_id)
    .single();

  const template = await getEmailTemplate(subscription?.tier || 'starter');

  if (template) {
    // Send email
    const emailResult = await sendBuilderEmail({
      propertyId: journey.property_id,
      builderId: journey.builder_id,
      builderName: 'Builder', // Get from profiles
      builderEmail: (journey as any).lead?.lead_buyer_email || '',
      propertyName: (journey as any).property?.property_name || 'Property',
      leadCount: 1,
      qualityLeads: 1,
      highQualityLeads: 1,
      mediumQualityLeads: 0,
      leads: [{
        name: (journey as any).lead?.lead_buyer_name || 'Buyer',
        email: (journey as any).lead?.lead_buyer_email || '',
        phone: (journey as any).lead?.lead_buyer_phone || '',
        timeline: (journey as any).lead?.timeline || '3months',
        score: (journey as any).lead?.lead_quality_score || 50
      }]
    }, template);

    // Log execution
    await supabase
      .from('email_sequence_executions')
      .insert([{
        journey_id: journeyId,
        sequence_id: sequence.id,
        email_number: emailNumber,
        subject: personalizedSubject,
        personalized_html: personalizedHtml,
        sent_at: new Date().toISOString()
      }]);

    // Update journey
    await supabase
      .from('buyer_journey')
      .update({
        emails_sent: (journey.emails_sent || 0) + 1,
        next_action_at: calculateNextActionTime(stage, emailNumber)
      })
      .eq('id', journeyId);

    return emailResult.success;
  }

  return false;
}

/**
 * Personalize template with journey data
 */
function personalizeTemplate(template: string, journey: any): string {
  const lead = journey.lead || {};
  const property = journey.property || {};

  return template
    .replace(/\{\{buyerName\}\}/g, lead.lead_buyer_name || 'Buyer')
    .replace(/\{\{propertyName\}\}/g, property.property_name || property.title || 'Property')
    .replace(/\{\{propertyPrice\}\}/g, `₹${(property.price_inr || 0).toLocaleString('en-IN')}`)
    .replace(/\{\{propertyLocation\}\}/g, property.locality || property.city || 'Location')
    .replace(/\{\{propertyType\}\}/g, property.property_type || 'Property');
}

/**
 * Calculate next action time based on stage
 */
function calculateNextActionTime(stage: string, emailNumber: number): string {
  const now = Date.now();
  let hoursToAdd = 24; // Default: 24 hours

  switch (stage) {
    case 'discovery':
      hoursToAdd = emailNumber === 1 ? 24 : 48; // Email 1: 24h, Email 2: 48h
      break;
    case 'social_proof':
      hoursToAdd = 48; // 2 days
      break;
    case 'urgency':
      hoursToAdd = 72; // 3 days
      break;
    case 'alternative':
      hoursToAdd = 168; // 7 days
      break;
    case 'builder_intro':
      hoursToAdd = 336; // 14 days
      break;
  }

  return new Date(now + hoursToAdd * 60 * 60 * 1000).toISOString();
}

/**
 * Send default journey email if custom template not found
 */
async function sendDefaultJourneyEmail(
  journey: any,
  stage: string,
  emailNumber: number
): Promise<boolean> {
  // Default email templates would be implemented here
  // For now, return false to indicate template needed
  console.warn(`[Buyer Journey] No template found for stage: ${stage}, email: ${emailNumber}`);
  return false;
}

/**
 * Process buyer action and advance journey
 */
export async function processBuyerAction(
  journeyId: string,
  action: 'opened' | 'clicked' | 'responded' | 'no_response',
  actionData?: any
): Promise<void> {
  const supabase = getSupabase();

  const { data: journey } = await supabase
    .from('buyer_journey')
    .select('*')
    .eq('id', journeyId)
    .single();

  if (!journey) return;

  const updates: any = {
    last_engagement_at: new Date().toISOString()
  };

  // Update engagement metrics
  if (action === 'opened') {
    updates.emails_opened = (journey.emails_opened || 0) + 1;
  } else if (action === 'clicked') {
    updates.emails_clicked = (journey.emails_clicked || 0) + 1;
  } else if (action === 'responded') {
    updates.has_responded = true;
    updates.response_type = actionData?.type || 'interested';
    updates.response_data = actionData || {};
    // Advance to next stage
    updates.current_stage = getNextStage(journey.current_stage);
  }

  // Determine next email based on action
  if (action === 'no_response' && !journey.has_responded) {
    // Send next email in sequence
    const nextEmailNumber = (journey.emails_sent || 0) + 1;
    if (nextEmailNumber <= 5) {
      await sendJourneyEmail(journeyId, journey.current_stage, nextEmailNumber);
    } else {
      // Move to next stage
      updates.current_stage = getNextStage(journey.current_stage);
      updates.next_action_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  await supabase
    .from('buyer_journey')
    .update(updates)
    .eq('id', journeyId);
}

/**
 * Get next stage in journey
 */
function getNextStage(currentStage: string): string {
  const stages = ['discovery', 'social_proof', 'urgency', 'alternative', 'builder_intro'];
  const currentIndex = stages.indexOf(currentStage);
  return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : 'builder_intro';
}

