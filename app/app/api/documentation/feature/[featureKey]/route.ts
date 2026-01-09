/**
 * Feature Documentation API Route
 * GET /api/documentation/feature/[featureKey]
 * Fetches documentation for a specific feature
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

    const { featureKey } = params;

    // Fetch feature documentation
    const { data: feature, error } = await supabase
      .from('feature_documentation')
      .select('*')
      .eq('feature_key', featureKey)
      .single();

    if (error || !feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    // Track view (async, don't wait for it)
    supabase
      .from('user_feature_interactions')
      .upsert({
        user_id: user.id,
        feature_key: featureKey,
        interaction_type: 'viewed',
        interacted_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,feature_key,interaction_type'
      })
      .then(() => {
        // Increment view count (async)
        supabase
          .from('feature_documentation')
          .update({ view_count: (feature.view_count || 0) + 1 })
          .eq('feature_key', featureKey);
      });

    return NextResponse.json({ feature });
  } catch (error: any) {
    console.error('Error fetching feature documentation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}






















