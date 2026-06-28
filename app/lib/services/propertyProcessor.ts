/**
 * Property Processing Service
 * Handles automated processing of uploaded properties
 */

import { getSupabase } from '../supabase';
import { generateLeads, GeneratedLead } from './leadGeneration';
import { getEmailTemplate, sendBuilderEmail, EmailData } from './emailService';
import { sendBuilderSMS, getBuilderPhone } from './smsService';

export interface ProcessingResult {
  success: boolean;
  propertyId: string;
  leadsGenerated: number;
  emailSent: boolean;
  smsSent: boolean;
  error?: string;
}

/**
 * Process property: Generate leads and notify builder
 */
export async function processProperty(
  propertyId: string,
  builderId: string
): Promise<ProcessingResult> {
  const supabase = getSupabase();

  try {
    // 1. Get property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      throw new Error(`Property not found: ${propertyError?.message || 'Unknown error'}`);
    }

    // 2. Get builder subscription
    const { data: subscription, error: subError } = await supabase
      .from('builder_subscriptions')
      .select('*')
      .eq('builder_id', builderId)
      .single();

    if (subError || !subscription) {
      throw new Error(`Subscription not found: ${subError?.message || 'Unknown error'}`);
    }

    // 3. Update property status to processing
    await supabase
      .from('properties')
      .update({ 
        processing_status: 'processing',
        processing_metadata: { started_at: new Date().toISOString() }
      })
      .eq('id', propertyId);

    // 4. Generate leads
    const leads = await generateLeads(property, {
      tier: subscription.tier as any,
      leads_per_property: subscription.leads_per_property || 50
    });

    // 5. Save leads to database
    const leadsToInsert = leads.map(lead => ({
      property_id: propertyId,
      builder_id: builderId,
      lead_buyer_name: lead.name,
      lead_buyer_email: lead.email,
      lead_buyer_phone: lead.phone,
      lead_quality_score: lead.score,
      interest_level: lead.interest_level,
      estimated_budget: lead.estimated_budget,
      timeline: lead.timeline,
      preferred_location: lead.preferred_location || null,
      property_type_preference: lead.property_type_preference || null,
      metadata: {
        generated_at: new Date().toISOString(),
        source: 'ai_generation'
      }
    }));

    const { error: leadsError } = await supabase
      .from('generated_leads')
      .insert(leadsToInsert);

    if (leadsError) {
      throw new Error(`Failed to save leads: ${leadsError.message}`);
    }

    // 6. Get builder details
    const { data: builder } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', builderId)
      .single();

    // Try to get email from builders table if not in profiles
    let builderEmail = builder?.email;
    if (!builderEmail) {
      const { data: builderData } = await supabase
        .from('builders')
        .select('email')
        .eq('id', builderId)
        .single();
      
      builderEmail = builderData?.email || '';
    }

    // Get builder name
    let builderName = builder?.full_name;
    if (!builderName) {
      const { data: builderData } = await supabase
        .from('builders')
        .select('name, company_name')
        .eq('id', builderId)
        .single();
      
      builderName = builderData?.name || builderData?.company_name || 'Builder';
    }

    // 7. Calculate lead statistics
    const qualityLeads = leads.filter(l => l.score >= 70).length;
    const highQualityLeads = leads.filter(l => l.score >= 80).length;
    const mediumQualityLeads = leads.filter(l => l.score >= 50 && l.score < 80).length;

    // 8. Get email template and send email
    const template = await getEmailTemplate(subscription.tier);
    let emailSent = false;

    if (template && builderEmail) {
      const emailData: EmailData = {
        propertyId,
        builderId,
        builderName,
        builderEmail,
        propertyName: property.property_name || property.title || 'Property',
        leadCount: leads.length,
        qualityLeads,
        highQualityLeads,
        mediumQualityLeads,
        leads: leads.map(l => ({
          name: l.name,
          email: l.email,
          phone: l.phone,
          timeline: l.timeline,
          score: l.score
        }))
      };

      const emailResult = await sendBuilderEmail(emailData, template);
      emailSent = emailResult.success;

      if (!emailResult.success) {
        console.error('[Property Processor] Email failed:', emailResult.error);
      }
    }

    // 9. Send SMS if enabled
    let smsSent = false;
    if (subscription.sms_enabled) {
      const builderPhone = await getBuilderPhone(builderId);
      if (builderPhone) {
        const smsResult = await sendBuilderSMS({
          propertyId,
          builderId,
          builderPhone,
          propertyName: property.property_name || property.title || 'Property',
          leadCount: leads.length
        });
        smsSent = smsResult.success;

        if (!smsResult.success) {
          console.error('[Property Processor] SMS failed:', smsResult.error);
        }
      }
    }

    // 10. Update property status to completed
    await supabase
      .from('properties')
      .update({ 
        processing_status: 'completed',
        processing_metadata: {
          completed_at: new Date().toISOString(),
          leads_generated: leads.length,
          email_sent: emailSent,
          sms_sent: smsSent
        }
      })
      .eq('id', propertyId);

    // 11. Update generated leads with notification timestamps
    if (emailSent) {
      await supabase
        .from('generated_leads')
        .update({ builder_notified_at: new Date().toISOString() })
        .eq('property_id', propertyId)
        .eq('builder_id', builderId);
    }

    return {
      success: true,
      propertyId,
      leadsGenerated: leads.length,
      emailSent,
      smsSent
    };

  } catch (error) {
    console.error('[Property Processor] Error processing property:', error);

    // Update property status to failed
    await supabase
      .from('properties')
      .update({ 
        processing_status: 'failed',
        processing_metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          failed_at: new Date().toISOString()
        }
      })
      .eq('id', propertyId);

    return {
      success: false,
      propertyId,
      leadsGenerated: 0,
      emailSent: false,
      smsSent: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create processing job in database
 */
export async function createProcessingJob(
  propertyId: string,
  builderId: string
): Promise<string> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('processing_jobs')
    .insert([{
      property_id: propertyId,
      builder_id: builderId,
      status: 'pending',
      job_type: 'lead_generation'
    }])
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create job: ${error?.message || 'Unknown error'}`);
  }

  return data.id;
}

/**
 * Update processing job status
 */
export async function updateProcessingJob(
  jobId: string,
  status: 'processing' | 'completed' | 'failed',
  resultData?: any,
  error?: string
): Promise<void> {
  const supabase = getSupabase();

  // Get current attempts count
  const { data: currentJob } = await supabase
    .from('processing_jobs')
    .select('attempts')
    .eq('id', jobId)
    .single();

  const updateData: any = {
    status,
    attempts: (currentJob?.attempts || 0) + 1
  };

  if (status === 'processing') {
    updateData.started_at = new Date().toISOString();
  } else if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
    updateData.result_data = resultData || {};
  } else if (status === 'failed') {
    updateData.error_message = error;
    updateData.completed_at = new Date().toISOString();
  }

  await supabase
    .from('processing_jobs')
    .update(updateData)
    .eq('id', jobId);
}

