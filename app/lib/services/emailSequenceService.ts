/**
 * Email Sequence Service with AI Content Generation
 * Handles personalized email sequence creation, scheduling, and sending
 */

import { getAdminClient } from '../supabase/admin';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface LeadContext {
  leadId: string | number;
  name: string;
  email: string;
  phone?: string;
  budget?: number;
  preferences?: Record<string, any>;
  leadScore: number;
  status: string;
  createdAt: string;
  lastInteractionAt?: string;
}

export interface PropertyContext {
  id: string;
  name: string;
  price: number;
  type: string;
  location: string;
  bhkType?: string;
  amenities?: string[];
}

export interface BuilderContext {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface BehaviorContext {
  interactions: Array<{
    type: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  engagementScore: number;
  buyerStage: 'awareness' | 'consideration' | 'decision';
  daysSinceFirstContact: number;
  emailOpens: number;
  emailClicks: number;
  pageViews: number;
}

export interface EmailSequence {
  day: number;
  subject: string;
  html: string;
  text: string;
  cta: string;
  ctaUrl?: string;
}

export interface SequenceSchedule {
  leadId: string | number;
  builderId: string;
  propertyId?: string;
  sequencePosition: number;
  scheduledFor: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  cta: string;
  status: 'scheduled' | 'sent' | 'delivered' | 'paused' | 'cancelled' | 'failed';
  metadata?: Record<string, any>;
}

/**
 * Analyze lead behavior and determine buyer stage
 */
export async function analyzeLeadBehavior(
  leadId: string | number
): Promise<BehaviorContext> {
  const supabase = getAdminClient();

  // Fetch lead interactions
  const { data: interactions } = await supabase
    .from('lead_interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(50);

  const interactionsList = interactions || [];

  // Calculate engagement metrics
  const pageViews = interactionsList.filter((i: any) => i.type === 'page_view').length;
  const formSubmissions = interactionsList.filter((i: any) => i.type === 'form_submit').length;
  const emailOpens = interactionsList.filter((i: any) => i.type === 'email_open').length;
  const emailClicks = interactionsList.filter((i: any) => i.type === 'email_click').length;

  // Calculate engagement score
  const engagementScore = (pageViews * 1) + (formSubmissions * 3) + (emailOpens * 2) + (emailClicks * 5);

  // Determine buyer stage
  let buyerStage: 'awareness' | 'consideration' | 'decision' = 'awareness';
  if (engagementScore >= 15) buyerStage = 'decision';
  else if (engagementScore >= 5) buyerStage = 'consideration';

  // Get lead creation date
  const { data: lead } = await supabase
    .from('leads')
    .select('created_at')
    .eq('id', leadId)
    .single();

  const daysSinceFirstContact = lead
    ? Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    interactions: interactionsList.map((i: any) => ({
      type: i.type || i.interaction_type,
      timestamp: i.created_at,
      metadata: i.metadata
    })),
    engagementScore,
    buyerStage,
    daysSinceFirstContact,
    emailOpens,
    emailClicks,
    pageViews
  };
}

/**
 * Generate AI-powered email sequence using Claude
 */
export async function generateEmailSequence(
  leadContext: LeadContext,
  propertyContext: PropertyContext,
  builderContext: BuilderContext,
  behaviorContext: BehaviorContext
): Promise<EmailSequence[]> {
  if (!anthropic.apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const prompt = `You are an expert real estate sales consultant for Tharaga, India's first zero-commission property platform.

Lead Profile:
- Name: ${leadContext.name}
- Budget: ₹${(leadContext.budget || 0).toLocaleString('en-IN')}
- Preferences: ${JSON.stringify(leadContext.preferences || {})}
- Lead Score: ${leadContext.leadScore}/100
- Status: ${leadContext.status}

Property:
- Name: ${propertyContext.name}
- Price: ₹${propertyContext.price.toLocaleString('en-IN')}
- Type: ${propertyContext.type}
- Location: ${propertyContext.location}
- BHK: ${propertyContext.bhkType || 'Not specified'}

Builder:
- Name: ${builderContext.name}

Buyer Stage: ${behaviorContext.buyerStage}
Days Since Contact: ${behaviorContext.daysSinceFirstContact}
Engagement Score: ${behaviorContext.engagementScore}
Email Opens: ${behaviorContext.emailOpens}
Email Clicks: ${behaviorContext.emailClicks}
Page Views: ${behaviorContext.pageViews}

Recent Interactions:
${JSON.stringify(behaviorContext.interactions.slice(0, 10), null, 2)}

Generate a personalized email sequence (3 emails) that:
1. First email (Day 0): Welcome and property highlights matching their preferences, create excitement
2. Second email (Day 3): Address common objections, highlight local area benefits, showcase similar properties, build trust
3. Third email (Day 7): Create urgency with limited offers, offer exclusive viewing slot, include testimonials, strong CTA

For each email, provide:
- day: number (0, 3, or 7)
- subject: string (compelling, personalized, <60 chars, include emoji if appropriate)
- html: string (HTML email body, warm and friendly tone, 150-250 words, include clear CTA button)
- text: string (plain text version, same content)
- cta: string (call-to-action text, e.g., "Schedule Viewing", "Get Pricing Details")
- ctaUrl: string (suggested URL for CTA, e.g., "/schedule-viewing?property=${propertyContext.id}&lead=${leadContext.leadId}")

Important:
- Use Indian English and cultural context
- Include property-specific details
- Personalize based on buyer stage and engagement
- Make CTAs action-oriented
- Use warm, professional tone
- Include builder name naturally
- Reference location benefits

Return ONLY valid JSON in this exact format:
{
  "emails": [
    {
      "day": 0,
      "subject": "...",
      "html": "...",
      "text": "...",
      "cta": "...",
      "ctaUrl": "..."
    }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    let responseText = content.text.trim();
    
    // Clean up JSON if wrapped in code blocks
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```\n?/g, '');
    }

    const aiResponse = JSON.parse(responseText);
    const emails = aiResponse.emails || [];

    if (emails.length === 0) {
      throw new Error('No emails generated by AI');
    }

    // Validate and format emails
    return emails.map((email: any) => ({
      day: email.day || 0,
      subject: email.subject || 'Property Update',
      html: email.html || '',
      text: email.text || email.html?.replace(/<[^>]*>/g, '') || '',
      cta: email.cta || 'Learn More',
      ctaUrl: email.ctaUrl || `https://tharaga.co.in/properties/${propertyContext.id}`
    }));

  } catch (error: any) {
    console.error('[Email Sequence Service] AI generation error:', error);
    throw new Error(`Failed to generate email sequence: ${error.message}`);
  }
}

/**
 * Create and schedule email sequence
 */
export async function createEmailSequence(
  leadId: string | number,
  builderId: string,
  propertyId?: string
): Promise<SequenceSchedule[]> {
  const supabase = getAdminClient();

  // Fetch all context data
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (!lead) {
    throw new Error('Lead not found');
  }

  const { data: property } = propertyId
    ? await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()
    : { data: null };

  const { data: builder } = await supabase
    .from('builders')
    .select('*')
    .eq('id', builderId)
    .single();

  if (!builder) {
    throw new Error('Builder not found');
  }

  // Build contexts
  const leadContext: LeadContext = {
    leadId,
    name: lead.name || lead.lead_buyer_name || 'Valued Customer',
    email: lead.email || lead.lead_buyer_email || '',
    phone: lead.phone || lead.lead_buyer_phone,
    budget: lead.budget || lead.estimated_budget,
    preferences: lead.preferences || {},
    leadScore: lead.ai_lead_score || 0,
    status: lead.status || 'new',
    createdAt: lead.created_at,
    lastInteractionAt: lead.last_interaction_at
  };

  const propertyContext: PropertyContext = {
    id: property?.id || '',
    name: property?.title || property?.property_name || 'Property',
    price: property?.price_inr || property?.price || 0,
    type: property?.property_type || property?.bhk_type || 'Apartment',
    location: property?.location || property?.locality || property?.city || '',
    bhkType: property?.bhk_type,
    amenities: property?.amenities ? (Array.isArray(property.amenities) ? property.amenities : []) : []
  };

  const builderContext: BuilderContext = {
    id: builder.id,
    name: builder.name || 'Builder',
    email: builder.email || '',
    phone: builder.phone
  };

  // Analyze behavior
  const behaviorContext = await analyzeLeadBehavior(leadId);

  // Generate AI sequence
  const emailSequences = await generateEmailSequence(
    leadContext,
    propertyContext,
    builderContext,
    behaviorContext
  );

  // Create schedule entries
  const sequenceEntries: SequenceSchedule[] = emailSequences.map((email, index) => ({
    leadId,
    builderId,
    propertyId: property?.id || null,
    sequencePosition: index + 1,
    scheduledFor: new Date(Date.now() + (email.day * 24 * 60 * 60 * 1000)).toISOString(),
    subject: email.subject,
    htmlContent: email.html,
    textContent: email.text,
    cta: email.cta,
    status: 'scheduled' as const,
    metadata: {
      buyer_stage: behaviorContext.buyerStage,
      engagement_score: behaviorContext.engagementScore,
      days_since_contact: behaviorContext.daysSinceFirstContact,
      ai_generated: true,
      cta_url: email.ctaUrl
    }
  }));

  // Insert into database
  const { data: inserted, error } = await supabase
    .from('email_sequence_queue')
    .insert(sequenceEntries.map(e => ({
      lead_id: e.leadId,
      builder_id: e.builderId,
      property_id: e.propertyId,
      sequence_position: e.sequencePosition,
      scheduled_for: e.scheduledFor,
      subject: e.subject,
      html_content: e.htmlContent,
      text_content: e.textContent,
      cta: e.cta,
      status: e.status,
      metadata: e.metadata
    })))
    .select();

  if (error) {
    throw new Error(`Failed to create sequence: ${error.message}`);
  }

  return sequenceEntries;
}

/**
 * Personalize email content with dynamic variables
 */
export function personalizeEmailContent(
  template: string,
  variables: Record<string, string>
): string {
  let content = template;

  // Replace all placeholders
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    content = content.replace(regex, value || '');
  });

  return content;
}

/**
 * Add tracking to email HTML
 */
export function addEmailTracking(
  html: string,
  emailId: string,
  leadId: string | number
): string {
  // Add tracking pixel
  const trackingPixel = `<img src="https://tharaga.co.in/api/track/open?email_id=${emailId}&lead_id=${leadId}" width="1" height="1" alt="" style="display:none;" />`;
  
  // Insert before closing body tag
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${trackingPixel}</body>`);
  } else {
    html = `${html}${trackingPixel}`;
  }

  // Wrap links for click tracking
  html = html.replace(
    /<a\s+([^>]*href=["'])([^"']+)(["'][^>]*)>/gi,
    (match, before, url, after) => {
      if (url.startsWith('http') && !url.includes('tharaga.co.in/api/track')) {
        const trackedUrl = `https://tharaga.co.in/api/track/click?email_id=${emailId}&lead_id=${leadId}&url=${encodeURIComponent(url)}`;
        return `<a ${before}${trackedUrl}${after}>`;
      }
      return match;
    }
  );

  return html;
}

/**
 * Send scheduled email from sequence
 */
export async function sendSequenceEmail(
  sequenceId: string,
  retryAttempt: number = 0
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const supabase = getAdminClient();

  if (!resend) {
    throw new Error('Resend API key not configured');
  }

  // Fetch sequence data
  const { data: sequence, error: seqError } = await supabase
    .from('email_sequence_queue')
    .select(`
      *,
      lead:leads(*),
      property:properties(*),
      builder:builders(*)
    `)
    .eq('id', sequenceId)
    .single();

  if (seqError || !sequence) {
    throw new Error('Sequence not found');
  }

  const seq = sequence as any;
  const lead = seq.lead;
  const property = seq.property;
  const builder = seq.builder;

  // Validate lead is still active
  if (lead && (lead.status === 'closed' || lead.status === 'lost')) {
    await supabase
      .from('email_sequence_queue')
      .update({ status: 'cancelled' })
      .eq('id', sequenceId);
    throw new Error('Lead no longer active');
  }

  // Check builder subscription
  const { data: subscription } = await supabase
    .from('builder_subscriptions')
    .select('*')
    .eq('builder_id', seq.builder_id)
    .eq('status', 'active')
    .single();

  if (!subscription) {
    await supabase
      .from('email_sequence_queue')
      .update({ status: 'cancelled' })
      .eq('id', sequenceId);
    throw new Error('Builder subscription inactive');
  }

  // Check email quota
  const monthlyLimit = subscription.email_quota || 1000;
  const usedEmails = subscription.emails_sent_this_month || 0;

  if (usedEmails >= monthlyLimit) {
    await supabase
      .from('email_sequence_queue')
      .update({ status: 'deferred' })
      .eq('id', sequenceId);
    throw new Error('Email quota exceeded');
  }

  // Personalize content
  const personalizations: Record<string, string> = {
    recipientName: lead?.name || lead?.lead_buyer_name || 'Valued Customer',
    builderName: builder?.name || 'Builder',
    propertyName: property?.title || property?.property_name || 'Property',
    dashboardLink: `https://tharaga.co.in/builder/leads/${seq.lead_id}`,
    unsubscribeLink: `https://tharaga.co.in/unsubscribe?lead=${seq.lead_id}`,
    currentDate: new Date().toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    sequencePosition: seq.sequence_position.toString()
  };

  let html = seq.html_content;
  let text = seq.text_content || html.replace(/<[^>]*>/g, '');
  let subject = seq.subject;

  // Replace placeholders
  Object.entries(personalizations).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(regex, value);
    text = text.replace(regex, value);
    subject = subject.replace(regex, value);
  });

  // Add tracking
  html = addEmailTracking(html, sequenceId, seq.lead_id);

  // Send via Resend
  try {
    const sendResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Tharaga <leads@tharaga.co.in>',
      to: lead?.email || lead?.lead_buyer_email || '',
      subject: subject,
      html: html,
      text: text,
      tags: [
        `sequence:${sequenceId}`,
        `lead:${seq.lead_id}`,
        `builder:${seq.builder_id}`,
        `position:${seq.sequence_position}`
      ],
      headers: {
        'X-Entity-Ref-ID': sequenceId,
        'List-Unsubscribe': `<https://tharaga.co.in/unsubscribe?lead=${seq.lead_id}>`
      }
    });

    if (sendResult.error) {
      throw new Error(sendResult.error.message || 'Failed to send email');
    }

    // Update sequence status
    await supabase
      .from('email_sequence_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider_message_id: sendResult.data?.id,
        attempts: (seq.attempts || 0) + 1
      })
      .eq('id', sequenceId);

    // Log to email_delivery_logs
    await supabase
      .from('email_delivery_logs')
      .insert({
        property_id: seq.property_id,
        builder_id: seq.builder_id,
        lead_id: seq.lead_id,
        recipient_email: lead?.email || lead?.lead_buyer_email,
        subject: subject,
        status: 'sent',
        provider_message_id: sendResult.data?.id,
        sent_at: new Date().toISOString(),
        metadata: {
          sequence_id: sequenceId,
          sequence_position: seq.sequence_position,
          campaign_type: 'nurture'
        }
      });

    // Update builder quota
    await supabase
      .from('builder_subscriptions')
      .update({ emails_sent_this_month: usedEmails + 1 })
      .eq('builder_id', seq.builder_id);

    return {
      success: true,
      messageId: sendResult.data?.id
    };

  } catch (error: any) {
    // Update attempts
    await supabase
      .from('email_sequence_queue')
      .update({
        attempts: (seq.attempts || 0) + 1,
        status: (seq.attempts || 0) >= 2 ? 'failed' : 'scheduled',
        metadata: {
          ...(seq.metadata || {}),
          last_error: error.message,
          last_attempt: new Date().toISOString()
        }
      })
      .eq('id', sequenceId);

    return {
      success: false,
      error: error.message
    };
  }
}


























