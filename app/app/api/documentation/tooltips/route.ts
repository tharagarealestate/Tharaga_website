/**
 * Get Contextual Tooltips API
 * GET /api/documentation/tooltips?pageUrl=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const pageUrl = searchParams.get('pageUrl') || '';

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

    // Get active tooltips that match the page URL
    const { data: tooltips, error } = await supabase
      .from('contextual_tooltips')
      .select('*')
      .eq('is_active', true)
      .or(`page_url_pattern.is.null,page_url_pattern.ilike.%${pageUrl}%`)
      .in('target_user_tiers', userTier === 'pro' ? ['free', 'pro'] : ['free']);

    if (error) {
      console.error('Error fetching tooltips:', error);
      return NextResponse.json({ tooltips: [] });
    }

    // Filter by user role
    const filteredTooltips = (tooltips || []).filter(t => {
      if (!t.target_user_roles || t.target_user_roles.length === 0) return true;
      return t.target_user_roles.includes(userRoleName);
    });

    // Get user interactions to filter out "show_once" tooltips
    const tooltipIds = filteredTooltips.map(t => t.id);
    const { data: interactions } = await supabase
      .from('user_tooltip_interactions')
      .select('tooltip_id')
      .eq('user_id', user.id)
      .in('tooltip_id', tooltipIds)
      .in('interaction_type', ['viewed', 'dismissed']);

    const viewedTooltipIds = new Set(interactions?.map(i => i.tooltip_id) || []);

    // Filter out tooltips that should only show once
    const finalTooltips = filteredTooltips.filter(t => {
      if (t.show_once && viewedTooltipIds.has(t.id)) {
        return false;
      }
      return true;
    });

    return NextResponse.json({ tooltips: finalTooltips });
  } catch (error: any) {
    console.error('Error fetching tooltips:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


