// =============================================
// SMARTSCORE 2.0 API
// GET /api/leads/[leadId]/smartscore - Get SmartScore 2.0 data
// POST /api/leads/[leadId]/smartscore/calculate - Recalculate SmartScore
// =============================================
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET endpoint - Fetch SmartScore 2.0 data
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const leadId = parseInt(params.leadId, 10);
    if (isNaN(leadId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid lead ID' },
        { status: 400 }
      );
    }
    
    // Get lead with SmartScore 2.0 data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        buyer:profiles!buyer_id(id, email, phone, full_name)
      `)
      .eq('id', leadId)
      .single();
    
    if (leadError || !lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    // Verify builder owns this lead
    if (lead.builder_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // If SmartScore 2.0 not calculated yet, calculate it
    if (!lead.smartscore_v2 || lead.smartscore_v2 === 0) {
      // Trigger calculation using helper function
      const { error: updateError } = await supabase.rpc('update_lead_smartscore_v2', {
        p_lead_id: leadId
      });
      
      if (updateError) {
        console.error('SmartScore calculation error:', updateError);
      }
      
      // Fetch updated lead
      const { data: updatedLead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (updatedLead) {
        return NextResponse.json({
          success: true,
          data: {
            smartscore_v2: updatedLead.smartscore_v2 || 0,
            conversion_probability: updatedLead.conversion_probability || 0,
            predicted_ltv: updatedLead.predicted_ltv || 0,
            priority_tier: updatedLead.priority_tier || 'standard',
            next_best_action: updatedLead.next_best_action,
            optimal_contact_time: updatedLead.optimal_contact_time,
            ai_insights: updatedLead.ai_insights || {}
          }
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        smartscore_v2: lead.smartscore_v2 || 0,
        conversion_probability: lead.conversion_probability || 0,
        predicted_ltv: lead.predicted_ltv || 0,
        priority_tier: lead.priority_tier || 'standard',
        next_best_action: lead.next_best_action,
        optimal_contact_time: lead.optimal_contact_time,
        ai_insights: lead.ai_insights || {}
      }
    });
    
  } catch (error) {
    console.error('Get SmartScore error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SmartScore' },
      { status: 500 }
    );
  }
}

// POST endpoint - Recalculate SmartScore
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const leadId = parseInt(params.leadId, 10);
    if (isNaN(leadId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid lead ID' },
        { status: 400 }
      );
    }
    
    // Verify lead exists and builder owns it
    const { data: lead } = await supabase
      .from('leads')
      .select('builder_id')
      .eq('id', leadId)
      .single();
    
    if (!lead || lead.builder_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Lead not found or access denied' },
        { status: 403 }
      );
    }
    
    // Calculate SmartScore 2.0 using helper function
    const { error: updateError } = await supabase.rpc('update_lead_smartscore_v2', {
      p_lead_id: leadId
    });
    
    if (updateError) {
      console.error('SmartScore calculation error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to calculate SmartScore', details: updateError.message },
        { status: 500 }
      );
    }
    
    // Fetch updated lead
    const { data: updatedLead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();
    
    if (fetchError || !updatedLead) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch updated lead' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        smartscore_v2: updatedLead.smartscore_v2 || 0,
        conversion_probability: updatedLead.conversion_probability || 0,
        predicted_ltv: updatedLead.predicted_ltv || 0,
        priority_tier: updatedLead.priority_tier || 'standard',
        next_best_action: updatedLead.next_best_action,
        optimal_contact_time: updatedLead.optimal_contact_time,
        ai_insights: updatedLead.ai_insights || {}
      },
      message: 'SmartScore 2.0 calculated successfully'
    });
    
  } catch (error) {
    console.error('Calculate SmartScore error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

