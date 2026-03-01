// =============================================
// SMARTSCORE ANALYTICS API ROUTE
// GET /api/smartscore/analytics?period=30d
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (!profile || profile.role !== 'builder') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Parse period
    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const days = daysMap[period] || 30;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    // Fetch leads for this builder
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, smartscore_v2, priority_tier, conversion_probability, predicted_ltv, churn_risk, created_at')
      .eq('builder_id', user.id)
      .gte('created_at', cutoffDate);
    
    if (leadsError) throw leadsError;
    
    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: getEmptyAnalytics(),
        period,
        generated_at: new Date().toISOString()
      });
    }
    
    // Calculate analytics
    const analytics = {
      overview: {
        total_leads: leads.length,
        avg_score: calculateAverage(leads, 'smartscore_v2'),
        avg_conversion_prob: calculateAverage(leads, 'conversion_probability'),
        avg_churn_risk: calculateAverage(leads, 'churn_risk') || 0,
        total_predicted_revenue: leads.reduce((sum, l) => sum + parseFloat(l.predicted_ltv || 0), 0)
      },
      tier_distribution: {
        hot: leads.filter(l => l.priority_tier === 'platinum' || (l.priority_tier === 'gold' && parseFloat(l.smartscore_v2 || 0) >= 80)).length,
        warm: leads.filter(l => l.priority_tier === 'gold' || l.priority_tier === 'silver').length,
        developing: leads.filter(l => l.priority_tier === 'bronze').length,
        cold: leads.filter(l => l.priority_tier === 'standard' || !l.priority_tier).length
      },
      score_ranges: {
        '90-100': leads.filter(l => parseFloat(l.smartscore_v2 || 0) >= 90).length,
        '80-89': leads.filter(l => {
          const score = parseFloat(l.smartscore_v2 || 0);
          return score >= 80 && score < 90;
        }).length,
        '70-79': leads.filter(l => {
          const score = parseFloat(l.smartscore_v2 || 0);
          return score >= 70 && score < 80;
        }).length,
        '60-69': leads.filter(l => {
          const score = parseFloat(l.smartscore_v2 || 0);
          return score >= 60 && score < 70;
        }).length,
        '0-59': leads.filter(l => parseFloat(l.smartscore_v2 || 0) < 60).length
      },
      high_value_leads: leads
        .filter(l => parseFloat(l.predicted_ltv || 0) > 5000000)
        .sort((a, b) => parseFloat(b.predicted_ltv || 0) - parseFloat(a.predicted_ltv || 0))
        .slice(0, 10)
        .map(l => ({
          lead_id: l.id,
          smartscore: parseFloat(l.smartscore_v2 || 0),
          predicted_ltv: parseFloat(l.predicted_ltv || 0),
          conversion_probability: parseFloat(l.conversion_probability || 0)
        })),
      churn_risk_analysis: {
        high_risk: leads.filter(l => parseFloat(l.churn_risk || 0) > 0.7).length,
        medium_risk: leads.filter(l => {
          const risk = parseFloat(l.churn_risk || 0);
          return risk >= 0.4 && risk <= 0.7;
        }).length,
        low_risk: leads.filter(l => parseFloat(l.churn_risk || 0) < 0.4).length
      },
      trends: [] as any[]
    };
    
    // Try to fetch trend data from function
    try {
      const { data: trendData } = await supabase.rpc('get_score_trends', {
        p_builder_id: user.id,
        p_days: days
      });
      
      if (trendData) {
        analytics.trends = trendData;
      }
    } catch (trendError) {
      // Function might not exist yet, calculate manually
      console.warn('Trend function not available, calculating manually:', trendError);
      analytics.trends = calculateTrendsManually(leads, days);
    }
    
    return NextResponse.json({
      success: true,
      analytics,
      period,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

function calculateAverage(array: any[], key: string): number {
  const values = array
    .map(item => parseFloat(item[key] || 0))
    .filter(v => !isNaN(v) && v > 0);
  
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function getEmptyAnalytics() {
  return {
    overview: {
      total_leads: 0,
      avg_score: 0,
      avg_conversion_prob: 0,
      avg_churn_risk: 0,
      total_predicted_revenue: 0
    },
    tier_distribution: { hot: 0, warm: 0, developing: 0, cold: 0 },
    score_ranges: { '90-100': 0, '80-89': 0, '70-79': 0, '60-69': 0, '0-59': 0 },
    high_value_leads: [],
    churn_risk_analysis: { high_risk: 0, medium_risk: 0, low_risk: 0 },
    trends: []
  };
}

function calculateTrendsManually(leads: any[], days: number) {
  // Group by date and calculate averages
  const dailyData = new Map<string, { count: number; totalScore: number; hotCount: number }>();
  
  leads.forEach(lead => {
    const date = new Date(lead.created_at).toISOString().split('T')[0];
    if (!dailyData.has(date)) {
      dailyData.set(date, { count: 0, totalScore: 0, hotCount: 0 });
    }
    
    const dayData = dailyData.get(date)!;
    dayData.count++;
    dayData.totalScore += parseFloat(lead.smartscore_v2 || 0);
    if (lead.priority_tier === 'platinum' || (lead.priority_tier === 'gold' && parseFloat(lead.smartscore_v2 || 0) >= 80)) {
      dayData.hotCount++;
    }
  });
  
  return Array.from(dailyData.entries())
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avg_score: data.count > 0 ? data.totalScore / data.count : 0,
      hot_leads: data.hotCount
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

