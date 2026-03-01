/**
 * LAYER 6: CONTRACT AUTOMATION
 * Auto-generate contracts and manage digital signatures
 */

import { getSupabase } from '@/lib/supabase';

export interface ContractData {
  contractId: string;
  contractNumber: string;
  contractUrl?: string;
  status: 'draft' | 'sent' | 'signed_buyer' | 'signed_builder' | 'executed';
}

/**
 * Generate contract for deal
 */
export async function generateContract(
  journeyId: string,
  propertyId: string,
  leadId: string,
  builderId: string,
  contractPrice: number,
  paymentTerms?: any
): Promise<ContractData> {
  const supabase = getSupabase();

  // Get all details
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  const { data: lead } = await supabase
    .from('generated_leads')
    .select('*')
    .eq('id', leadId)
    .single();

  const { data: negotiation } = await supabase
    .from('negotiations')
    .select('*')
    .eq('journey_id', journeyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!property || !lead) {
    throw new Error('Property or lead not found');
  }

  // Generate contract number
  const contractNumber = `THG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // Get contract template
  const { data: template } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('contract_type', 'sale')
    .eq('is_active', true)
    .eq('builder_id', builderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Build contract HTML
  const contractHtml = buildContractHTML(
    template?.template_html || getDefaultContractTemplate(),
    {
      contractNumber,
      buyerName: lead.lead_buyer_name,
      buyerEmail: lead.lead_buyer_email,
      buyerPhone: lead.lead_buyer_phone,
      propertyName: property.property_name || property.title,
      propertyLocation: `${property.locality || ''}, ${property.city || ''}`,
      propertyType: property.property_type,
      contractPrice,
      paymentTerms: paymentTerms || getDefaultPaymentTerms(contractPrice),
      possessionDate: calculatePossessionDate(),
      builderName: await getBuilderName(builderId) || 'Builder'
    }
  );

  // Create contract record
  const { data: contract, error } = await supabase
    .from('contracts')
    .insert([{
      journey_id: journeyId,
      property_id: propertyId,
      lead_id: leadId,
      builder_id: builderId,
      contract_type: 'sale',
      contract_number: contractNumber,
      buyer_name: lead.lead_buyer_name,
      buyer_email: lead.lead_buyer_email,
      buyer_phone: lead.lead_buyer_phone,
      property_details: {
        name: property.property_name || property.title,
        location: `${property.locality || ''}, ${property.city || ''}`,
        type: property.property_type,
        price: contractPrice
      },
      contract_price: contractPrice,
      payment_terms: paymentTerms || getDefaultPaymentTerms(contractPrice),
      payment_schedule: generatePaymentSchedule(contractPrice),
      possession_date: calculatePossessionDate(),
      status: 'draft',
      contract_data: { html: contractHtml }
    }])
    .select('id')
    .single();

  if (error || !contract) {
    throw new Error(`Failed to create contract: ${error?.message}`);
  }

  // Save contract HTML to Supabase Storage and get URL
  let contractUrl: string | undefined;
  try {
    const contractFileName = `contracts/${contract.id}/${contractNumber}.html`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(contractFileName, contractHtml, {
        contentType: 'text/html',
        upsert: false,
      });

    if (!uploadError && uploadData) {
      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('contracts')
        .getPublicUrl(contractFileName);

      if (urlData?.publicUrl) {
        contractUrl = urlData.publicUrl;
        
        // Update contract with URL
        await supabase
          .from('contracts')
          .update({ contract_url: contractUrl })
          .eq('id', contract.id);
      }
    }
  } catch (error) {
    console.error('[Layer 6] Error saving contract to storage:', error);
    // Continue without storage URL - contract is still in contract_data
  }

  return {
    contractId: contract.id,
    contractNumber,
    contractUrl,
    status: 'draft'
  };
}

function buildContractHTML(template: string, data: any): string {
  return template
    .replace(/\{\{contractNumber\}\}/g, data.contractNumber)
    .replace(/\{\{buyerName\}\}/g, data.buyerName)
    .replace(/\{\{buyerEmail\}\}/g, data.buyerEmail)
    .replace(/\{\{buyerPhone\}\}/g, data.buyerPhone)
    .replace(/\{\{propertyName\}\}/g, data.propertyName)
    .replace(/\{\{propertyLocation\}\}/g, data.propertyLocation)
    .replace(/\{\{propertyType\}\}/g, data.propertyType)
    .replace(/\{\{contractPrice\}\}/g, `₹${data.contractPrice.toLocaleString('en-IN')}`)
    .replace(/\{\{possessionDate\}\}/g, data.possessionDate.toLocaleDateString('en-IN'));
}

function getDefaultContractTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Property Sale Agreement - {{contractNumber}}</title>
</head>
<body>
  <h1>PROPERTY SALE AGREEMENT</h1>
  <p>Contract Number: {{contractNumber}}</p>
  
  <h2>PARTIES</h2>
  <p><strong>Buyer:</strong> {{buyerName}}<br>
  Email: {{buyerEmail}}<br>
  Phone: {{buyerPhone}}</p>
  
  <h2>PROPERTY DETAILS</h2>
  <p>Property: {{propertyName}}<br>
  Location: {{propertyLocation}}<br>
  Type: {{propertyType}}</p>
  
  <h2>FINANCIAL TERMS</h2>
  <p>Contract Price: {{contractPrice}}</p>
  
  <h2>POSSESSION</h2>
  <p>Possession Date: {{possessionDate}}</p>
  
  <p>This agreement is subject to terms and conditions as detailed in the full contract document.</p>
</body>
</html>
  `.trim();
}

function getDefaultPaymentTerms(price: number): any {
  return {
    booking_amount: price * 0.1, // 10%
    construction_milestones: [
      { milestone: 'Foundation', percentage: 20 },
      { milestone: 'Superstructure', percentage: 30 },
      { milestone: 'Finishing', percentage: 30 },
      { milestone: 'Possession', percentage: 10 }
    ]
  };
}

function generatePaymentSchedule(price: number): any[] {
  const terms = getDefaultPaymentTerms(price);
  const schedule = [];

  // Booking
  schedule.push({
    milestone: 'Booking',
    amount: terms.booking_amount,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Construction milestones
  terms.construction_milestones.forEach((milestone: any, index: number) => {
    schedule.push({
      milestone: milestone.milestone,
      amount: price * (milestone.percentage / 100),
      due_date: new Date(Date.now() + (index + 1) * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  });

  return schedule;
}

function calculatePossessionDate(): Date {
  // Default: 12 months from now
  const date = new Date();
  date.setMonth(date.getMonth() + 12);
  return date;
}

/**
 * Get builder name from profiles
 */
async function getBuilderName(builderId: string): Promise<string | null> {
  try {
    const { getBuilderInfo } = await import('./helpers');
    const builderInfo = await getBuilderInfo(builderId);
    return builderInfo?.name || builderInfo?.companyName || null;
  } catch (error) {
    console.error('[Layer 6] Error fetching builder name:', error);
    return null;
  }
}

/**
 * Send contract for signature
 */
export async function sendContractForSignature(contractId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single();

  if (!contract) {
    throw new Error('Contract not found');
  }

  // Update status
  await supabase
    .from('contracts')
    .update({ status: 'sent' })
    .eq('id', contractId);

  // Send contract via email with digital signature link
  try {
    const { resendClient } = await import('@/lib/integrations/email/resendClient');
    
    const contractUrl = contract.contract_url || 
      (contract.contract_data as any)?.url || 
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in'}/contracts/${contract.id}`;
    
    const signatureUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in'}/contracts/${contract.id}/sign`;
    
    const emailSubject = `Property Sale Agreement - ${contract.contract_number}`;
    const emailHtml = `
      <h2>Property Sale Agreement</h2>
      <p>Dear ${contract.buyer_name},</p>
      <p>Please find attached your Property Sale Agreement for <strong>${(contract.property_details as any)?.name || 'Property'}</strong>.</p>
      <p><strong>Contract Number:</strong> ${contract.contract_number}</p>
      <p><strong>Contract Price:</strong> ₹${contract.contract_price?.toLocaleString('en-IN')}</p>
      <p><strong>Property Location:</strong> ${(contract.property_details as any)?.location || 'N/A'}</p>
      <p>Please review the contract and sign it digitally using the link below:</p>
      <p><a href="${signatureUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Sign Contract</a></p>
      <p>You can also view the contract here: <a href="${contractUrl}">View Contract</a></p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>Tharaga Team</p>
    `;
    
    const result = await resendClient.sendEmail({
      to: contract.buyer_email,
      subject: emailSubject,
      html: emailHtml,
    });
    
    if (result.success) {
      // Update contract with email sent status
      await supabase
        .from('contracts')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          email_message_id: result.message_id
        })
        .eq('id', contractId);
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
    
  } catch (error) {
    console.error(`[Layer 6] Error sending contract ${contract.contract_number}:`, error);
    // Update status to indicate error
    await supabase
      .from('contracts')
      .update({ 
        status: 'draft',
        error_message: error instanceof Error ? error.message : 'Failed to send contract'
      })
      .eq('id', contractId);
    throw error;
  }
}

