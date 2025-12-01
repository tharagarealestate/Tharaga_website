/**
 * Ultra Automation - Contracts API
 * GET /api/ultra-automation/contracts?builder_id=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const builderId = searchParams.get('builder_id') || user.id;
    const status = searchParams.get('status'); // 'draft', 'sent', 'signed', 'expired'

    let query = supabase
      .from('contracts')
      .select(`
        *,
        journey:buyer_journey(
          *,
          lead:generated_leads(*),
          property:properties(*)
        )
      `)
      .eq('builder_id', builderId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: contracts, error } = await query;

    if (error) {
      console.error('[Ultra Automation] Contracts API Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contracts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contracts || [],
    });

  } catch (error) {
    console.error('[Ultra Automation] Contracts API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

