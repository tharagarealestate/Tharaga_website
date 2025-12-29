/**
 * Builder Performance Digest (Weekly Report)
 * Sends comprehensive email performance analytics to builders
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

    // Calculate weekly metrics per builder
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartISO = weekStart.toISOString();

    const { data: builders, error } = await supabase
      .from('builder_subscriptions')
      .select(`
        *,
        builder:builders(*)
      `)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to fetch builders: ${error.message}`);
    }

    if (!builders || builders.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No active builders found'
      });
    }

    const results = [];

    for (const subscription of builders) {
      try {
        const sub = subscription as any;
        const builder = sub.builder;
        
        if (!builder) continue;

        // Get weekly email metrics
        const { data: emailMetrics } = await supabase
          .from('email_delivery_logs')
          .select('*')
          .eq('builder_id', builder.id)
          .gte('sent_at', weekStartISO);

        const emailsSent = emailMetrics?.length || 0;
        const emailsDelivered = emailMetrics?.filter((e: any) => e.status === 'delivered').length || 0;
        const emailsOpened = emailMetrics?.filter((e: any) => e.opened_at).length || 0;
        const emailsClicked = emailMetrics?.filter((e: any) => e.clicked_at).length || 0;
        const emailsBounced = emailMetrics?.filter((e: any) => e.status === 'bounced').length || 0;

        const openRate = emailsDelivered > 0 ? (emailsOpened / emailsDelivered) * 100 : 0;
        const clickRate = emailsDelivered > 0 ? (emailsClicked / emailsDelivered) * 100 : 0;
        const bounceRate = emailsSent > 0 ? (emailsBounced / emailsSent) * 100 : 0;

        // Get lead metrics
        const { data: leads } = await supabase
          .from('leads')
          .select('*')
          .eq('builder_id', builder.id)
          .gte('created_at', weekStartISO);

        const newLeads = leads?.length || 0;
        const qualifiedLeads = leads?.filter((l: any) => l.status === 'qualified').length || 0;
        const convertedLeads = leads?.filter((l: any) => l.status === 'converted').length || 0;

        // Skip if no activity
        if (emailsSent === 0 && newLeads === 0) {
          continue;
        }

        // Generate HTML report
        const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #D4AF37, #4169E1); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .metric-card { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #D4AF37; }
    .metric-value { font-size: 32px; font-weight: bold; color: #D4AF37; }
    .trend-up { color: #28a745; }
    .trend-down { color: #dc3545; }
    .cta-button { display: inline-block; background: #D4AF37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Your Weekly Email Performance</h1>
      <p>${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    
    <h2>Hi ${builder.name},</h2>
    <p>Here's how your email campaigns performed last week:</p>
    
    <div class="metric-card">
      <h3>📧 Emails Sent</h3>
      <div class="metric-value">${emailsSent.toLocaleString('en-IN')}</div>
      <p>To ${new Set(emailMetrics?.map((e: any) => e.recipient_email)).size || 0} unique recipients</p>
    </div>
    
    <div class="metric-card">
      <h3>👀 Open Rate</h3>
      <div class="metric-value">${openRate.toFixed(1)}%</div>
      <p>${emailsOpened} opens from ${emailsDelivered} delivered emails</p>
    </div>
    
    <div class="metric-card">
      <h3>🖱️ Click Rate</h3>
      <div class="metric-value">${clickRate.toFixed(1)}%</div>
      <p>${emailsClicked} clicks from ${emailsDelivered} delivered emails</p>
    </div>
    
    <div class="metric-card">
      <h3>🎯 Lead Conversions</h3>
      <div class="metric-value">${convertedLeads}</div>
      <p>From ${newLeads} new leads this week</p>
    </div>
    
    ${bounceRate > 5 ? `
    <div class="metric-card" style="border-left-color: #dc3545;">
      <h3>⚠️ Bounce Rate</h3>
      <div class="metric-value" style="color: #dc3545;">${bounceRate.toFixed(1)}%</div>
      <p>Consider cleaning your email list</p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://tharaga.co.in/builder/analytics" class="cta-button">View Full Analytics Dashboard</a>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
      <p>Tharaga - India's First Zero-Commission Real Estate Platform</p>
      <p>Questions? Reply to this email or visit our <a href="https://tharaga.co.in/help">Help Center</a></p>
    </div>
  </div>
</body>
</html>
        `;

        // Send email
        if (resend) {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Tharaga Analytics <analytics@tharaga.co.in>',
            to: builder.email,
            subject: `📊 Your Weekly Performance: ${openRate.toFixed(1)}% open rate, ${convertedLeads} conversions`,
            html: html,
            text: html.replace(/<[^>]*>/g, ''),
            tags: [
              'type:weekly_digest',
              `builder:${builder.id}`,
              'automated:true'
            ]
          });

          // Log digest send
          await supabase
            .from('email_delivery_logs')
            .insert({
              builder_id: builder.id,
              recipient_email: builder.email,
              subject: `📊 Your Weekly Performance: ${openRate.toFixed(1)}% open rate, ${convertedLeads} conversions`,
              status: 'sent',
              sent_at: new Date().toISOString(),
              metadata: {
                type: 'weekly_digest',
                emails_sent: emailsSent,
                open_rate: openRate,
                click_rate: clickRate,
                converted_leads: convertedLeads
              }
            });
        }

        results.push({
          builderId: builder.id,
          builderName: builder.name,
          emailsSent: emailsSent,
          openRate: openRate.toFixed(1)
        });

      } catch (error: any) {
        console.error(`[Weekly Digest] Error for builder ${subscription.builder_id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      results: results
    });

  } catch (error: any) {
    console.error('[Weekly Digest] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}













