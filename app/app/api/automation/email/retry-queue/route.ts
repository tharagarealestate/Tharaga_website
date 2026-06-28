/**
 * Error Recovery & Retry Queue Processor
 * Automatically retry failed emails with exponential backoff
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

    // Fetch failed emails for retry (exponential backoff: 5 min, 15 min, 60 min)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const sixtyMinutesAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const { data: retryCandidates, error } = await supabase
      .from('email_delivery_logs')
      .select(`
        *,
        template:email_templates(*)
      `)
      .eq('status', 'failed')
      .lt('retry_count', 3)
      .not('failed_at', 'is', null)
      .or(`and(retry_count.eq.0,failed_at.lte.${fiveMinutesAgo.toISOString()}),and(retry_count.eq.1,failed_at.lte.${fifteenMinutesAgo.toISOString()}),and(retry_count.eq.2,failed_at.lte.${sixtyMinutesAgo.toISOString()})`)
      .order('retry_count', { ascending: true })
      .order('failed_at', { ascending: true })
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch retry candidates: ${error.message}`);
    }

    if (!retryCandidates || retryCandidates.length === 0) {
      return NextResponse.json({
        success: true,
        retried: 0,
        message: 'No emails ready for retry'
      });
    }

    const results = [];

    for (const email of retryCandidates) {
      try {
        const emailData = email as any;

        // Analyze failure reason
        const failureReason = emailData.provider_response?.error || 'Unknown error';
        let retryable = true;
        let modification = null;

        // Determine if error is retryable
        if (failureReason.includes('recipient address rejected') || 
            failureReason.includes('invalid email')) {
          retryable = false; // Permanent failure
        } else if (failureReason.includes('rate limit')) {
          modification = 'delay';
        } else if (failureReason.includes('timeout')) {
          modification = 'reduce_size';
        } else if (failureReason.includes('spam')) {
          modification = 'reword';
        }

        if (!retryable) {
          // Mark as permanent failure
          await supabase
            .from('email_delivery_logs')
            .update({
              status: 'permanent_failure',
              provider_response: {
                ...emailData.provider_response,
                retry_result: 'not_retryable'
              }
            })
            .eq('id', emailData.id);
          continue;
        }

        if (modification === 'delay') {
          // Add to rate-limited queue (delay 30 minutes)
          await supabase
            .from('email_delivery_logs')
            .update({
              retry_scheduled_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            })
            .eq('id', emailData.id);
          continue;
        }

        // Prepare email content
        let html = emailData.template?.html_body || '';
        let text = emailData.template?.text_body || html.replace(/<[^>]*>/g, '');

        // Apply modifications
        if (modification === 'reduce_size') {
          // Remove images, simplify HTML
          html = html.replace(/<img[^>]*>/g, '');
          html = html.replace(/<style[^>]*>.*?<\/style>/gs, '');
        }

        // Send retry
        if (!resend) {
          throw new Error('Resend API key not configured');
        }

        const sendResult = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Tharaga <noreply@tharaga.co.in>',
          to: emailData.recipient_email,
          subject: emailData.subject,
          html: html,
          text: text,
          tags: [
            'retry:true',
            `attempt:${emailData.retry_count + 1}`,
            `original_id:${emailData.id}`
          ]
        });

        if (sendResult.error) {
          throw new Error(sendResult.error.message || 'Failed to send email');
        }

        // Update status
        await supabase
          .from('email_delivery_logs')
          .update({
            status: 'sent',
            retry_count: emailData.retry_count + 1,
            provider_message_id: sendResult.data?.id,
            sent_at: new Date().toISOString(),
            provider_response: {
              ...emailData.provider_response,
              retry_attempt: emailData.retry_count + 1,
              retry_at: new Date().toISOString(),
              retry_success: true
            }
          })
          .eq('id', emailData.id);

        results.push({
          id: emailData.id,
          status: 'retried',
          messageId: sendResult.data?.id,
          attempt: emailData.retry_count + 1
        });

      } catch (error: any) {
        console.error(`[Retry Queue] Error retrying email ${email.id}:`, error);

        // Update retry count
        await supabase
          .from('email_delivery_logs')
          .update({
            retry_count: (email as any).retry_count + 1,
            status: (email as any).retry_count >= 2 ? 'permanent_failure' : 'failed',
            provider_response: {
              ...(email as any).provider_response,
              retry_attempt: (email as any).retry_count + 1,
              retry_at: new Date().toISOString(),
              retry_success: false,
              retry_error: error.message
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
      retried: results.filter(r => r.status === 'retried').length,
      failed: results.filter(r => r.status === 'failed').length,
      results: results
    });

  } catch (error: any) {
    console.error('[Retry Queue] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}





































































