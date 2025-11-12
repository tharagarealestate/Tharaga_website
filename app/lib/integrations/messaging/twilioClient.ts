// =============================================
// TWILIO MESSAGING CLIENT - PRODUCTION READY
// Handles SMS, WhatsApp, delivery tracking
// =============================================
import twilio from 'twilio';
import { createClient } from '@/lib/supabase/server';

// =============================================
// TYPES
// =============================================
export interface MessageOptions {
  to: string;
  body: string;
  mediaUrl?: string[]; // For images/videos
  from?: string;
  statusCallback?: string;
}

export interface WhatsAppOptions extends MessageOptions {
  template?: {
    name: string;
    variables: Record<string, string>;
  };
}

export interface MessageSendResult {
  success: boolean;
  message_id?: string;
  status?: string;
  error?: string;
  cost?: string;
}

export interface BulkMessageResult {
  total: number;
  successful: number;
  failed: number;
  results: MessageSendResult[];
}

// =============================================
// TWILIO CLIENT CLASS
// =============================================
export class TwilioClient {
  private client: twilio.Twilio;
  private twilioPhone: string;
  private twilioWhatsApp: string;
  private webhookUrl: string;

  // Rate limiting
  private messageQueue: Map<string, number[]> = new Map();
  private readonly SMS_RATE_LIMIT = 10; // messages per minute per number
  private readonly WHATSAPP_RATE_LIMIT = 60; // messages per hour per number

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    this.client = twilio(accountSid, authToken);
    this.twilioPhone = process.env.TWILIO_PHONE_NUMBER || '';
    this.twilioWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || '';
    this.webhookUrl = process.env.TWILIO_WEBHOOK_URL || '';

    // Clean up rate limit cache every 5 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanupRateLimitCache(), 300000);
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(options: MessageOptions): Promise<MessageSendResult> {
    try {
      // Validate phone number
      const phoneNumber = this.formatPhoneNumber(options.to);
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      // Check rate limit
      if (!this.checkRateLimit(phoneNumber, 'sms')) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        };
      }

      // Send SMS via Twilio
      const message = await this.client.messages.create({
        body: options.body,
        from: options.from || this.twilioPhone,
        to: phoneNumber,
        mediaUrl: options.mediaUrl,
        statusCallback: options.statusCallback || this.webhookUrl,
      });

      // Track in database
      await this.trackMessageDelivery({
        message_id: message.sid,
        to: phoneNumber,
        body: options.body,
        type: 'sms',
        status: message.status,
        cost: message.price,
      });

      // Update rate limit
      this.updateRateLimit(phoneNumber, 'sms');

      return {
        success: true,
        message_id: message.sid,
        status: message.status,
        cost: message.price || undefined,
      };
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(options: WhatsAppOptions): Promise<MessageSendResult> {
    try {
      // Format WhatsApp number
      const whatsappNumber = this.formatWhatsAppNumber(options.to);
      if (!whatsappNumber) {
        return {
          success: false,
          error: 'Invalid WhatsApp number format',
        };
      }

      // Check rate limit
      if (!this.checkRateLimit(whatsappNumber, 'whatsapp')) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        };
      }

      // Build message payload
      const messagePayload: any = {
        from: this.twilioWhatsApp,
        to: whatsappNumber,
        statusCallback: options.statusCallback || this.webhookUrl,
      };

      // Use template or direct message
      if (options.template) {
        // WhatsApp template message (pre-approved)
        messagePayload.contentSid = options.template.name;
        messagePayload.contentVariables = JSON.stringify(options.template.variables);
      } else {
        // Direct message
        messagePayload.body = options.body;
        if (options.mediaUrl) {
          messagePayload.mediaUrl = options.mediaUrl;
        }
      }

      // Send via Twilio
      const message = await this.client.messages.create(messagePayload);

      // Track in database
      await this.trackMessageDelivery({
        message_id: message.sid,
        to: whatsappNumber,
        body: options.body,
        type: 'whatsapp',
        status: message.status,
        cost: message.price,
      });

      // Update rate limit
      this.updateRateLimit(whatsappNumber, 'whatsapp');

      return {
        success: true,
        message_id: message.sid,
        status: message.status,
        cost: message.price || undefined,
      };
    } catch (error: any) {
      console.error('Error sending WhatsApp:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send SMS using template
   */
  async sendTemplateSMS(params: {
    template_id: string;
    to: string;
    variables: Record<string, any>;
  }): Promise<MessageSendResult> {
    try {
      const supabase = createClient();
      // Fetch template from database
      const { data: template, error: templateError } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', params.template_id)
        .eq('type', 'sms')
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        return {
          success: false,
          error: 'Template not found or inactive',
        };
      }

      // Replace variables in message body
      const body = this.replaceVariables(template.body, params.variables);

      // Validate SMS length (160 characters for single SMS)
      if (body.length > 1600) {
        console.warn(`SMS message exceeds 1600 characters (${body.length}). Will be split into ${Math.ceil(body.length / 160)} segments.`);
      }

      // Send SMS
      const result = await this.sendSMS({
        to: params.to,
        body,
      });

      // Update template usage count
      if (result.success) {
        await supabase
          .from('message_templates')
          .update({
            times_used: (template.times_used || 0) + 1,
          })
          .eq('id', params.template_id);
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send WhatsApp using template
   */
  async sendTemplateWhatsApp(params: {
    template_id: string;
    to: string;
    variables: Record<string, any>;
  }): Promise<MessageSendResult> {
    try {
      const supabase = createClient();
      // Fetch template from database
      const { data: template, error: templateError } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', params.template_id)
        .eq('type', 'whatsapp')
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        return {
          success: false,
          error: 'Template not found or inactive',
        };
      }

      // Replace variables in message body
      const body = this.replaceVariables(template.body, params.variables);

      // Send WhatsApp
      const result = await this.sendWhatsApp({
        to: params.to,
        body,
      });

      // Update template usage count
      if (result.success) {
        await supabase
          .from('message_templates')
          .update({
            times_used: (template.times_used || 0) + 1,
          })
          .eq('id', params.template_id);
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send bulk SMS messages
   */
  async sendBulkSMS(params: {
    recipients: Array<{
      phone: string;
      lead_id?: string;
      variables?: Record<string, any>;
    }>;
    body?: string;
    template_id?: string;
    campaign_id?: string;
  }): Promise<BulkMessageResult> {
    const results: MessageSendResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const recipient of params.recipients) {
      let result: MessageSendResult;

      if (params.template_id) {
        // Use template
        result = await this.sendTemplateSMS({
          template_id: params.template_id,
          to: recipient.phone,
          variables: recipient.variables || {},
        });
      } else if (params.body) {
        // Use direct message
        result = await this.sendSMS({
          to: recipient.phone,
          body: params.body,
        });
      } else {
        result = {
          success: false,
          error: 'No message body or template provided',
        };
      }

      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Rate limiting: wait 6 seconds between messages (10 per minute)
      await new Promise(resolve => setTimeout(resolve, 6000));
    }

    return {
      total: params.recipients.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Send bulk WhatsApp messages
   */
  async sendBulkWhatsApp(params: {
    recipients: Array<{
      phone: string;
      lead_id?: string;
      variables?: Record<string, any>;
    }>;
    body?: string;
    template_id?: string;
    campaign_id?: string;
  }): Promise<BulkMessageResult> {
    const results: MessageSendResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const recipient of params.recipients) {
      let result: MessageSendResult;

      if (params.template_id) {
        // Use template
        result = await this.sendTemplateWhatsApp({
          template_id: params.template_id,
          to: recipient.phone,
          variables: recipient.variables || {},
        });
      } else if (params.body) {
        // Use direct message
        result = await this.sendWhatsApp({
          to: recipient.phone,
          body: params.body,
        });
      } else {
        result = {
          success: false,
          error: 'No message body or template provided',
        };
      }

      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Rate limiting: wait 60 seconds between messages (60 per hour)
      await new Promise(resolve => setTimeout(resolve, 60000));
    }

    return {
      total: params.recipients.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Handle Twilio webhook for status updates
   */
  async handleWebhook(params: {
    MessageSid: string;
    MessageStatus: string;
    ErrorCode?: string;
    ErrorMessage?: string;
    From: string;
    To: string;
  }): Promise<void> {
    try {
      // Update message status in database
      await this.updateMessageStatus({
        message_id: params.MessageSid,
        status: params.MessageStatus,
        error_code: params.ErrorCode,
        error_message: params.ErrorMessage,
      });

      // Handle specific status events
      switch (params.MessageStatus) {
        case 'delivered':
          await this.handleDelivered(params.MessageSid);
          break;
        case 'failed':
        case 'undelivered':
          await this.handleFailed(params.MessageSid, params.ErrorMessage);
          break;
        case 'read':
          await this.handleRead(params.MessageSid);
          break;
      }
    } catch (error) {
      console.error('Error handling Twilio webhook:', error);
    }
  }

  /**
   * Get message details from Twilio
   */
  async getMessageDetails(message_id: string): Promise<any> {
    try {
      const message = await this.client.messages(message_id).fetch();

      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        price: message.price,
        priceUnit: message.priceUnit,
        direction: message.direction,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
      };
    } catch (error: any) {
      console.error('Error fetching message details:', error);
      return null;
    }
  }

  /**
   * Track message delivery in database
   */
  private async trackMessageDelivery(params: {
    message_id: string;
    to: string;
    body: string;
    type: 'sms' | 'whatsapp';
    status: string;
    cost?: string | null;
  }): Promise<void> {
    try {
      const supabase = createClient();
      // Find lead by phone number (remove non-digits for matching)
      const phoneDigits = params.to.replace(/\D/g, '');
      
      const { data: leads } = await supabase
        .from('leads')
        .select('id, builder_id')
        .or(`phone.eq.${phoneDigits},phone.eq.${params.to}`)
        .limit(1);

      const lead = leads?.[0];

      // Insert interaction record
      await supabase.from('lead_interactions').insert({
        lead_id: lead?.id || null,
        builder_id: lead?.builder_id || null,
        interaction_type: params.type === 'sms' ? 'sms_sent' : 'whatsapp_sent',
        status: 'completed',
        timestamp: new Date().toISOString(),
        metadata: {
          message_id: params.message_id,
          status: params.status,
          body: params.body.substring(0, 500), // Limit size
          cost: params.cost,
          to: params.to,
          type: params.type,
        },
      });
    } catch (error) {
      console.error('Error tracking message delivery:', error);
    }
  }

  /**
   * Update message status in database
   */
  private async updateMessageStatus(params: {
    message_id: string;
    status: string;
    error_code?: string;
    error_message?: string;
  }): Promise<void> {
    try {
      const supabase = createClient();
      // Update the metadata in lead_interactions
      const { data: interactions } = await supabase
        .from('lead_interactions')
        .select('id, metadata')
        .eq('metadata->>message_id', params.message_id)
        .limit(1);

      if (interactions && interactions.length > 0) {
        const interaction = interactions[0];
        const updatedMetadata = {
          ...(interaction.metadata as any || {}),
          status: params.status,
          error_code: params.error_code || null,
          error_message: params.error_message || null,
          updated_at: new Date().toISOString(),
        };

        await supabase
          .from('lead_interactions')
          .update({
            status: params.status === 'delivered' ? 'completed' : 
                   params.status === 'failed' || params.status === 'undelivered' ? 'no_response' : 'pending',
            metadata: updatedMetadata,
          })
          .eq('id', interaction.id);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  /**
   * Handle delivered status
   */
  private async handleDelivered(message_id: string): Promise<void> {
    // Could trigger automation workflows here
    console.log(`Message ${message_id} delivered successfully`);
  }

  /**
   * Handle failed delivery
   */
  private async handleFailed(message_id: string, error?: string): Promise<void> {
    console.error(`Message ${message_id} failed:`, error);
    // Could trigger retry logic or notifications
  }

  /**
   * Handle read status (WhatsApp only)
   */
  private async handleRead(message_id: string): Promise<void> {
    console.log(`Message ${message_id} was read`);
    // Update engagement metrics
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string | null {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Indian phone numbers
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }

    // Already formatted
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }

    // International format
    if (phone.startsWith('+')) {
      return phone.replace(/\D/g, '').replace(/^/, '+');
    }

    return null;
  }

  /**
   * Format WhatsApp number
   */
  private formatWhatsAppNumber(phone: string): string | null {
    const formatted = this.formatPhoneNumber(phone);
    return formatted ? `whatsapp:${formatted}` : null;
  }

  /**
   * Replace template variables
   */
  private replaceVariables(
    template: string,
    variables: Record<string, any>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  /**
   * Check rate limit for phone number
   */
  private checkRateLimit(phone: string, type: 'sms' | 'whatsapp'): boolean {
    const now = Date.now();
    const timestamps = this.messageQueue.get(phone) || [];

    // SMS: 10 per minute
    if (type === 'sms') {
      const recentMessages = timestamps.filter(t => now - t < 60000);
      return recentMessages.length < this.SMS_RATE_LIMIT;
    }

    // WhatsApp: 60 per hour
    const recentMessages = timestamps.filter(t => now - t < 3600000);
    return recentMessages.length < this.WHATSAPP_RATE_LIMIT;
  }

  /**
   * Update rate limit tracking
   */
  private updateRateLimit(phone: string, type: 'sms' | 'whatsapp'): void {
    const now = Date.now();
    const timestamps = this.messageQueue.get(phone) || [];
    
    timestamps.push(now);
    this.messageQueue.set(phone, timestamps);
  }

  /**
   * Clean up old rate limit entries
   */
  private cleanupRateLimitCache(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    for (const [phone, timestamps] of this.messageQueue.entries()) {
      const recent = timestamps.filter(t => t > oneHourAgo);
      
      if (recent.length === 0) {
        this.messageQueue.delete(phone);
      } else {
        this.messageQueue.set(phone, recent);
      }
    }
  }

  /**
   * Get account balance from Twilio
   */
  async getAccountBalance(): Promise<{ balance: string; currency: string } | null> {
    try {
      const account = await this.client.api.v2010.accounts(this.client.accountSid).fetch();
      return {
        balance: account.balance,
        currency: 'USD',
      };
    } catch (error: any) {
      console.error('Error fetching account balance:', error);
      return null;
    }
  }

  /**
   * Get message history for a phone number
   */
  async getMessageHistory(phone: string, limit: number = 50): Promise<any[]> {
    try {
      const formatted = this.formatPhoneNumber(phone);
      if (!formatted) return [];

      const messages = await this.client.messages.list({
        to: formatted,
        limit,
      });

      return messages.map(m => ({
        sid: m.sid,
        status: m.status,
        body: m.body,
        direction: m.direction,
        price: m.price,
        dateCreated: m.dateCreated,
        dateSent: m.dateSent,
      }));
    } catch (error: any) {
      console.error('Error fetching message history:', error);
      return [];
    }
  }
}

// Export singleton instance
let twilioClientInstance: TwilioClient | null = null;

export function getTwilioClient(): TwilioClient {
  if (!twilioClientInstance) {
    twilioClientInstance = new TwilioClient();
  }
  return twilioClientInstance;
}

export const twilioClient = getTwilioClient();

