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
      builderName: 'Builder' // Get from profiles
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

  // TODO: Save contract HTML to storage and get URL
  // For now, contract is stored in contract_data

  return {
    contractId: contract.id,
    contractNumber,
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

  // TODO: Send contract via email with digital signature link
  // For now, just update status
  console.log(`[Layer 6] Contract ${contract.contract_number} sent to ${contract.buyer_email}`);
}

