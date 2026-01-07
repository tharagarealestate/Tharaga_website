/**
 * New Features API Route
 * GET /api/documentation/new-features
 * Fetches newly added features for discovery widget
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch features marked as new, ordered by most recent
    const { data: features, error } = await supabase
      .from('feature_documentation')
      .select('feature_key, feature_name, short_description, feature_icon, icon_color, is_ai_powered')
      .eq('is_new_feature', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching new features:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ features: features || [] });
  } catch (error: any) {
    console.error('Error fetching new features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}














