/**
 * Get User Feature Journey API
 * GET /api/documentation/analytics/journey/[userId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;

    // Users can only view their own journeys, or admins can view any
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (user.id !== userId && !userRole) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get user journeys
    const { data: journeys, error } = await supabase
      .from('user_feature_journeys')
      .select('*')
      .eq('user_id', userId)
      .order('stage_timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching journeys:', error);
      return NextResponse.json({ journeys: [] });
    }

    // Group by feature_key
    const journeysByFeature: Record<string, any[]> = {};
    (journeys || []).forEach(journey => {
      if (!journeysByFeature[journey.feature_key]) {
        journeysByFeature[journey.feature_key] = [];
      }
      journeysByFeature[journey.feature_key].push(journey);
    });

    return NextResponse.json({
      journeys: journeys || [],
      journeys_by_feature: journeysByFeature,
    });
  } catch (error: any) {
    console.error('Error fetching user journeys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}





