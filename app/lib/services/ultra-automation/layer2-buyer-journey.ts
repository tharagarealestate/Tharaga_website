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

  // Get builder info
  const { getBuilderInfo } = await import('./helpers');
  const builderInfo = await getBuilderInfo(journey.builder_id);

  const template = await getEmailTemplate(subscription?.tier || 'starter');

  if (template && builderInfo) {
    const lead = (journey as any).lead;
    const property = (journey as any).property;
    
    // Send email
    const emailResult = await sendBuilderEmail({
      propertyId: journey.property_id,
      builderId: journey.builder_id,
      builderName: builderInfo.name,
      builderEmail: builderInfo.email,
      propertyName: property?.property_name || property?.title || 'Property',
      leadCount: 1,
      qualityLeads: 1,
      highQualityLeads: 1,
      mediumQualityLeads: 0,
      leads: [{
        name: lead?.lead_buyer_name || 'Buyer',
        email: lead?.lead_buyer_email || '',
        phone: lead?.lead_buyer_phone || '',
        timeline: lead?.timeline || '3months',
        score: lead?.lead_quality_score || lead?.quality_score || 50
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
  const supabase = getSupabase();
  const lead = (journey as any).lead;
  const property = (journey as any).property;
  
  if (!lead?.lead_buyer_email) {
    console.warn(`[Buyer Journey] No buyer email found for journey ${journey.id}`);
    return false;
  }

  // Get default email templates from database or use built-in templates
  const defaultTemplates = getDefaultEmailTemplates(stage, emailNumber);
  
  if (!defaultTemplates) {
    console.warn(`[Buyer Journey] No default template found for stage: ${stage}, email: ${emailNumber}`);
    return false;
  }

  // Personalize template
  const personalizedSubject = personalizeTemplate(defaultTemplates.subject, journey);
  const personalizedHtml = personalizeTemplate(defaultTemplates.html, journey);

  try {
    const { resendClient } = await import('@/lib/integrations/email/resendClient');
    
    const result = await resendClient.sendEmail({
      to: lead.lead_buyer_email,
      subject: personalizedSubject,
      html: personalizedHtml,
    });

    if (result.success) {
      // Log execution
      await supabase
        .from('email_sequence_executions')
        .insert([{
          journey_id: journey.id,
          sequence_id: null,
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
        .eq('id', journey.id);

      return true;
    }

    return false;
  } catch (error) {
    console.error('[Buyer Journey] Error sending default email:', error);
    return false;
  }
}

/**
 * Get default email templates
 */
function getDefaultEmailTemplates(stage: string, emailNumber: number): { subject: string; html: string } | null {
  const templates: Record<string, Record<number, { subject: string; html: string }>> = {
    discovery: {
      1: {
        subject: 'Discover Your Dream Property: {{propertyName}}',
        html: `
          <h2>Discover Your Dream Property</h2>
          <p>Hi {{buyerName}},</p>
          <p>We found a property that matches your requirements perfectly!</p>
          <p><strong>{{propertyName}}</strong> in {{propertyLocation}} is exactly what you're looking for.</p>
          <p><strong>Price:</strong> {{propertyPrice}}</p>
          <p><strong>Type:</strong> {{propertyType}}</p>
          <p>Would you like to schedule a viewing? We're here to help you find your perfect home.</p>
          <p>Best regards,<br>Tharaga Team</p>
        `
      },
      2: {
        subject: 'Still Interested in {{propertyName}}?',
        html: `
          <h2>Still Interested?</h2>
          <p>Hi {{buyerName}},</p>
          <p>We wanted to follow up on <strong>{{propertyName}}</strong>.</p>
          <p>This property is generating a lot of interest. If you're still considering it, we'd love to show you around.</p>
          <p>Schedule a viewing today and see why this property is perfect for you.</p>
          <p>Best regards,<br>Tharaga Team</p>
        `
      }
    },
    social_proof: {
      1: {
        subject: 'See What Others Are Saying About {{propertyName}}',
        html: `
          <h2>What Others Are Saying</h2>
          <p>Hi {{buyerName}},</p>
          <p>Many buyers like you have already shown interest in <strong>{{propertyName}}</strong>.</p>
          <p>This property is in high demand. Don't miss out on this opportunity!</p>
          <p>Schedule your viewing today and join the satisfied buyers who found their dream property.</p>
          <p>Best regards,<br>Tharaga Team</p>
        `
      }
    },
    urgency: {
      1: {
        subject: 'Limited Availability: {{propertyName}}',
        html: `
          <h2>Limited Availability</h2>
          <p>Hi {{buyerName}},</p>
          <p><strong>{{propertyName}}</strong> has limited units available.</p>
          <p>Act now to secure your dream property before it's too late!</p>
          <p>Contact us today to schedule a viewing and make this property yours.</p>
          <p>Best regards,<br>Tharaga Team</p>
        `
      }
    },
    alternative: {
      1: {
        subject: 'Alternative Properties You Might Like',
        html: `
          <h2>Alternative Properties</h2>
          <p>Hi {{buyerName}},</p>
          <p>If <strong>{{propertyName}}</strong> isn't quite right, we have other properties that might be perfect for you.</p>
          <p>Let us know what you're looking for, and we'll find the ideal property for your needs.</p>
          <p>Best regards,<br>Tharaga Team</p>
        `
      }
    },
    builder_intro: {
      1: {
        subject: 'Meet the Builder: {{propertyName}}',
        html: `
          <h2>Meet the Builder</h2>
          <p>Hi {{buyerName}},</p>
          <p>We'd love to introduce you to the builder of <strong>{{propertyName}}</strong>.</p>
          <p>Schedule a meeting to discuss your requirements and see how we can make this property perfect for you.</p>
          <p>Best regards,<br>Tharaga Team</p>
        `
      }
    }
  };

  return templates[stage]?.[emailNumber] || null;
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

