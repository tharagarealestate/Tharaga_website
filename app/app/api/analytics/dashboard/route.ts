// =============================================
// ANALYTICS DASHBOARD API - COMPLETE METRICS
// GET /api/analytics/dashboard?period=30d&compare=true
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// =============================================
// TYPES
// =============================================
interface DashboardAnalytics {
  // Overview Metrics
  overview: {
    total_leads: number;
    new_leads_this_period: number;
    hot_leads: number;
    warm_leads: number;
    active_conversations: number;
    avg_response_time: number; // minutes
    conversion_rate: number; // percentage
  };
  
  // Lead Quality Distribution
  lead_quality: {
    hot: { count: number; percentage: number };
    warm: { count: number; percentage: number };
    developing: { count: number; percentage: number };
    cold: { count: number; percentage: number };
    low_quality: { count: number; percentage: number };
  };
  
  // Conversion Funnel
  funnel: {
    total_visitors: number;
    engaged_users: number; // >3 property views
    high_intent: number; // contact intent score >5
    contacted: number; // builder reached out
    meetings_scheduled: number;
    offers_made: number;
    deals_closed: number;
    conversion_rates: {
      visitor_to_engaged: number;
      engaged_to_high_intent: number;
      high_intent_to_contacted: number;
      contacted_to_meeting: number;
      meeting_to_offer: number;
      offer_to_close: number;
      overall: number;
    };
  };
  
  // Score Trends
  score_trends: {
    dates: string[];
    avg_scores: number[];
    hot_lead_counts: number[];
    new_lead_counts: number[];
  };
  
  // Activity Heatmap
  activity_by_hour: Record<number, number>; // 0-23 hours
  activity_by_day: Record<string, number>; // Mon-Sun
  
  // Top Properties
  top_properties: Array<{
    property_id: string;
    property_title: string;
    view_count: number;
    unique_viewers: number;
    avg_engagement_time: number;
    lead_count: number;
    conversion_rate: number;
  }>;
  
  // Response Performance
  response_metrics: {
    avg_first_response_time: number; // minutes
    avg_response_time: number;
    response_rate: number; // percentage of leads contacted
    pending_responses: number;
    overdue_followups: number;
  };
  
  // Revenue Projections
  revenue: {
    pipeline_value: number;
    expected_revenue: number; // based on conversion probability
    closed_deals_value: number;
    avg_deal_size: number;
    projected_monthly: number;
  };
  
  // Lead Sources
  lead_sources: Array<{
    source: string;
    count: number;
    percentage: number;
    avg_quality_score: number;
    conversion_rate: number;
  }>;
  
  // Comparison (if requested)
  comparison?: {
    period: string;
    metrics: Record<string, { current: number; previous: number; change: number }>;
  };
}

// =============================================
// HELPER: Parse Period
// =============================================
function parsePeriod(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  if (period === '7d') {
    start.setDate(start.getDate() - 7);
  } else if (period === '30d') {
    start.setDate(start.getDate() - 30);
  } else if (period === '90d') {
    start.setDate(start.getDate() - 90);
  } else if (period === 'this_month') {
    start.setDate(1);
  } else if (period === 'last_month') {
    start.setMonth(start.getMonth() - 1);
    start.setDate(1);
    end.setDate(0); // Last day of previous month
  } else {
    start.setDate(start.getDate() - 30); // Default 30 days
  }
  
  return { start, end };
}

// =============================================
// GET HANDLER
// =============================================
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient();
    
    // =============================================
    // AUTHENTICATION
    // =============================================
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify builder role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'builder') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // =============================================
    // PARSE QUERY PARAMETERS
    // =============================================
    
    const searchParams = request.nextUrl.searchParams;
    const periodParam = searchParams.get('period') || '30d';
    const compareParam = searchParams.get('compare') === 'true';
    
    const { start, end } = parsePeriod(periodParam);
    
    // =============================================
    // FETCH ALL LEAD SCORES IN PERIOD
    // =============================================
    
    const { data: allLeadScores } = await supabase
      .from('lead_scores')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());
    
    const totalLeads = allLeadScores?.length || 0;
    
    // =============================================
    // FETCH LATEST LEAD SCORES (for current state)
    // =============================================
    
    const { data: currentLeadScores } = await supabase
      .from('lead_scores')
      .select('*')
      .order('updated_at', { ascending: false });
    
    // Count by category
    const hotLeads = currentLeadScores?.filter(l => l.category === 'Hot Lead').length || 0;
    const warmLeads = currentLeadScores?.filter(l => l.category === 'Warm Lead').length || 0;
    const developingLeads = currentLeadScores?.filter(l => l.category === 'Developing Lead').length || 0;
    const coldLeads = currentLeadScores?.filter(l => l.category === 'Cold Lead').length || 0;
    const lowQualityLeads = currentLeadScores?.filter(l => l.category === 'Low Quality').length || 0;
    
    const totalCurrentLeads = currentLeadScores?.length || 0;
    
    // =============================================
    // FETCH ALL INTERACTIONS IN PERIOD
    // =============================================
    
    const { data: allInteractions } = await supabase
      .from('lead_interactions')
      .select('*')
      .eq('builder_id', user.id)
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString());
    
    const activeConversations = new Set(allInteractions?.map(i => i.lead_id)).size;
    
    // Calculate avg response time
    const responseTimes = allInteractions
      ?.filter(i => i.response_time_minutes !== null)
      .map(i => i.response_time_minutes) || [];
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time!, 0) / responseTimes.length
      : 0;
    
    // Conversion rate (deals closed / total leads)
    const dealsClosedCount = allInteractions?.filter(i => i.interaction_type === 'deal_closed').length || 0;
    const conversionRate = totalLeads > 0 ? (dealsClosedCount / totalLeads) * 100 : 0;
    
    // =============================================
    // OVERVIEW METRICS
    // =============================================
    
    const overview = {
      total_leads: totalCurrentLeads,
      new_leads_this_period: totalLeads,
      hot_leads: hotLeads,
      warm_leads: warmLeads,
      active_conversations: activeConversations,
      avg_response_time: Math.round(avgResponseTime),
      conversion_rate: parseFloat(conversionRate.toFixed(2)),
    };
    
    // =============================================
    // LEAD QUALITY DISTRIBUTION
    // =============================================
    
    const lead_quality = {
      hot: {
        count: hotLeads,
        percentage: totalCurrentLeads > 0 ? parseFloat(((hotLeads / totalCurrentLeads) * 100).toFixed(1)) : 0,
      },
      warm: {
        count: warmLeads,
        percentage: totalCurrentLeads > 0 ? parseFloat(((warmLeads / totalCurrentLeads) * 100).toFixed(1)) : 0,
      },
      developing: {
        count: developingLeads,
        percentage: totalCurrentLeads > 0 ? parseFloat(((developingLeads / totalCurrentLeads) * 100).toFixed(1)) : 0,
      },
      cold: {
        count: coldLeads,
        percentage: totalCurrentLeads > 0 ? parseFloat(((coldLeads / totalCurrentLeads) * 100).toFixed(1)) : 0,
      },
      low_quality: {
        count: lowQualityLeads,
        percentage: totalCurrentLeads > 0 ? parseFloat(((lowQualityLeads / totalCurrentLeads) * 100).toFixed(1)) : 0,
      },
    };
    
    // =============================================
    // CONVERSION FUNNEL
    // =============================================
    
    // Fetch all behaviors in period
    const { data: allBehaviors } = await supabase
      .from('user_behavior')
      .select('user_id, behavior_type, property_id, duration')
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString());
    
    const uniqueVisitors = new Set(allBehaviors?.map(b => b.user_id)).size;
    
    // Engaged users (>3 property views)
    const viewsByUser = new Map<string, number>();
    allBehaviors?.forEach(b => {
      if (b.behavior_type === 'property_view') {
        viewsByUser.set(b.user_id, (viewsByUser.get(b.user_id) || 0) + 1);
      }
    });
    const engagedUsers = Array.from(viewsByUser.values()).filter(count => count >= 3).length;
    
    // High intent (contact clicks)
    const highIntentUsers = new Set(
      allBehaviors?.filter(b => 
        ['phone_clicked', 'email_clicked', 'whatsapp_clicked'].includes(b.behavior_type)
      ).map(b => b.user_id)
    ).size;
    
    // Contacted (builder reached out)
    const contactedUsers = new Set(allInteractions?.map(i => i.lead_id)).size;
    
    // Meetings scheduled
    const meetingsScheduled = allInteractions?.filter(i => 
      i.interaction_type === 'site_visit_scheduled'
    ).length || 0;
    
    // Offers made
    const offersMade = allInteractions?.filter(i => 
      i.interaction_type === 'offer_made'
    ).length || 0;
    
    // Deals closed
    const dealsClosed = dealsClosedCount;
    
    // Calculate conversion rates
    const funnel = {
      total_visitors: uniqueVisitors,
      engaged_users: engagedUsers,
      high_intent: highIntentUsers,
      contacted: contactedUsers,
      meetings_scheduled: meetingsScheduled,
      offers_made: offersMade,
      deals_closed: dealsClosed,
      conversion_rates: {
        visitor_to_engaged: uniqueVisitors > 0 ? parseFloat(((engagedUsers / uniqueVisitors) * 100).toFixed(2)) : 0,
        engaged_to_high_intent: engagedUsers > 0 ? parseFloat(((highIntentUsers / engagedUsers) * 100).toFixed(2)) : 0,
        high_intent_to_contacted: highIntentUsers > 0 ? parseFloat(((contactedUsers / highIntentUsers) * 100).toFixed(2)) : 0,
        contacted_to_meeting: contactedUsers > 0 ? parseFloat(((meetingsScheduled / contactedUsers) * 100).toFixed(2)) : 0,
        meeting_to_offer: meetingsScheduled > 0 ? parseFloat(((offersMade / meetingsScheduled) * 100).toFixed(2)) : 0,
        offer_to_close: offersMade > 0 ? parseFloat(((dealsClosed / offersMade) * 100).toFixed(2)) : 0,
        overall: uniqueVisitors > 0 ? parseFloat(((dealsClosed / uniqueVisitors) * 100).toFixed(2)) : 0,
      },
    };
    
    // =============================================
    // SCORE TRENDS (last 30 days)
    // =============================================
    
    const trendDays = 30;
    const dates: string[] = [];
    const avgScores: number[] = [];
    const hotLeadCounts: number[] = [];
    const newLeadCounts: number[] = [];
    
    for (let i = trendDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
      
      // Fetch scores created up to this day
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const { data: dayScores } = await supabase
        .from('lead_scores')
        .select('score, category, created_at')
        .lte('created_at', dayEnd.toISOString());
      
      const avgScore = dayScores?.length 
        ? dayScores.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / dayScores.length 
        : 0;
      avgScores.push(parseFloat(avgScore.toFixed(2)));
      
      const hotCount = dayScores?.filter(s => s.category === 'Hot Lead').length || 0;
      hotLeadCounts.push(hotCount);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const newCount = dayScores?.filter(s => {
        const created = new Date(s.created_at);
        return created >= dayStart && created <= dayEnd;
      }).length || 0;
      newLeadCounts.push(newCount);
    }
    
    const score_trends = { dates, avg_scores: avgScores, hot_lead_counts: hotLeadCounts, new_lead_counts: newLeadCounts };
    
    // =============================================
    // ACTIVITY HEATMAP
    // =============================================
    
    const activity_by_hour: Record<number, number> = {};
    const activity_by_day: Record<string, number> = {
      'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0,
      'Friday': 0, 'Saturday': 0, 'Sunday': 0,
    };
    
    // Initialize hours
    for (let i = 0; i < 24; i++) {
      activity_by_hour[i] = 0;
    }
    
    allBehaviors?.forEach(b => {
      const date = new Date(b.timestamp);
      const hour = date.getHours();
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      activity_by_hour[hour] = (activity_by_hour[hour] || 0) + 1;
      if (activity_by_day[day] !== undefined) {
        activity_by_day[day] = (activity_by_day[day] || 0) + 1;
      }
    });
    
    // =============================================
    // TOP PROPERTIES
    // =============================================
    
    const propertyViews = new Map<string, {
      count: number;
      users: Set<string>;
      totalTime: number;
    }>();
    
    allBehaviors?.forEach(b => {
      if (b.behavior_type === 'property_view' && b.property_id) {
        const existing = propertyViews.get(b.property_id) || {
          count: 0,
          users: new Set(),
          totalTime: 0,
        };
        
        existing.count++;
        existing.users.add(b.user_id);
        existing.totalTime += b.duration || 0;
        
        propertyViews.set(b.property_id, existing);
      }
    });
    
    const propertyIds = Array.from(propertyViews.keys()).slice(0, 10); // Top 10
    const top_properties = [];
    
    if (propertyIds.length > 0) {
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, price')
        .eq('builder_id', user.id)
        .in('id', propertyIds);
      
      if (properties) {
        for (const prop of properties) {
          const stats = propertyViews.get(prop.id);
          if (stats) {
            const leadCount = stats.users.size;
            const avgEngagementTime = stats.count > 0 ? stats.totalTime / stats.count : 0;
            
            top_properties.push({
              property_id: prop.id,
              property_title: prop.title || 'Untitled Property',
              view_count: stats.count,
              unique_viewers: leadCount,
              avg_engagement_time: Math.round(avgEngagementTime),
              lead_count: leadCount,
              conversion_rate: 0, // TODO: Calculate based on deals closed for this property
            });
          }
        }
      }
    }
    
    top_properties.sort((a, b) => b.view_count - a.view_count);
    
    // =============================================
    // RESPONSE METRICS
    // =============================================
    
    const firstResponseTimes = allInteractions
      ?.filter(i => i.response_time_minutes !== null)
      .map(i => i.response_time_minutes!)
      .sort((a, b) => a - b)
      .slice(0, Math.max(1, Math.ceil((allInteractions?.length || 0) * 0.1))) || [];
    
    const avgFirstResponseTime = firstResponseTimes.length > 0
      ? firstResponseTimes.reduce((sum, time) => sum + time, 0) / firstResponseTimes.length
      : 0;
    
    const leadsContacted = contactedUsers;
    const responseRate = totalLeads > 0 ? (leadsContacted / totalLeads) * 100 : 0;
    
    const pendingInteractions = allInteractions?.filter(i => i.status === 'pending').length || 0;
    
    const overdueFollowups = allInteractions?.filter(i => 
      i.next_follow_up && new Date(i.next_follow_up) < new Date()
    ).length || 0;
    
    const response_metrics = {
      avg_first_response_time: Math.round(avgFirstResponseTime),
      avg_response_time: Math.round(avgResponseTime),
      response_rate: parseFloat(responseRate.toFixed(2)),
      pending_responses: pendingInteractions,
      overdue_followups: overdueFollowups,
    };
    
    // =============================================
    // REVENUE PROJECTIONS
    // =============================================
    
    // Fetch properties for this builder
    const { data: properties } = await supabase
      .from('properties')
      .select('price')
      .eq('builder_id', user.id);
    
    const avgPrice = properties?.length 
      ? properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length 
      : 0;
    
    const closedDeals = allInteractions?.filter(i => i.interaction_type === 'deal_closed') || [];
    const closedDealsValue = closedDeals.length * avgPrice * 0.02; // Assuming 2% commission
    
    const avgDealSize = closedDeals.length > 0 ? closedDealsValue / closedDeals.length : 0;
    
    // Pipeline value (all hot + warm leads * avg property price * conversion rate)
    const pipelineLeads = hotLeads + warmLeads;
    const pipelineValue = pipelineLeads * avgPrice * 0.02; // 2% commission
    
    const expectedRevenue = pipelineValue * (conversionRate / 100);
    
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const projectedMonthly = daysDiff > 0 ? (closedDealsValue / daysDiff) * 30 : 0;
    
    const revenue = {
      pipeline_value: Math.round(pipelineValue),
      expected_revenue: Math.round(expectedRevenue),
      closed_deals_value: Math.round(closedDealsValue),
      avg_deal_size: Math.round(avgDealSize),
      projected_monthly: Math.round(projectedMonthly),
    };
    
    // =============================================
    // LEAD SOURCES
    // =============================================
    
    // Get source from leads table
    const { data: leads } = await supabase
      .from('leads')
      .select('id, source')
      .eq('builder_id', user.id)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());
    
    const sourceMap = new Map<string, {
      count: number;
      totalScore: number;
      conversions: number;
    }>();
    
    leads?.forEach(lead => {
      const source = lead.source || 'unknown';
      const existing = sourceMap.get(source) || {
        count: 0,
        totalScore: 0,
        conversions: 0,
      };
      
      existing.count++;
      sourceMap.set(source, existing);
    });
    
    // Get scores for these leads - match by email or user_id
    if (leads && leads.length > 0) {
      const leadEmails = leads.map(l => l.email).filter(Boolean);
      if (leadEmails.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('email', leadEmails);
        
        if (profiles) {
          const profileIds = profiles.map(p => p.id);
          const { data: scores } = await supabase
            .from('lead_scores')
            .select('user_id, score')
            .in('user_id', profileIds);
          
          scores?.forEach(score => {
            const profile = profiles.find(p => p.id === score.user_id);
            if (profile) {
              const lead = leads.find(l => l.email === profile.email);
              if (lead) {
                const source = lead.source || 'unknown';
                const existing = sourceMap.get(source);
                if (existing) {
                  existing.totalScore += Number(score.score) || 0;
                }
              }
            }
          });
        }
      }
    }
    
    const lead_sources = Array.from(sourceMap.entries())
      .map(([source, stats]) => ({
        source: source || 'Unknown',
        count: stats.count,
        percentage: totalLeads > 0 ? parseFloat(((stats.count / totalLeads) * 100).toFixed(1)) : 0,
        avg_quality_score: stats.count > 0 ? parseFloat((stats.totalScore / stats.count).toFixed(2)) : 0,
        conversion_rate: 0, // TODO: Track conversions by source
      }))
      .sort((a, b) => b.count - a.count);
    
    // =============================================
    // COMPARISON (if requested)
    // =============================================
    
    let comparison: DashboardAnalytics['comparison'] | undefined = undefined;
    
    if (compareParam) {
      // Calculate previous period
      const periodLength = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - periodLength);
      const prevEnd = new Date(start.getTime());
      
      // Fetch previous period data
      const { data: prevLeadScores } = await supabase
        .from('lead_scores')
        .select('*')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());
      
      const prevTotalLeads = prevLeadScores?.length || 0;
      
      const calculateChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return parseFloat((((current - previous) / previous) * 100).toFixed(2));
      };
      
      comparison = {
        period: `${prevStart.toISOString().split('T')[0]} to ${prevEnd.toISOString().split('T')[0]}`,
        metrics: {
          total_leads: {
            current: totalLeads,
            previous: prevTotalLeads,
            change: calculateChange(totalLeads, prevTotalLeads),
          },
          conversion_rate: {
            current: conversionRate,
            previous: 0, // TODO: Calculate previous conversion rate
            change: conversionRate,
          },
        },
      };
    }
    
    // =============================================
    // BUILD RESPONSE
    // =============================================
    
    const analytics: DashboardAnalytics = {
      overview,
      lead_quality,
      funnel,
      score_trends,
      activity_by_hour,
      activity_by_day,
      top_properties,
      response_metrics,
      revenue,
      lead_sources,
      comparison,
    };
    
    return NextResponse.json({
      success: true,
      data: analytics,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
    
  } catch (error) {
    console.error('[API/Analytics/Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

