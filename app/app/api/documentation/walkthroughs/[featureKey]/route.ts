/**
 * Get Walkthrough Configuration API
 * GET /api/documentation/walkthroughs/[featureKey]
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

    // Get user role and tier
    let userRoleName = 'builder';
    try {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      if (userRole) userRoleName = userRole.role;
    } catch (e) {
      // Table might not exist, use default
    }

    let userTier = 'free';
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_type, tier')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      if (subscription) {
        userTier = subscription.tier || subscription.plan_type || 'free';
      }
    } catch (e) {
      // Table might not exist, use default
    }

    // Get active walkthroughs for this feature
    const { data: walkthroughs, error } = await supabase
      .from('interactive_walkthroughs')
      .select('*')
      .eq('feature_key', featureKey)
      .eq('is_active', true)
      .in('target_user_tiers', userTier === 'pro' ? ['free', 'pro'] : ['free'])
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error fetching walkthroughs:', error);
      return NextResponse.json({ walkthroughs: [] });
    }

    // Filter by user role if specified
    const filteredWalkthroughs = (walkthroughs || []).filter(w => {
      if (!w.target_user_roles || w.target_user_roles.length === 0) return true;
      return w.target_user_roles.includes(userRoleName);
    });

    // Get user progress for these walkthroughs
    const walkthroughIds = filteredWalkthroughs.map(w => w.id);
    const { data: progress } = await supabase
      .from('user_walkthrough_progress')
      .select('*')
      .eq('user_id', user.id)
      .in('walkthrough_id', walkthroughIds);

    // Merge progress with walkthroughs
    const walkthroughsWithProgress = filteredWalkthroughs.map(w => {
      const userProgress = progress?.find(p => p.walkthrough_id === w.id);
      return {
        ...w,
        user_progress: userProgress || null,
      };
    });

    return NextResponse.json({ walkthroughs: walkthroughsWithProgress });
  } catch (error: any) {
    console.error('Error fetching walkthroughs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


