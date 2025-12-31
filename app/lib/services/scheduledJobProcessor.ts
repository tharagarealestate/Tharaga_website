/**
 * Scheduled Job Processor Service
 * Handles all cron job processing for email automation
 */

import { getAdminClient } from '../supabase/admin';
import { sendSequenceEmail } from './emailSequenceService';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface JobResult {
  success: boolean;
  processed: number;
  failed: number;
  results?: any[];
  error?: string;
}

/**
 * Process scheduled email sequences
 * Runs every 5 minutes
 */
export async function processEmailSequenceQueue(): Promise<JobResult> {
  const supabase = getAdminClient();

  try {
    // Fetch due emails
    const { data: dueEmails, error } = await supabase
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

    if (error) {
      throw new Error(`Failed to fetch due emails: ${error.message}`);
    }

    if (!dueEmails || dueEmails.length === 0) {
      return {
        success: true,
        processed: 0,
        failed: 0
      };
    }

    const results = [];
    let processed = 0;
    let failed = 0;

    for (const email of dueEmails) {
      try {
        const result = await sendSequenceEmail((email as any).id);
        if (result.success) {
          processed++;
          results.push({
            id: (email as any).id,
            status: 'sent',
            messageId: result.messageId
          });
        } else {
          failed++;
          results.push({
            id: (email as any).id,
            status: 'failed',
            error: result.error
          });
        }
      } catch (error: any) {
        failed++;
        results.push({
          id: (email as any).id,
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
      error: error.message
    };
  }
}

/**
 * Process scheduled viewing reminders
 * Runs every 5 minutes
 */
export async function processViewingReminders(): Promise<JobResult> {
  const supabase = getAdminClient();

  try {
    // Fetch due reminders
    const { data: dueReminders, error } = await supabase
      .from('scheduled_reminders')
      .select(`
        *,
        viewing:property_viewings(*),
        lead:leads(*),
        property:properties(*),
        builder:builders(*)
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(100);

    if (error) {
      throw new Error(`Failed to fetch due reminders: ${error.message}`);
    }

    if (!dueReminders || dueReminders.length === 0) {
      return {
        success: true,
        processed: 0,
        failed: 0
      };
    }

    const results = [];
    let processed = 0;
    let failed = 0;

    for (const reminder of dueReminders) {
      try {
        const rem = reminder as any;
        const viewing = rem.viewing;
        const lead = rem.lead;
        const property = rem.property;
        const builder = rem.builder;

        // Skip if viewing is cancelled
        if (viewing && viewing.status === 'cancelled') {
          await supabase
            .from('scheduled_reminders')
            .update({ status: 'cancelled' })
            .eq('id', rem.id);
          continue;
        }

        // Generate reminder content based on type
        let urgencyMessage = '';
        let ctaText = '';
        let subject = '';

        switch (rem.reminder_type) {
          case '24h_before':
            urgencyMessage = 'Your property viewing is scheduled for tomorrow';
            ctaText = 'Add to Calendar';
            subject = `📅 Reminder: Property Viewing Tomorrow - ${property?.title || 'Property'}`;
            break;
          case '2h_before':
            urgencyMessage = 'Your viewing starts in 2 hours';
            ctaText = 'Get Directions';
            subject = `⏰ Reminder: Property Viewing in 2 Hours - ${property?.title || 'Property'}`;
            break;
          case '30min_before':
            urgencyMessage = 'Your viewing starts in 30 minutes';
            ctaText = 'Start Navigation';
            subject = `🚨 Reminder: Property Viewing in 30 Minutes - ${property?.title || 'Property'}`;
            break;
        }

        const scheduledTime = viewing?.scheduled_at
          ? new Date(viewing.scheduled_at).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '';

        // Build HTML email
        const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #D4AF37, #4169E1); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #D4AF37; }
    .cta-button { display: inline-block; background: #D4AF37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${urgencyMessage}</h1>
    </div>
    <div class="content">
      <p>Hi ${lead?.name || 'Valued Customer'},</p>
      <p>${urgencyMessage} for <strong>${property?.title || property?.property_name || 'Property'}</strong>.</p>
      
      <div class="info-box">
        <h3>Viewing Details</h3>
        <p><strong>Property:</strong> ${property?.title || property?.property_name}</p>
        <p><strong>Location:</strong> ${property?.location || property?.locality || property?.city}</p>
        <p><strong>Scheduled Time:</strong> ${scheduledTime}</p>
        ${viewing?.meeting_link ? `<p><strong>Meeting Link:</strong> <a href="${viewing.meeting_link}">${viewing.meeting_link}</a></p>` : ''}
        ${property?.google_maps_link ? `<p><strong>Directions:</strong> <a href="${property.google_maps_link}">View on Google Maps</a></p>` : ''}
        <p><strong>Builder Contact:</strong> ${builder?.name || 'Builder'} - ${builder?.phone || ''}</p>
      </div>

      ${rem.reminder_type === '30min_before' ? `
      <p style="color: #C00; font-weight: bold;">⏰ Please leave now to arrive on time!</p>
      ` : ''}

      <div style="text-align: center; margin-top: 30px;">
        ${property?.google_maps_link ? `
        <a href="${property.google_maps_link}" class="cta-button">${ctaText}</a>
        ` : ''}
        ${viewing?.meeting_link ? `
        <a href="${viewing.meeting_link}" class="cta-button">Join Meeting</a>
        ` : ''}
      </div>

      <p style="margin-top: 30px; font-size: 12px; color: #666;">
        If you need to reschedule, please contact ${builder?.name || 'the builder'} at ${builder?.phone || 'the provided number'}.
      </p>
    </div>
  </div>
</body>
</html>
        `;

        // Send email
        if (resend) {
          const sendResult = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Tharaga <noreply@tharaga.co.in>',
            to: lead?.email || lead?.lead_buyer_email || '',
            subject: subject,
            html: html,
            text: html.replace(/<[^>]*>/g, ''),
            tags: [
              'type:viewing_reminder',
              `reminder_type:${rem.reminder_type}`,
              `lead:${rem.lead_id}`,
              `viewing:${rem.viewing_id}`
            ]
          });

          if (sendResult.error) {
            throw new Error(sendResult.error.message || 'Failed to send reminder');
          }

          // Update reminder status
          await supabase
            .from('scheduled_reminders')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', rem.id);

          // Log interaction
          if (rem.lead_id) {
            await supabase
              .from('lead_interactions')
              .insert({
                lead_id: rem.lead_id,
                interaction_type: 'viewing_reminder_sent',
                metadata: {
                  reminder_type: rem.reminder_type,
                  viewing_id: rem.viewing_id,
                  sent_at: new Date().toISOString()
                }
              });
          }

          processed++;
          results.push({
            id: rem.id,
            status: 'sent',
            reminderType: rem.reminder_type
          });
        }

      } catch (error: any) {
        failed++;
        results.push({
          id: (reminder as any).id,
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
      error: error.message
    };
  }
}

/**
 * Reset monthly email quotas
 * Runs on the 1st of each month
 */
export async function resetMonthlyEmailQuotas(): Promise<JobResult> {
  const supabase = getAdminClient();

  try {
    const { error } = await supabase.rpc('reset_monthly_email_quota');

    if (error) {
      // If RPC doesn't exist, do it manually
      const { error: updateError } = await supabase
        .from('builder_subscriptions')
        .update({
          emails_sent_this_month: 0,
          last_quota_reset_at: new Date().toISOString()
        })
        .eq('status', 'active')
        .or('last_quota_reset_at.is.null,last_quota_reset_at.lt.' + new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      if (updateError) {
        throw new Error(`Failed to reset quotas: ${updateError.message}`);
      }
    }

    return {
      success: true,
      processed: 1,
      failed: 0
    };

  } catch (error: any) {
    return {
      success: false,
      processed: 0,
      failed: 0,
      error: error.message
    };
  }
}

/**
 * Update email analytics aggregation
 * Runs daily to aggregate metrics
 */
export async function updateEmailAnalytics(): Promise<JobResult> {
  const supabase = getAdminClient();

  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get all email logs from yesterday
    const { data: emailLogs, error } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .gte('sent_at', yesterday + 'T00:00:00')
      .lt('sent_at', today + 'T00:00:00');

    if (error) {
      throw new Error(`Failed to fetch email logs: ${error.message}`);
    }

    if (!emailLogs || emailLogs.length === 0) {
      return {
        success: true,
        processed: 0,
        failed: 0
      };
    }

    // Group by builder_id, property_id, email_type
    const analyticsMap = new Map<string, any>();

    for (const log of emailLogs) {
      const key = `${log.builder_id}_${log.property_id || 'null'}_${log.metadata?.campaign_type || 'transactional'}_${yesterday}`;
      
      if (!analyticsMap.has(key)) {
        analyticsMap.set(key, {
          builder_id: log.builder_id,
          property_id: log.property_id,
          email_type: log.metadata?.campaign_type || 'transactional',
          date: yesterday,
          sent_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
          bounced_count: 0
        });
      }

      const analytics = analyticsMap.get(key);
      analytics.sent_count++;

      if (log.status === 'delivered') analytics.delivered_count++;
      if (log.opened_at) analytics.opened_count++;
      if (log.clicked_at) analytics.clicked_count++;
      if (log.status === 'bounced') analytics.bounced_count++;
    }

    // Upsert analytics
    const analyticsArray = Array.from(analyticsMap.values());
    let processed = 0;
    let failed = 0;

    for (const analytics of analyticsArray) {
      try {
        const { error: upsertError } = await supabase
          .from('email_analytics')
          .upsert(analytics, {
            onConflict: 'builder_id,property_id,email_type,date'
          });

        if (upsertError) {
          failed++;
        } else {
          processed++;
        }
      } catch (error: any) {
        failed++;
      }
    }

    return {
      success: true,
      processed,
      failed
    };

  } catch (error: any) {
    return {
      success: false,
      processed: 0,
      failed: 0,
      error: error.message
    };
  }
}





















