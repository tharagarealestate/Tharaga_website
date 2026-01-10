/**
 * Get Documentation Heatmap Data API
 * GET /api/documentation/analytics/heatmap/[featureKey]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: { featureKey: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (only admins can view analytics)
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!userRole) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { featureKey } = params;
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get heatmap data for the feature
    const { data: heatmapData, error } = await supabase
      .from('doc_heatmap_data')
      .select('*')
      .eq('feature_key', featureKey)
      .eq('date', date)
      .order('click_count', { ascending: false });

    if (error) {
      console.error('Error fetching heatmap data:', error);
      return NextResponse.json({ heatmap: [] });
    }

    return NextResponse.json({ heatmap: heatmapData || [] });
  } catch (error: any) {
    console.error('Error fetching heatmap data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}






























