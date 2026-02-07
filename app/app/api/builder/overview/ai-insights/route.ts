import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lazy initialization to avoid build-time errors when API key is not set
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY is not configured - AI insights will be limited');
    return null;
  }
  try {
    return new OpenAI({ apiKey });
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    return null;
  }
}

interface DashboardMetrics {
  total_leads: number;
  hot_leads: number;
  warm_leads: number;
  total_properties: number;
  active_properties: number;
  total_revenue: number;
  monthly_revenue: number;
  conversion_rate: number;
  avg_response_time: number;
  lead_trends: Array<{ date: string; count: number }>;
  property_performance: Array<{ property_id: string; views: number; inquiries: number }>;
  revenue_trends: Array<{ date: string; revenue: number }>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[AI Insights API] Auth error:', authError?.message || 'No user');
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Please log in to view dashboard insights'
      }, { status: 401 });
    }

    // Allow admin user (tharagarealestate@gmail.com) to access
    const isAdmin = user.email === 'tharagarealestate@gmail.com';

    // Get builder's metrics (for admin, use their own ID or allow all data)
    const metrics = await getBuilderMetrics(supabase, user.id, isAdmin);

    // Generate AI insights using OpenAI
    const aiInsights = await generateAIInsights(metrics);

    // Generate market research insights (simulated Perplexity-style research)
    const marketInsights = await generateMarketInsights(metrics);

    // Detect anomalies
    const anomalies = detectAnomalies(metrics);

    // Generate actionable recommendations
    const recommendations = await generateRecommendations(metrics, aiInsights, anomalies);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        aiInsights,
        marketInsights,
        anomalies,
        recommendations,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[AI Insights API] Error:', error);
    // Return a graceful error response that the frontend can handle
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate AI insights',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

async function getBuilderMetrics(supabase: any, userId: string, isAdmin: boolean = false): Promise<DashboardMetrics> {
  // Build query for leads - admin can see all, builder sees only their own
  let leadsQuery = supabase
    .from('leads')
    .select('id, created_at, score, category, budget, property_id, status')
    .order('created_at', { ascending: false });
  
  if (!isAdmin) {
    leadsQuery = leadsQuery.eq('builder_id', userId);
  }
  
  const { data: leads, error: leadsError } = await leadsQuery;
  
  if (leadsError) {
    console.error('[AI Insights] Error fetching leads:', leadsError);
    // Continue with empty array instead of failing
  }

  // Build query for properties - admin can see all, builder sees only their own
  let propertiesQuery = supabase
    .from('properties')
    .select('id, created_at, listing_status');
  
  if (!isAdmin) {
    propertiesQuery = propertiesQuery.eq('builder_id', userId);
  }
  
  const { data: properties, error: propertiesError } = await propertiesQuery;
  
  if (propertiesError) {
    console.error('[AI Insights] Error fetching properties:', propertiesError);
    // Continue with empty array instead of failing
  }
  
  // Ensure we have arrays even if queries failed
  const safeLeads = leads || [];
  const safeProperties = properties || [];

  // Calculate views and inquiries for each property from leads
  const propertyStats: Record<string, { views: number; inquiries: number }> = {}
  safeProperties.forEach((p: any) => {
    propertyStats[p.id] = { views: 0, inquiries: 0 }
  })
  
  // Count inquiries per property
  safeLeads.forEach((lead: any) => {
    if (lead.property_id && propertyStats[lead.property_id]) {
      propertyStats[lead.property_id].inquiries++
    }
  })

  // Get revenue data (if available) - try revenue table, fallback to empty array
  let revenue: any[] = []
  try {
    const { data: revenueData } = await supabase
      .from('revenue')
      .select('*')
      .eq('builder_id', userId)
      .order('date', { ascending: false })
      .limit(30)
    revenue = revenueData || []
  } catch (error) {
    // Revenue table might not exist, use empty array
    console.warn('Revenue table not available:', error)
    revenue = []
  }

  // Calculate metrics
  const total_leads = safeLeads.length;
  // Determine category from score if category field doesn't exist
  const hot_leads = safeLeads.filter((l: any) => {
    if (l.category === 'hot') return true
    if (l.score && l.score >= 8) return true
    return false
  }).length;
  const warm_leads = safeLeads.filter((l: any) => {
    if (l.category === 'warm') return true
    if (l.score && l.score >= 6 && l.score < 8) return true
    return false
  }).length;
  const total_properties = safeProperties.length;
  const active_properties = safeProperties.filter((p: any) => 
    p.listing_status === 'active' || p.listing_status === 'published' || p.listing_status === 'listed'
  ).length;

  // Calculate trends
  const leadTrends = calculateTrends(leads || [], 'created_at');
  const revenueTrends = revenue?.map((r: any) => ({
    date: r.date,
    revenue: r.amount || 0
  })) || [];

  // Property performance
  const propertyPerformance = Object.entries(propertyStats).map(([property_id, stats]) => ({
    property_id,
    views: stats.views,
    inquiries: stats.inquiries
  }));

  // Calculate conversion rate (leads with property_id / total leads)
  const convertedLeads = safeLeads.filter((l: any) => l.property_id).length;
  const conversion_rate = total_leads > 0 ? (convertedLeads / total_leads) * 100 : 0;

  // Calculate average response time (simplified - would need interaction data)
  const avg_response_time = 2.5; // hours (placeholder)

  // Calculate revenue
  const total_revenue = revenue?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;
  const monthly_revenue = revenue?.slice(0, 30).reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;

  return {
    total_leads,
    hot_leads,
    warm_leads,
    total_properties,
    active_properties,
    total_revenue,
    monthly_revenue,
    conversion_rate,
    avg_response_time,
    lead_trends: leadTrends,
    property_performance: propertyPerformance,
    revenue_trends: revenueTrends
  };
}

function calculateTrends(data: any[], dateField: string): Array<{ date: string; count: number }> {
  const trends: Record<string, number> = {};
  const now = new Date();
  
  // Last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    trends[dateStr] = 0;
  }

  data.forEach((item: any) => {
    if (item[dateField]) {
      const date = new Date(item[dateField]);
      const dateStr = date.toISOString().split('T')[0];
      if (trends[dateStr] !== undefined) {
        trends[dateStr]++;
      }
    }
  });

  return Object.entries(trends).map(([date, count]) => ({ date, count }));
}

async function generateAIInsights(metrics: DashboardMetrics): Promise<any> {
  try {
    const openai = getOpenAIClient();
    
    const prompt = `Analyze the following real estate builder dashboard metrics and provide AI-powered insights:

Metrics:
- Total Leads: ${metrics.total_leads}
- Hot Leads: ${metrics.hot_leads}
- Warm Leads: ${metrics.warm_leads}
- Total Properties: ${metrics.total_properties}
- Active Properties: ${metrics.active_properties}
- Conversion Rate: ${metrics.conversion_rate.toFixed(2)}%
- Average Response Time: ${metrics.avg_response_time} hours
- Monthly Revenue: ₹${metrics.monthly_revenue.toLocaleString()}

Lead Trends (last 7 days): ${JSON.stringify(metrics.lead_trends.slice(-7))}

Provide insights in JSON format with:
1. keyFindings: Array of 3-5 key insights
2. performanceSummary: Brief summary of overall performance
3. trendAnalysis: Analysis of trends and patterns
4. opportunities: Array of opportunities identified
5. risks: Array of potential risks or concerns

Return only valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI analytics expert for real estate builders. Provide data-driven insights in JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('OpenAI insights error:', error);
    return {
      keyFindings: ['AI insights temporarily unavailable'],
      performanceSummary: 'Analyzing your dashboard metrics...',
      trendAnalysis: 'Trend analysis in progress...',
      opportunities: [],
      risks: []
    };
  }
}

async function generateMarketInsights(metrics: DashboardMetrics): Promise<any> {
  // Simulated market research insights (would use Perplexity API in production)
  // For now, generate based on metrics
  const insights = {
    marketTrends: [
      {
        title: 'Market Activity',
        description: metrics.total_leads > 50 
          ? 'High market activity detected. Your lead generation is performing well above average.'
          : 'Moderate market activity. Consider increasing marketing efforts.',
        impact: 'positive',
        confidence: 0.85
      },
      {
        title: 'Conversion Optimization',
        description: metrics.conversion_rate > 15
          ? 'Excellent conversion rate. Your sales process is highly effective.'
          : 'Conversion rate below industry average. Focus on lead nurturing.',
        impact: metrics.conversion_rate > 15 ? 'positive' : 'warning',
        confidence: 0.90
      }
    ],
    competitiveAnalysis: {
      leadGeneration: metrics.total_leads > 100 ? 'Above average' : 'Average',
      conversionRate: metrics.conversion_rate > 15 ? 'Top quartile' : 'Needs improvement',
      responseTime: metrics.avg_response_time < 2 ? 'Excellent' : 'Good'
    },
    recommendations: [
      metrics.hot_leads > 10 
        ? 'Prioritize hot leads immediately - high conversion potential'
        : 'Focus on warming up cold leads through targeted campaigns',
      metrics.conversion_rate < 10
        ? 'Implement lead nurturing sequences to improve conversion'
        : 'Maintain current conversion strategies'
    ]
  };

  return insights;
}

function detectAnomalies(metrics: DashboardMetrics): any[] {
  const anomalies: any[] = [];

  // Check for sudden drops in leads
  if (metrics.lead_trends.length >= 7) {
    const recent = metrics.lead_trends.slice(-7);
    const avgRecent = recent.reduce((sum, d) => sum + d.count, 0) / recent.length;
    const avgPrevious = metrics.lead_trends.length > 14 
      ? metrics.lead_trends.slice(-14, -7).reduce((sum, d) => sum + d.count, 0) / 7
      : avgRecent;

    if (avgRecent < avgPrevious * 0.5) {
      anomalies.push({
        type: 'lead_drop',
        severity: 'high',
        title: 'Significant Drop in Lead Generation',
        description: `Lead generation dropped by ${((1 - avgRecent / avgPrevious) * 100).toFixed(0)}% compared to previous week.`,
        recommendation: 'Review marketing campaigns and lead sources.'
      });
    }
  }

  // Check conversion rate
  if (metrics.conversion_rate < 5 && metrics.total_leads > 20) {
    anomalies.push({
      type: 'low_conversion',
      severity: 'medium',
      title: 'Low Conversion Rate',
      description: `Conversion rate of ${metrics.conversion_rate.toFixed(1)}% is below industry average.`,
      recommendation: 'Improve lead qualification and follow-up processes.'
    });
  }

  // Check response time
  if (metrics.avg_response_time > 4) {
    anomalies.push({
      type: 'slow_response',
      severity: 'medium',
      title: 'Slow Response Time',
      description: `Average response time of ${metrics.avg_response_time} hours may impact conversion.`,
      recommendation: 'Implement faster response workflows or automation.'
    });
  }

  return anomalies;
}

async function generateRecommendations(
  metrics: DashboardMetrics,
  aiInsights: any,
  anomalies: any[]
): Promise<any[]> {
  try {
    const openai = getOpenAIClient();
    
    const prompt = `Based on the following real estate builder metrics and insights, generate 5-7 actionable recommendations:

Metrics: ${JSON.stringify(metrics)}
AI Insights: ${JSON.stringify(aiInsights)}
Anomalies: ${JSON.stringify(anomalies)}

Provide recommendations in JSON format as an array of objects, each with:
- title: Short title
- description: Detailed description
- priority: "high" | "medium" | "low"
- category: "leads" | "properties" | "revenue" | "operations"
- impact: Expected impact description
- effort: "low" | "medium" | "high"

Return only valid JSON with a "recommendations" array.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a strategic advisor for real estate builders. Provide actionable, prioritized recommendations in JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"recommendations": []}');
    return result.recommendations || [];
  } catch (error) {
    console.error('Recommendations error:', error);
    // Fallback recommendations
    return [
      {
        title: 'Focus on Hot Leads',
        description: `You have ${metrics.hot_leads} hot leads. Prioritize immediate follow-up.`,
        priority: 'high',
        category: 'leads',
        impact: 'High conversion potential',
        effort: 'low'
      },
      {
        title: 'Improve Conversion Rate',
        description: `Current conversion rate is ${metrics.conversion_rate.toFixed(1)}%. Implement lead nurturing.`,
        priority: 'medium',
        category: 'leads',
        impact: 'Increase revenue from existing leads',
        effort: 'medium'
      }
    ];
  }
}
