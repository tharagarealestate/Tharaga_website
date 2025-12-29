/**
 * Builder Quota Warning System
 * Daily cron job to monitor and alert builders approaching email quota limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getAdminClient();

    // Find builders near quota (80%+ usage or <50 emails remaining)
    const { data: builders, error } = await supabase
      .rpc('get_builders_near_quota', {});

    // If RPC doesn't exist, use direct query
    const { data: buildersData, error: queryError } = await supabase
      .from('builder_subscriptions')
      .select(`
        *,
        builder:builders(*)
      `)
      .eq('status', 'active')
      .or(`emails_sent_this_month.gte.${0.8 * 1000},emails_sent_this_month.gte.${1000 - 50}`);

    if (queryError) {
      throw new Error(`Failed to fetch builders: ${queryError.message}`);
    }

    if (!buildersData || buildersData.length === 0) {
      return NextResponse.json({
        success: true,
        warned: 0,
        message: 'No builders near quota limit'
      });
    }

    const results = [];

    for (const subscription of buildersData) {
      try {
        const sub = subscription as any;
        const builder = sub.builder;
        
        if (!builder) continue;

        const emailQuota = sub.email_quota || 1000;
        const emailsSent = sub.emails_sent_this_month || 0;
        const usagePercentage = (emailsSent / emailQuota) * 100;
        const remaining = emailQuota - emailsSent;
        const daysLeft = 30 - new Date().getDate();
        const projectedOverage = Math.max(0, ((emailsSent / new Date().getDate()) * 30) - emailQuota);

        // Determine warning level
        let warningLevel = 'warning';
        let recommendedAction = 'Consider upgrading plan';
        let urgency = 'MEDIUM';

        if (usagePercentage >= 95) {
          warningLevel = 'critical';
          recommendedAction = 'Immediate upgrade required';
          urgency = 'HIGH';
        } else if (usagePercentage >= 90) {
          warningLevel = 'severe';
          recommendedAction = 'Upgrade recommended within 48 hours';
          urgency = 'HIGH';
        }

        // Check if warning was sent recently (within 7 days)
        const lastWarning = sub.quota_warning_sent_at;
        if (lastWarning) {
          const daysSinceWarning = (Date.now() - new Date(lastWarning).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceWarning < 7) {
            continue; // Skip if warned recently
          }
        }

        // Fetch warning template
        const { data: template } = await supabase
          .from('email_templates')
          .select('*')
          .eq('template_name', 'quota_warning')
          .eq('tier', sub.tier || 'starter')
          .eq('is_active', true)
          .limit(1)
          .single();

        if (!template) {
          // Use default template
          const defaultSubject = `Email Quota Alert: ${usagePercentage.toFixed(0)}% Used`;
          const defaultHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: ${urgency === 'HIGH' ? '#C00' : '#f59e0b'};">
                ${urgency === 'HIGH' ? '🚨 URGENT' : '⚠️'} Email Quota Alert
              </h2>
              <p>Hi ${builder.name},</p>
              <p>Your email quota is at <strong>${usagePercentage.toFixed(1)}%</strong> usage.</p>
              <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p><strong>Current Usage:</strong> ${emailsSent.toLocaleString('en-IN')} of ${emailQuota.toLocaleString('en-IN')} emails</p>
                <p><strong>Remaining:</strong> ${remaining.toLocaleString('en-IN')} emails</p>
                <p><strong>Days Left in Month:</strong> ${daysLeft}</p>
                ${projectedOverage > 0 ? `<p style="color: #C00;"><strong>Projected Overage:</strong> ${projectedOverage.toLocaleString('en-IN')} emails</p>` : ''}
              </div>
              <p><strong>${recommendedAction}</strong></p>
              <a href="https://tharaga.co.in/builder/billing/upgrade?current=${sub.tier}&suggested=${sub.tier === 'starter' ? 'professional' : 'enterprise'}" 
                 style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #D4AF37; color: #000; text-decoration: none; border-radius: 8px;">
                Upgrade Plan Now
              </a>
            </div>
          `;

          // Send email
          if (resend) {
            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || 'Tharaga Billing <billing@tharaga.co.in>',
              to: builder.email,
              subject: urgency === 'HIGH' ? `🚨 ${defaultSubject}` : defaultSubject,
              html: defaultHtml,
              tags: [
                'type:quota_warning',
                `builder:${builder.id}`,
                `level:${warningLevel}`
              ]
            });
          }
        } else {
          // Use template
          let html = template.html_body;
          let subject = template.subject;

          const replacements: Record<string, string> = {
            '{{builderName}}': builder.name,
            '{{currentPlan}}': (sub.tier || 'starter').toUpperCase(),
            '{{emailsSent}}': emailsSent.toLocaleString('en-IN'),
            '{{emailQuota}}': emailQuota.toLocaleString('en-IN'),
            '{{usagePercentage}}': usagePercentage.toFixed(1),
            '{{remainingEmails}}': remaining.toLocaleString('en-IN'),
            '{{daysLeft}}': daysLeft.toString(),
            '{{projectedOverage}}': projectedOverage.toLocaleString('en-IN'),
            '{{recommendedAction}}': recommendedAction,
            '{{suggestedPlan}}': (sub.tier === 'starter' ? 'PROFESSIONAL' : 'ENTERPRISE'),
            '{{upgradeUrl}}': `https://tharaga.co.in/builder/billing/upgrade?current=${sub.tier}&suggested=${sub.tier === 'starter' ? 'professional' : 'enterprise'}`,
            '{{dashboardUrl}}': 'https://tharaga.co.in/builder/dashboard'
          };

          Object.entries(replacements).forEach(([key, value]) => {
            html = html.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
            subject = subject.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
          });

          if (urgency === 'HIGH') {
            html = `<div style="background: #FEE; border-left: 4px solid #C00; padding: 16px; margin-bottom: 24px;"><strong>⚠️ URGENT ACTION REQUIRED</strong></div>${html}`;
            subject = `🚨 ${subject}`;
          }

          if (resend) {
            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || 'Tharaga Billing <billing@tharaga.co.in>',
              to: builder.email,
              subject: subject,
              html: html,
              text: html.replace(/<[^>]*>/g, ''),
              tags: [
                'type:quota_warning',
                `builder:${builder.id}`,
                `level:${warningLevel}`
              ]
            });
          }
        }

        // Update warning timestamp
        await supabase
          .from('builder_subscriptions')
          .update({ quota_warning_sent_at: new Date().toISOString() })
          .eq('builder_id', builder.id);

        // Create alert record
        await supabase
          .from('builder_alerts')
          .insert({
            builder_id: builder.id,
            alert_type: usagePercentage >= 95 ? 'quota_critical' : 'quota_warning',
            severity: warningLevel,
            message: `Email quota at ${usagePercentage.toFixed(1)}%`,
            metadata: {
              emails_sent: emailsSent,
              quota: emailQuota,
              remaining: remaining,
              usage_percentage: usagePercentage
            }
          });

        results.push({
          builderId: builder.id,
          builderName: builder.name,
          warningLevel: warningLevel,
          usagePercentage: usagePercentage.toFixed(1)
        });

      } catch (error: any) {
        console.error(`[Quota Warning] Error for builder ${subscription.builder_id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      warned: results.length,
      results: results
    });

  } catch (error: any) {
    console.error('[Quota Warning] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}













