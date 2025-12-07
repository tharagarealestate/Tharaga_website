/**
 * Email Service using Resend
 * Handles templated email delivery to builders
 */

import { Resend } from 'resend';
import { getSupabase } from '../supabase';

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('Resend API key not configured. Emails will be logged but not sent.');
      return null;
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export interface EmailTemplate {
  id: string;
  tier: string;
  template_name: string;
  subject: string;
  html_body: string;
  text_body?: string;
}

export interface EmailData {
  propertyId?: string;
  builderId: string;
  builderName: string;
  builderEmail: string;
  propertyName: string;
  leadCount: number;
  qualityLeads: number;
  highQualityLeads: number;
  mediumQualityLeads: number;
  leads: Array<{
    name: string;
    email: string;
    phone: string;
    timeline: string;
    score: number;
  }>;
}

/**
 * Get email template for a subscription tier
 */
export async function getEmailTemplate(tier: string): Promise<EmailTemplate | null> {
  const supabase = getSupabase();

  // Map tier names
  const tierMap: Record<string, string> = {
    'starter': 'starter',
    'trial': 'starter',
    'professional': 'professional',
    'growth': 'professional',
    'enterprise': 'enterprise',
    'pro': 'enterprise'
  };

  const mappedTier = tierMap[tier.toLowerCase()] || 'starter';

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('tier', mappedTier)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error('[Email Service] Error fetching template:', error);
    return null;
  }

  return data as EmailTemplate;
}

/**
 * Build personalized email HTML from template
 */
export function buildEmailHTML(template: EmailTemplate, data: EmailData): string {
  let html = template.html_body;

  // Replace placeholders
  html = html.replace(/\{\{builderName\}\}/g, data.builderName || 'Builder');
  html = html.replace(/\{\{propertyName\}\}/g, data.propertyName || 'Property');
  html = html.replace(/\{\{leadCount\}\}/g, data.leadCount.toString());
  html = html.replace(/\{\{qualityLeads\}\}/g, data.qualityLeads.toString());
  html = html.replace(/\{\{highQualityLeads\}\}/g, data.highQualityLeads.toString());
  html = html.replace(/\{\{mediumQualityLeads\}\}/g, data.mediumQualityLeads.toString());

  // Build leads table
  const leadsTable = buildLeadsTable(data.leads);
  html = html.replace(/\{\{leadsTable\}\}/g, leadsTable);

  return html;
}

/**
 * Build leads table HTML
 */
function buildLeadsTable(leads: EmailData['leads']): string {
  if (leads.length === 0) {
    return '<p>No leads available.</p>';
  }

  // Show top 15 leads in email
  const topLeads = leads.slice(0, 15);

  const tableRows = topLeads.map(lead => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left;">${escapeHtml(lead.name)}</td>
      <td style="padding: 12px; text-align: left;">${escapeHtml(lead.email)}</td>
      <td style="padding: 12px; text-align: left;">${escapeHtml(lead.phone)}</td>
      <td style="padding: 12px; text-align: left;">${escapeHtml(lead.timeline)}</td>
      <td style="padding: 12px; text-align: center;">
        <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; ${
          lead.score >= 80 ? 'background-color: #dcfce7; color: #166534;' :
          lead.score >= 70 ? 'background-color: #fef3c7; color: #92400e;' :
          'background-color: #fee2e2; color: #991b1b;'
        }">
          ${lead.score}/100
        </span>
      </td>
    </tr>
  `).join('');

  const moreLeadsText = leads.length > 15 
    ? `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #6b7280; font-style: italic;">... and ${leads.length - 15} more leads in your dashboard</td></tr>`
    : '';

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white;">
      <thead>
        <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
          <th style="padding: 12px; text-align: left; font-weight: bold; color: #1e40af;">Name</th>
          <th style="padding: 12px; text-align: left; font-weight: bold; color: #1e40af;">Email</th>
          <th style="padding: 12px; text-align: left; font-weight: bold; color: #1e40af;">Phone</th>
          <th style="padding: 12px; text-align: left; font-weight: bold; color: #1e40af;">Timeline</th>
          <th style="padding: 12px; text-align: center; font-weight: bold; color: #1e40af;">Quality</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
        ${moreLeadsText}
      </tbody>
    </table>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Build plain text email from template
 */
export function buildEmailText(template: EmailTemplate, data: EmailData): string {
  let text = template.text_body || template.html_body;

  // Remove HTML tags for plain text
  text = text.replace(/<[^>]*>/g, '');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');

  // Replace placeholders
  text = text.replace(/\{\{builderName\}\}/g, data.builderName || 'Builder');
  text = text.replace(/\{\{propertyName\}\}/g, data.propertyName || 'Property');
  text = text.replace(/\{\{leadCount\}\}/g, data.leadCount.toString());
  text = text.replace(/\{\{qualityLeads\}\}/g, data.qualityLeads.toString());
  text = text.replace(/\{\{highQualityLeads\}\}/g, data.highQualityLeads.toString());
  text = text.replace(/\{\{mediumQualityLeads\}\}/g, data.mediumQualityLeads.toString());

  // Add leads list
  const leadsList = data.leads.slice(0, 10).map((lead, index) => 
    `${index + 1}. ${lead.name} - ${lead.email} - ${lead.phone} - ${lead.timeline} - Score: ${lead.score}/100`
  ).join('\n');

  text = text.replace(/\{\{leadsTable\}\}/g, leadsList);

  return text;
}

/**
 * Send email to builder
 */
export async function sendBuilderEmail(
  data: EmailData,
  template: EmailTemplate
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = getResend();
    if (!resend) {
      throw new Error('Resend API key not configured');
    }

    const html = buildEmailHTML(template, data);
    const text = buildEmailText(template, data);
    const subject = template.subject
      .replace(/\{\{propertyName\}\}/g, data.propertyName || 'Property')
      .replace(/\{\{leadCount\}\}/g, data.leadCount.toString());

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Tharaga <leads@tharaga.co.in>',
      to: data.builderEmail,
      subject: subject,
      html: html,
      text: text,
    });

    if (result.error) {
      throw new Error(result.error.message || 'Failed to send email');
    }

    // Log email delivery
    await logEmailDelivery({
      propertyId: data.propertyId,
      builderId: data.builderId,
      recipientEmail: data.builderEmail,
      subject: subject,
      templateId: template.id,
      status: 'sent',
      providerMessageId: result.data?.id,
    });

    return {
      success: true,
      messageId: result.data?.id
    };

  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    
    // Log failed delivery
    await logEmailDelivery({
      propertyId: data.propertyId,
      builderId: data.builderId,
      recipientEmail: data.builderEmail,
      subject: template.subject,
      templateId: template.id,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Log email delivery to database
 */
async function logEmailDelivery(data: {
  propertyId?: string;
  builderId: string;
  recipientEmail: string;
  subject: string;
  templateId?: string;
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed';
  providerMessageId?: string;
  error?: string;
}): Promise<void> {
  try {
    const supabase = getSupabase();

    await supabase
      .from('email_delivery_logs')
      .insert([{
        property_id: data.propertyId || null,
        builder_id: data.builderId,
        recipient_email: data.recipientEmail,
        subject: data.subject,
        template_id: data.templateId || null,
        status: data.status,
        provider_message_id: data.providerMessageId || null,
        sent_at: data.status === 'sent' ? new Date().toISOString() : null,
        provider_response: data.error ? { error: data.error } : null,
      }]);
  } catch (error) {
    console.error('[Email Service] Error logging delivery:', error);
    // Don't throw - logging is non-critical
  }
}


