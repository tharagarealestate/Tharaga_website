/**
 * New Lead Instant Notification API
 * Triggered by n8n when a new lead is inserted
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendBuilderEmail, getEmailTemplate, buildEmailHTML, buildEmailText } from '@/lib/services/emailService';
import type { EmailData } from '@/lib/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, builderId, propertyId } = body;

    if (!leadId || !builderId || !propertyId) {
      return NextResponse.json(
        { error: 'Missing required fields: leadId, builderId, propertyId' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Fetch complete lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        property:properties(*),
        builder:builders(*)
      `)
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const property = (lead as any).property;
    const builder = (lead as any).builder;

    if (!property || !builder) {
      return NextResponse.json(
        { error: 'Property or builder not found' },
        { status: 404 }
      );
    }

    // Check builder subscription status
    const { data: subscription } = await supabase
      .from('builder_subscriptions')
      .select('*')
      .eq('builder_id', builderId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Builder subscription inactive', skipped: true },
        { status: 200 }
      );
    }

    // Check email quota
    const monthlyLimit = subscription.email_quota || 1000;
    const usedEmails = subscription.emails_sent_this_month || 0;

    if (usedEmails >= monthlyLimit) {
      // Trigger quota warning (async)
      console.warn(`Email quota exceeded for builder ${builderId}`);
      return NextResponse.json(
        { error: 'Email quota exceeded', quotaExceeded: true },
        { status: 200 }
      );
    }

    // Calculate lead score and urgency
    const leadScore = (lead as any).ai_lead_score || 0;
    const urgency = leadScore > 80 ? 'HIGH' : leadScore > 60 ? 'MEDIUM' : 'LOW';

    // Fetch email template by tier
    const template = await getEmailTemplate(subscription.tier || 'starter');
    
    if (!template) {
      // Fallback to default template
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 500 }
      );
    }

    // Prepare email data
    const emailData: EmailData = {
      propertyId: propertyId,
      builderId: builderId,
      builderName: builder.name || 'Builder',
      builderEmail: builder.email,
      propertyName: property.title || property.property_name || 'Property',
      leadCount: 1,
      qualityLeads: leadScore > 70 ? 1 : 0,
      highQualityLeads: leadScore > 80 ? 1 : 0,
      mediumQualityLeads: leadScore > 60 && leadScore <= 80 ? 1 : 0,
      leads: [{
        name: (lead as any).name || (lead as any).lead_buyer_name || 'Lead',
        email: (lead as any).email || (lead as any).lead_buyer_email || '',
        phone: (lead as any).phone || (lead as any).lead_buyer_phone || '',
        timeline: (lead as any).timeline || 'Not specified',
        score: leadScore
      }]
    };

    // Personalize subject with urgency indicator
    let subject = template.subject
      .replace(/\{\{propertyName\}\}/g, emailData.propertyName)
      .replace(/\{\{leadCount\}\}/g, '1');

    if (urgency === 'HIGH') {
      subject = `🔥 ${subject}`;
    }

    // Build and send email
    const result = await sendBuilderEmail(emailData, {
      ...template,
      subject: subject
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Update builder email quota
    await supabase
      .from('builder_subscriptions')
      .update({ emails_sent_this_month: usedEmails + 1 })
      .eq('builder_id', builderId);

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      urgency: urgency,
      leadScore: leadScore
    });

  } catch (error: any) {
    console.error('[New Lead Notification] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


























































