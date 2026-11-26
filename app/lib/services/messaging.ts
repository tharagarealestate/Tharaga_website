/**
 * THARAGA Messaging Service
 *
 * Unified messaging interface - currently stubs for SMS/WhatsApp.
 * Will connect to MSG91 or Gupshup (10x cheaper than Twilio for India).
 *
 * For now, logs messages to Supabase for tracking.
 */

import { createClient } from '@supabase/supabase-js';

export interface MessageRequest {
  to: string;
  body: string;
  channel: 'sms' | 'whatsapp' | 'email';
  templateId?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  channel: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  channel: 'sms' | 'whatsapp' | 'email';
  variables: string[];
}

// Default templates for common real estate scenarios
export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'lead_welcome',
    name: 'Welcome New Lead',
    body: 'Hi {{name}}, thank you for your interest in {{property}}. Our team will reach out to you shortly. - Tharaga',
    channel: 'whatsapp',
    variables: ['name', 'property'],
  },
  {
    id: 'site_visit_confirm',
    name: 'Site Visit Confirmation',
    body: 'Hi {{name}}, your site visit for {{property}} is confirmed on {{date}} at {{time}}. Address: {{address}}',
    channel: 'whatsapp',
    variables: ['name', 'property', 'date', 'time', 'address'],
  },
  {
    id: 'follow_up',
    name: 'Follow Up',
    body: 'Hi {{name}}, we wanted to check in about {{property}}. Would you like to schedule a visit? Reply YES to confirm.',
    channel: 'sms',
    variables: ['name', 'property'],
  },
  {
    id: 'price_update',
    name: 'Price Update Alert',
    body: 'Great news {{name}}! {{property}} now has a special offer. New price: {{price}}. Limited time only!',
    channel: 'whatsapp',
    variables: ['name', 'property', 'price'],
  },
];

function applyTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Send a message via the configured provider.
 * Currently logs to Supabase; will connect to MSG91/Gupshup in production.
 */
export async function sendMessage(request: MessageRequest): Promise<MessageResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Log the message to Supabase
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('messages').insert({
        to_number: request.to,
        body: request.body,
        channel: request.channel,
        status: 'queued',
        template_id: request.templateId,
        metadata: request.metadata || {},
      });
    }

    // TODO: Connect to MSG91 or Gupshup API here
    // For now, return success (message logged in DB)
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      channel: request.channel,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      channel: request.channel,
    };
  }
}

/**
 * Send a templated message with variable substitution.
 */
export async function sendTemplatedMessage(
  to: string,
  templateId: string,
  variables: Record<string, string>,
  channel: 'sms' | 'whatsapp' = 'whatsapp'
): Promise<MessageResponse> {
  const template = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    return { success: false, error: `Template ${templateId} not found`, channel };
  }

  const body = applyTemplate(template.body, variables);
  return sendMessage({ to, body, channel, templateId });
}

export function getTemplates(): MessageTemplate[] {
  return DEFAULT_TEMPLATES;
}
