/**
 * Scheduled Email Sequence Processor
 * Cron job endpoint to process and send scheduled emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getAdminClient();

    // Fetch due emails (scheduled_for <= now, status = scheduled, attempts < 3)
    const { data: dueEmails, error: fetchError } = await supabase
      .from('email_sequence_queue')
      .select(`
        *,
        lead:leads(*),
        property:properties(*),
        builder:builders(*)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .lt('attempts', 3)
      .order('scheduled_for', { ascending: true })
      .limit(50);

    if (fetchError) {
      throw new Error(`Failed to fetch due emails: ${fetchError.message}`);
    }

    if (!dueEmails || dueEmails.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No emails due for sending'
      });
    }

    const results = [];

    for (const email of dueEmails) {
      try {
        const emailData = email as any;
        const lead = emailData.lead;
        const property = emailData.property;
        const builder = emailData.builder;

        // Validate lead is still active
        if (lead && (lead.status === 'closed' || lead.status === 'lost')) {
          await supabase
            .from('email_sequence_queue')
            .update({ 
              status: 'cancelled',
              metadata: { ...emailData.metadata, reason: 'Lead no longer active' }
            })
            .eq('id', emailData.id);
          continue;
        }

        // Check builder subscription
        const { data: subscription } = await supabase
          .from('builder_subscriptions')
          .select('*')
          .eq('builder_id', emailData.builder_id)
          .eq('status', 'active')
          .single();

        if (!subscription) {
          await supabase
            .from('email_sequence_queue')
            .update({ 
              status: 'cancelled',
              metadata: { ...emailData.metadata, reason: 'Builder subscription inactive' }
            })
            .eq('id', emailData.id);
          continue;
        }

        // Check email quota
        const monthlyLimit = subscription.email_quota || 1000;
        const usedEmails = subscription.emails_sent_this_month || 0;

        if (usedEmails >= monthlyLimit) {
          await supabase
            .from('email_sequence_queue')
            .update({ 
              status: 'deferred',
              metadata: { ...emailData.metadata, reason: 'Email quota exceeded' }
            })
            .eq('id', emailData.id);
          continue;
        }

        // Personalize content
        let html = emailData.html_content;
        let text = emailData.text_content || html.replace(/<[^>]*>/g, '');
        let subject = emailData.subject;

        const personalizations: Record<string, string> = {
          '{{recipientName}}': lead?.name || lead?.lead_buyer_name || 'Valued Customer',
          '{{builderName}}': builder?.name || 'Builder',
          '{{propertyName}}': property?.title || property?.property_name || 'Property',
          '{{dashboardLink}}': `https://tharaga.co.in/builder/leads/${emailData.lead_id}`,
          '{{currentDate}}': new Date().toLocaleDateString('en-IN'),
          '{{sequencePosition}}': emailData.sequence_position.toString()
        };

        Object.entries(personalizations).forEach(([key, value]) => {
          html = html.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
          text = text.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
          subject = subject.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });

        // Add tracking pixel
        const trackingPixel = `<img src="https://tharaga.co.in/api/track/open?email_id=${emailData.id}&lead_id=${emailData.lead_id}" width="1" height="1" alt="" style="display:none;" />`;
        html = html.replace('</body>', `${trackingPixel}</body>`);

        // Wrap links for click tracking
        html = html.replace(
          /<a href="([^"]+)"/g,
          (match, url) => {
            if (url.startsWith('http')) {
              return `<a href="https://tharaga.co.in/api/track/click?email_id=${emailData.id}&lead_id=${emailData.lead_id}&url=${encodeURIComponent(url)}"`;
            }
            return match;
          }
        );

        // Send via Resend
        if (!resend) {
          throw new Error('Resend API key not configured');
        }

        const sendResult = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Tharaga <leads@tharaga.co.in>',
          to: lead?.email || lead?.lead_buyer_email || '',
          subject: subject,
          html: html,
          text: text,
          tags: [
            `sequence:${emailData.id}`,
            `lead:${emailData.lead_id}`,
            `builder:${emailData.builder_id}`,
            `position:${emailData.sequence_position}`
          ],
          headers: {
            'X-Entity-Ref-ID': emailData.id,
            'List-Unsubscribe': `<https://tharaga.co.in/unsubscribe?lead=${emailData.lead_id}>`
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
            attempts: emailData.attempts + 1
          })
          .eq('id', emailData.id);

        // Log to email_delivery_logs
        await supabase
          .from('email_delivery_logs')
          .insert({
            property_id: emailData.property_id,
            builder_id: emailData.builder_id,
            lead_id: emailData.lead_id,
            recipient_email: lead?.email || lead?.lead_buyer_email,
            subject: subject,
            status: 'sent',
            provider_message_id: sendResult.data?.id,
            sent_at: new Date().toISOString(),
            metadata: {
              sequence_id: emailData.id,
              sequence_position: emailData.sequence_position,
              campaign_type: 'nurture'
            }
          });

        // Update builder quota
        await supabase
          .from('builder_subscriptions')
          .update({ emails_sent_this_month: usedEmails + 1 })
          .eq('builder_id', emailData.builder_id);

        results.push({
          id: emailData.id,
          status: 'sent',
          messageId: sendResult.data?.id
        });

      } catch (error: any) {
        console.error(`[Sequence Processor] Error processing email ${email.id}:`, error);
        
        // Update attempts
        await supabase
          .from('email_sequence_queue')
          .update({
            attempts: (email as any).attempts + 1,
            status: (email as any).attempts >= 2 ? 'failed' : 'scheduled',
            metadata: {
              ...(email as any).metadata,
              last_error: error.message,
              last_attempt: new Date().toISOString()
            }
          })
          .eq('id', (email as any).id);

        results.push({
          id: (email as any).id,
          status: 'failed',
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results: results
    });

  } catch (error: any) {
    console.error('[Sequence Processor] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

