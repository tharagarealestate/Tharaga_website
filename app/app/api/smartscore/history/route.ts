// =============================================
// SMARTSCORE HISTORY API ROUTE
// GET /api/smartscore/history?lead_id=xxx&days=30
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadIdParam = searchParams.get('lead_id');
    const days = parseInt(searchParams.get('days') || '30', 10);
    
    if (!leadIdParam) {
      return NextResponse.json(
        { error: 'lead_id parameter required' },
        { status: 400 }
      );
    }
    
    const leadId = parseInt(leadIdParam, 10);
    if (isNaN(leadId)) {
      return NextResponse.json(
        { error: 'Invalid lead_id' },
        { status: 400 }
      );
    }
    
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify lead access
    const { data: lead } = await supabase
      .from('leads')
      .select('id, builder_id')
      .eq('id', leadId)
      .maybeSingle();
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    
    // Check permission
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profile?.role !== 'admin' && lead.builder_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Fetch score history
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: history, error } = await supabase
      .from('smartscore_history')
      .select('*')
      .eq('lead_id', leadId)
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    // Calculate trends
    const trends = calculateTrends(history || []);
    
    return NextResponse.json({
      success: true,
      lead_id: leadId,
      history: history || [],
      trends,
      period_days: days
    });
    
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

function calculateTrends(history: any[]) {
  if (history.length < 2) {
    return {
      score_trend: 'stable',
      score_change: 0,
      conversion_prob_trend: 'stable',
      churn_risk_trend: 'stable'
    };
  }
  
  const first = history[0];
  const last = history[history.length - 1];
  
  const scoreChange = parseFloat(last.score_value || 0) - parseFloat(first.score_value || 0);
  const convProbChange = parseFloat(last.conversion_probability || 0) - parseFloat(first.conversion_probability || 0);
  
  return {
    score_trend: scoreChange > 5 ? 'improving' : scoreChange < -5 ? 'declining' : 'stable',
    score_change: scoreChange,
    conversion_prob_trend: convProbChange > 0.05 ? 'improving' : convProbChange < -0.05 ? 'declining' : 'stable',
    conversion_prob_change: convProbChange,
    churn_risk_trend: 'stable',
    churn_risk_change: 0
  };
}

