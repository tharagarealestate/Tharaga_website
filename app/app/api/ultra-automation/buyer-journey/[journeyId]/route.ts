/**
 * Ultra Automation - Buyer Journey API
 * GET /api/ultra-automation/buyer-journey/[journeyId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { journeyId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { journeyId } = params;

    // Fetch journey with related data
    const { data: journey, error: journeyError } = await supabase
      .from('buyer_journey')
      .select(`
        *,
        lead:generated_leads(*),
        property:properties(*)
      `)
      .eq('id', journeyId)
      .single();

    if (journeyError || !journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }

    // Fetch email sequence executions
    const { data: emailExecutions } = await supabase
      .from('email_sequence_executions')
      .select(`
        *,
        sequence:email_sequences(*)
      `)
      .eq('journey_id', journeyId)
      .order('scheduled_at', { ascending: true });

    // Fetch communication suggestions
    const { data: suggestions } = await supabase
      .from('communication_suggestions')
      .select('*')
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        journey,
        emailExecutions: emailExecutions || [],
        suggestions: suggestions || [],
      },
    });

  } catch (error) {
    console.error('[Ultra Automation] Buyer Journey API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

