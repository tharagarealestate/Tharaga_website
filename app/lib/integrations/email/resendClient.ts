// =============================================
// RESEND EMAIL CLIENT - SIMPLE IMPLEMENTATION
// Handles email sending via Resend API
// =============================================

// =============================================
// TYPES
// =============================================
export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface TemplateEmailOptions {
  template_id: string;
  to: string;
  variables: Record<string, any>;
}

export interface EmailSendResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

// =============================================
// RESEND CLIENT CLASS
// =============================================
export class ResendClient {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail =
      process.env.RESEND_FROM_EMAIL || 'noreply@tharaga.co.in';

    if (!this.apiKey) {
      console.warn(
        'Resend API key not configured. Emails will be logged but not sent.'
      );
    }
  }

  /**
   * Send email using Resend API
   */
  async sendEmail(options: EmailOptions): Promise<EmailSendResult> {
    try {
      if (!this.apiKey) {
        console.log('[Email] Would send email:', {
          to: options.to,
          subject: options.subject,
          html: options.html?.substring(0, 100) + '...',
        });
        return {
          success: true,
          message_id: 'mock-' + Date.now(),
        };
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: options.from || this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Resend API error:', error);
        return {
          success: false,
          error: `Failed to send email: ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        message_id: data.id,
      };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Send email using template
   */
  async sendTemplateEmail(
    options: TemplateEmailOptions
  ): Promise<EmailSendResult> {
    try {
      // For now, use a simple template replacement
      // In production, you would fetch the template from Resend or database
      const template = this.getTemplate(options.template_id);

      if (!template) {
        console.warn(
          `Template ${options.template_id} not found. Using default template.`
        );
        return this.sendEmail({
          to: options.to,
          subject: 'Site Visit Confirmation',
          html: this.replaceVariables(
            '<h2>Site Visit Confirmed</h2><p>Hello {{name}},</p><p>Your site visit for {{property_title}} has been confirmed for {{date}} at {{time}}.</p>',
            options.variables
          ),
        });
      }

      const subject = this.replaceVariables(
        template.subject,
        options.variables
      );
      const html = this.replaceVariables(template.html, options.variables);

      return this.sendEmail({
        to: options.to,
        subject,
        html,
      });
    } catch (error: any) {
      console.error('Error sending template email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send template email',
      };
    }
  }

  /**
   * Replace variables in template
   */
  private replaceVariables(
    template: string,
    variables: Record<string, any>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value || ''));
    }
    return result;
  }

  /**
   * Get email template
   */
  private getTemplate(template_id: string): {
    subject: string;
    html: string;
  } | null {
    // Simple template storage - in production, fetch from database or Resend
    const templates: Record<
      string,
      { subject: string; html: string }
    > = {
      site_visit_confirmation: {
        subject: 'Site Visit Confirmed - {{property_title}}',
        html: `
          <h2>Site Visit Confirmed!</h2>
          <p>Hello {{name}},</p>
          <p>Your site visit for <strong>{{property_title}}</strong> has been confirmed.</p>
          <p><strong>Date:</strong> {{date}}</p>
          <p><strong>Time:</strong> {{time}}</p>
          <p><strong>Address:</strong> {{address}}</p>
          <p><strong>Meeting Link:</strong> {{meet_link}}</p>
          <p>For any questions, please contact {{builder_name}} at {{builder_phone}}.</p>
          <p>We look forward to meeting you!</p>
        `,
      },
    };

    return templates[template_id] || null;
  }
}

// Export singleton instance
let resendClientInstance: ResendClient | null = null;

function getResendClient(): ResendClient {
  if (!resendClientInstance) {
    resendClientInstance = new ResendClient();
  }
  return resendClientInstance;
}

export const resendClient = getResendClient();

