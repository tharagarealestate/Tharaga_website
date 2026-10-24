import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { buyer_id, property_id, buyer_type, readiness_data } = await request.json();

    if (!buyer_id || !property_id || !buyer_type || !readiness_data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch buyer profile and contact details
    const { data: buyer, error: buyerError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', buyer_id)
      .single();

    if (buyerError || !buyer) {
      return NextResponse.json(
        { error: 'Buyer not found', details: buyerError?.message },
        { status: 404 }
      );
    }

    // Get property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*, builders(*)')
      .eq('id', property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found', details: propertyError?.message },
        { status: 404 }
      );
    }

    const readinessScore = readiness_data.readiness_score || 0;
    const urgencyLevel = readiness_data.urgency_level || 'LOW';

    // WORKFLOW SELECTION BASED ON BUYER TYPE + READINESS
    if (readinessScore >= 8) {
      // CRITICAL URGENCY - Immediate action required
      await executeHighUrgencyWorkflow(supabase, buyer, property, buyer_type, readinessScore);
    } else if (readinessScore >= 4) {
      // MEDIUM-HIGH URGENCY - Personalized nurture
      await executeMediumUrgencyWorkflow(supabase, buyer, property, buyer_type, readinessScore);
    } else {
      // LOW URGENCY - Standard nurture sequence
      await executeLowUrgencyWorkflow(supabase, buyer, property, buyer_type, readinessScore);
    }

    return NextResponse.json({
      success: true,
      workflow_triggered: true,
      urgency_level: urgencyLevel,
      readiness_score: readinessScore,
    });
  } catch (error: any) {
    console.error('Error triggering workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function executeHighUrgencyWorkflow(
  supabase: any,
  buyer: any,
  property: any,
  buyerType: string,
  readinessScore: number
) {
  // Generate personalized message
  const messageContent = await generatePersonalizedMessage(buyer, property, buyerType, 'HIGH_URGENCY');

  // Log automation execution
  await supabase.from('readiness_signal_triggers').update({
    automated_action_triggered: true,
    action_type: 'send_whatsapp',
    action_details: {
      message: messageContent.whatsapp,
      urgency: 'CRITICAL',
    },
    action_result: 'pending',
  }).eq('buyer_id', buyer.id).eq('property_id', property.id);

  // In production, this would trigger actual WhatsApp/Email/SMS sending
  // For now, we just log the action
  console.log('HIGH URGENCY WORKFLOW TRIGGERED:', {
    buyer_id: buyer.id,
    property_id: property.id,
    buyer_type: buyerType,
    readiness_score: readinessScore,
    message: messageContent.whatsapp,
  });
}

async function executeMediumUrgencyWorkflow(
  supabase: any,
  buyer: any,
  property: any,
  buyerType: string,
  readinessScore: number
) {
  const messageContent = await generatePersonalizedMessage(buyer, property, buyerType, 'MEDIUM');

  await supabase.from('readiness_signal_triggers').update({
    automated_action_triggered: true,
    action_type: 'send_email',
    action_details: {
      message: messageContent.email,
      urgency: 'MEDIUM',
    },
    action_result: 'pending',
  }).eq('buyer_id', buyer.id).eq('property_id', property.id);

  console.log('MEDIUM URGENCY WORKFLOW TRIGGERED:', {
    buyer_id: buyer.id,
    property_id: property.id,
    buyer_type: buyerType,
    readiness_score: readinessScore,
  });
}

async function executeLowUrgencyWorkflow(
  supabase: any,
  buyer: any,
  property: any,
  buyerType: string,
  readinessScore: number
) {
  const messageContent = await generatePersonalizedMessage(buyer, property, buyerType, 'LOW');

  await supabase.from('readiness_signal_triggers').update({
    automated_action_triggered: true,
    action_type: 'send_email',
    action_details: {
      message: messageContent.email,
      urgency: 'LOW',
    },
    action_result: 'pending',
  }).eq('buyer_id', buyer.id).eq('property_id', property.id);

  console.log('LOW URGENCY WORKFLOW TRIGGERED:', {
    buyer_id: buyer.id,
    property_id: property.id,
    buyer_type: buyerType,
    readiness_score: readinessScore,
  });
}

async function generatePersonalizedMessage(
  buyer: any,
  property: any,
  buyerType: string,
  urgency: string
): Promise<{ whatsapp: string; email: string; sms: string }> {
  let baseMessage = '';

  switch (buyerType) {
    case 'MONKEY':
      baseMessage = `⚠️ ONLY 2 UNITS LEFT in ${property.title || property.name}! 🏆 Premium lifestyle awaits`;
      break;
    case 'LION':
      baseMessage = `📊 ${property.title || property.name} showing strong ROI potential! Price per sq.ft analysis available`;
      break;
    case 'DOG':
      baseMessage = `🏡 ${property.title || property.name} - Where families thrive! Top-rated schools nearby, vibrant community`;
      break;
    default:
      baseMessage = `🏠 ${property.title || property.name} - Perfect match for you!`;
  }

  if (urgency === 'HIGH_URGENCY') {
    baseMessage += `\n\n🔥 You viewed this property multiple times - shall we schedule a visit today? Reply YES to book your exclusive tour!`;
  }

  return {
    whatsapp: baseMessage,
    email: baseMessage,
    sms: baseMessage.substring(0, 160), // SMS character limit
  };
}

