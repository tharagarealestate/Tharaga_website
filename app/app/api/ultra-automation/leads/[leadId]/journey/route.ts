/**
 * Ultra Automation - Lead Buyer Journey API
 * GET /api/ultra-automation/leads/[leadId]/journey
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId } = params;

    // Find buyer journey for this lead
    const { data: journey, error: journeyError } = await supabase
      .from('buyer_journey')
      .select(`
        *,
        lead:generated_leads(*),
        property:properties(*)
      `)
      .eq('lead_id', leadId)
      .single();

    if (journeyError || !journey) {
      // Journey might not exist yet - return empty structure
      return NextResponse.json({
        success: true,
        data: {
          journey: null,
          emailExecutions: [],
          suggestions: [],
          viewings: [],
          negotiations: [],
          contracts: [],
        },
      });
    }

    // Fetch all related Ultra Automation data
    const [emailExecutions, suggestions, viewings, negotiations, contracts] = await Promise.all([
      // Email sequence executions
      supabase
        .from('email_sequence_executions')
        .select(`*, sequence:email_sequences(*)`)
        .eq('journey_id', journey.id)
        .order('scheduled_at', { ascending: true }),
      
      // Communication suggestions
      supabase
        .from('communication_suggestions')
        .select('*')
        .eq('journey_id', journey.id)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Property viewings
      supabase
        .from('property_viewings')
        .select(`*, reminders:viewing_reminders(*)`)
        .eq('journey_id', journey.id)
        .order('scheduled_at', { ascending: true }),
      
      // Negotiations
      supabase
        .from('negotiations')
        .select(`*, insights:price_strategy_insights(*)`)
        .eq('journey_id', journey.id)
        .order('created_at', { ascending: false }),
      
      // Contracts
      supabase
        .from('contracts')
        .select('*')
        .eq('journey_id', journey.id)
        .order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        journey,
        emailExecutions: emailExecutions.data || [],
        suggestions: suggestions.data || [],
        viewings: viewings.data || [],
        negotiations: negotiations.data || [],
        contracts: contracts.data || [],
      },
    });

  } catch (error) {
    console.error('[Ultra Automation] Lead Journey API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

