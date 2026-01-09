/**
 * Re-engagement Campaign Service
 * Handles re-engaging inactive leads with personalized content
 */

import { getAdminClient } from '../supabase/admin';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface DormantLead {
  leadId: string | number;
  name: string;
  email: string;
  phone?: string;
  status: string;
  leadScore: number;
  propertyId: string;
  propertyName: string;
  propertyPrice: number;
  propertyLocation: string;
  daysInactive: number;
  emailOpens: number;
  emailClicks: number;
  temperature: 'cooling' | 'warm' | 'cold';
  intentLevel: 'low_intent' | 'medium_intent' | 'high_intent';
}

export interface ReengagementEmail {
  subject: string;
  html: string;
  text: string;
  cta: string;
  ctaUrl: string;
  variant: 'A' | 'B' | 'C';
}

/**
 * Identify dormant leads (7-60 days inactive)
 */
export async function identifyDormantLeads(): Promise<DormantLead[]> {
  const supabase = getAdminClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  // Get leads with last interaction
  const { data: leads, error } = await supabase
    .from('leads')
    .select(`
      *,
      property:properties(*),
      interactions:lead_interactions(*)
    `)
    .in('status', ['qualified', 'engaged'])
    .lt('created_at', sevenDaysAgo)
    .gte('created_at', sixtyDaysAgo);

  if (error) {
    throw new Error(`Failed to fetch dormant leads: ${error.message}`);
  }

  if (!leads) {
    return [];
  }

  const dormantLeads: DormantLead[] = [];

  for (const lead of leads) {
    const l = lead as any;
    const interactions = l.interactions || [];
    
    // Get last interaction date
    const lastInteraction = interactions.length > 0
      ? new Date(interactions[0].created_at)
      : new Date(l.created_at);

    const daysInactive = Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));

    // Skip if too recent or too old
    if (daysInactive < 7 || daysInactive > 60) {
      continue;
    }

    // Check if already sent re-engagement in last 7 days
    const { data: recentCampaigns } = await supabase
      .from('campaign_emails')
      .select('*')
      .eq('lead_id', l.id)
      .eq('campaign_type', 'reengagement')
      .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (recentCampaigns && recentCampaigns.length > 0) {
      continue;
    }

    // Calculate metrics
    const emailOpens = interactions.filter((i: any) => i.type === 'email_open' || i.interaction_type === 'email_open').length;
    const emailClicks = interactions.filter((i: any) => i.type === 'email_click' || i.interaction_type === 'email_click').length;

    // Determine temperature
    let temperature: 'cooling' | 'warm' | 'cold' = 'cooling';
    if (daysInactive >= 30) temperature = 'cold';
    else if (daysInactive >= 14) temperature = 'warm';

    // Determine intent level
    let intentLevel: 'low_intent' | 'medium_intent' | 'high_intent' = 'low_intent';
    if (emailClicks > 0) intentLevel = 'high_intent';
    else if (emailOpens > 2) intentLevel = 'medium_intent';

    const property = l.property;

    dormantLeads.push({
      leadId: l.id,
      name: l.name || l.lead_buyer_name || 'Valued Customer',
      email: l.email || l.lead_buyer_email || '',
      phone: l.phone || l.lead_buyer_phone,
      status: l.status,
      leadScore: l.ai_lead_score || 0,
      propertyId: property?.id || '',
      propertyName: property?.title || property?.property_name || 'Property',
      propertyPrice: property?.price_inr || property?.price || 0,
      propertyLocation: property?.location || property?.locality || property?.city || '',
      daysInactive,
      emailOpens,
      emailClicks,
      temperature,
      intentLevel
    });
  }

  // Sort by priority (cooling first, then warm, then cold)
  dormantLeads.sort((a, b) => {
    const tempOrder = { cooling: 1, warm: 2, cold: 3 };
    if (tempOrder[a.temperature] !== tempOrder[b.temperature]) {
      return tempOrder[a.temperature] - tempOrder[b.temperature];
    }
    return b.leadScore - a.leadScore;
  });

  return dormantLeads.slice(0, 100); // Limit to 100 per run
}

/**
 * Generate re-engagement email content using AI
 */
export async function generateReengagementEmail(
  lead: DormantLead
): Promise<ReengagementEmail> {
  if (!anthropic.apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const prompt = `You are an expert real estate sales consultant for Tharaga, India's first zero-commission property platform.

Lead Context:
- Name: ${lead.name}
- Property: ${lead.propertyName} in ${lead.propertyLocation}
- Price: ₹${lead.propertyPrice.toLocaleString('en-IN')}
- Days Inactive: ${lead.daysInactive}
- Previous Engagement: ${lead.emailOpens} opens, ${lead.emailClicks} clicks
- Lead Score: ${lead.leadScore}/100
- Temperature: ${lead.temperature}
- Intent Level: ${lead.intentLevel}

Strategy:
${lead.temperature === 'cold' ? 'Create urgency with new inventory, price drops, limited offers. Use scarcity tactics.' : ''}
${lead.temperature === 'warm' ? 'Highlight market updates, new amenities, testimonials. Build trust and show value.' : ''}
${lead.temperature === 'cooling' ? 'Gentle reminder, ask if preferences changed, offer alternatives. Be helpful and non-pushy.' : ''}

Generate a personalized re-engagement email that:
1. Acknowledges their previous interest
2. Provides fresh value (updates, offers, or alternatives)
3. Has a clear, compelling CTA
4. Uses warm, friendly tone
5. Is 150-200 words

Provide:
- subject: string (curiosity-driven, personalized, <60 chars, include emoji if appropriate)
- html: string (HTML email body, friendly tone, include clear CTA button)
- text: string (plain text version)
- cta: string (call-to-action text)
- ctaUrl: string (suggested URL)

Return ONLY valid JSON:
{
  "subject": "...",
  "html": "...",
  "text": "...",
  "cta": "...",
  "ctaUrl": "..."
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    let responseText = content.text.trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```\n?/g, '');
    }

    const aiResponse = JSON.parse(responseText);

    // Assign A/B/C variant based on lead ID
    const variantIndex = Number(lead.leadId) % 3;
    const variants: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
    const variant = variants[variantIndex];

    // Modify subject based on variant
    let subject = aiResponse.subject;
    switch (variant) {
      case 'A':
        // Emotional appeal
        if (!subject.includes('✨') && !subject.includes('💫')) {
          subject = `${lead.name}, your dream home is waiting ✨`;
        }
        break;
      case 'B':
        // Urgency appeal
        if (!subject.includes('Limited') && !subject.includes('time')) {
          subject = `Limited time: ${lead.propertyName} update`;
        }
        break;
      case 'C':
        // Value appeal
        if (!subject.includes('Save') && !subject.includes('lakhs')) {
          subject = `Save lakhs on ${lead.propertyName}`;
        }
        break;
    }

    return {
      subject,
      html: aiResponse.html,
      text: aiResponse.text,
      cta: aiResponse.cta,
      ctaUrl: aiResponse.ctaUrl || `https://tharaga.co.in/properties/${lead.propertyId}`,
      variant
    };

  } catch (error: any) {
    console.error('[Re-engagement] AI generation error:', error);
    throw new Error(`Failed to generate re-engagement email: ${error.message}`);
  }
}

/**
 * Send re-engagement campaign email
 */
export async function sendReengagementCampaign(
  lead: DormantLead,
  email: ReengagementEmail
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const supabase = getAdminClient();

  if (!resend) {
    throw new Error('Resend API key not configured');
  }

  try {
    // Get builder ID from property
    const { data: property } = await supabase
      .from('properties')
      .select('builder_id')
      .eq('id', lead.propertyId)
      .single();

    if (!property) {
      throw new Error('Property not found');
    }

    // Check builder subscription
    const { data: subscription } = await supabase
      .from('builder_subscriptions')
      .select('*')
      .eq('builder_id', property.builder_id)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      throw new Error('Builder subscription inactive');
    }

    // Check email quota
    const monthlyLimit = subscription.email_quota || 1000;
    const usedEmails = subscription.emails_sent_this_month || 0;

    if (usedEmails >= monthlyLimit) {
      throw new Error('Email quota exceeded');
    }

    // Send email
    const sendResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Tharaga <leads@tharaga.co.in>',
      to: lead.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [
        'campaign:reengagement',
        `temperature:${lead.temperature}`,
        `variant:${email.variant}`,
        `lead:${lead.leadId}`,
        `builder:${property.builder_id}`
      ],
      headers: {
        'X-Campaign-Type': 'reengagement',
        'X-Lead-Temperature': lead.temperature
      }
    });

    if (sendResult.error) {
      throw new Error(sendResult.error.message || 'Failed to send email');
    }

    // Log campaign send
    await supabase
      .from('campaign_emails')
      .insert({
        campaign_type: 'reengagement',
        lead_id: lead.leadId,
        builder_id: property.builder_id,
        property_id: lead.propertyId,
        variant: email.variant,
        subject: email.subject,
        sent_at: new Date().toISOString(),
        metadata: {
          temperature: lead.temperature,
          days_inactive: lead.daysInactive,
          intent_level: lead.intentLevel
        }
      });

    // Update builder quota
    await supabase
      .from('builder_subscriptions')
      .update({ emails_sent_this_month: usedEmails + 1 })
      .eq('builder_id', property.builder_id);

    // Log to email_delivery_logs
    await supabase
      .from('email_delivery_logs')
      .insert({
        property_id: lead.propertyId,
        builder_id: property.builder_id,
        lead_id: lead.leadId,
        recipient_email: lead.email,
        subject: email.subject,
        status: 'sent',
        provider_message_id: sendResult.data?.id,
        sent_at: new Date().toISOString(),
        metadata: {
          campaign_type: 'reengagement',
          variant: email.variant,
          temperature: lead.temperature
        }
      });

    return {
      success: true,
      messageId: sendResult.data?.id
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process re-engagement campaign for all dormant leads
 */
export async function processReengagementCampaign(): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  results: any[];
}> {
  try {
    const dormantLeads = await identifyDormantLeads();
    const results = [];
    let processed = 0;
    let failed = 0;

    for (const lead of dormantLeads) {
      try {
        const email = await generateReengagementEmail(lead);
        const result = await sendReengagementCampaign(lead, email);

        if (result.success) {
          processed++;
          results.push({
            leadId: lead.leadId,
            status: 'sent',
            variant: email.variant,
            messageId: result.messageId
          });
        } else {
          failed++;
          results.push({
            leadId: lead.leadId,
            status: 'failed',
            error: result.error
          });
        }
      } catch (error: any) {
        failed++;
        results.push({
          leadId: lead.leadId,
          status: 'failed',
          error: error.message
        });
      }
    }

    return {
      success: true,
      processed,
      failed,
      results
    };

  } catch (error: any) {
    return {
      success: false,
      processed: 0,
      failed: 0,
      results: [],
      ...{ error: error.message }
    };
  }
}

























































