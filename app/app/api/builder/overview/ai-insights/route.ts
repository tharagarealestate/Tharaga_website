import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/route-handler';
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
  const startTime = Date.now();
  console.log('[AI Insights API] Request started at', new Date().toISOString());
  
  try {
    // Debug: Log all cookies from request
    const allCookies = request.cookies.getAll();
    const authHeader = request.headers.get('authorization');
    console.log('[AI Insights API] Request cookies:', allCookies.map(c => c.name).join(', ') || 'none');
    console.log('[AI Insights API] Authorization header:', authHeader ? 'present' : 'missing');
    
    console.log('[AI Insights API] Step 1: Creating Supabase client from request...');
    const { supabase } = createClientFromRequest(request);
    console.log('[AI Insights API] Step 1: Supabase client created successfully');
    
    console.log('[AI Insights API] Step 2: Getting user authentication...');
    
    // CRITICAL: If Authorization header is present, verify token directly
    let user = null;
    let authError = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('[AI Insights API] Verifying token from Authorization header...');
      
      // CRITICAL: Create a new Supabase client with the token in global headers for verification
      // This ensures the token is properly used for authentication
      const { createClient } = await import('@supabase/supabase-js');
      const tokenClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      
      // Verify token by getting user
      const { data: { user: tokenUser }, error: tokenError } = await tokenClient.auth.getUser();
      if (!tokenError && tokenUser) {
        user = tokenUser;
        console.log('[AI Insights API] Authenticated via token:', tokenUser.email);
        // Use tokenClient for subsequent queries since it has the auth context
        // But we'll continue using the original supabase client for queries
      } else {
        authError = tokenError;
        console.error('[AI Insights API] Token verification failed:', {
          message: tokenError?.message,
          status: tokenError?.status,
          name: tokenError?.name
        });
      }
    } else {
      // Try cookie-based auth
      const result = await supabase.auth.getUser();
      user = result.data?.user || null;
      authError = result.error || null;
    }
    
    console.log('[AI Insights API] Step 2: Auth result - user:', user?.id ? 'exists' : 'null', 'error:', authError?.message || 'none');

    if (authError || !user) {
      console.error('[AI Insights API] Auth error:', {
        error: authError?.message,
        code: authError?.status,
        user: user ? 'exists' : 'null'
      });
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Please log in to view dashboard insights',
        debug: {
          hasAuthError: !!authError,
          authErrorMessage: authError?.message,
          hasUser: !!user,
          cookieCount: allCookies.length,
          cookieNames: allCookies.map(c => c.name)
        }
      }, { status: 401 });
    }

    // Allow admin user (tharagarealestate@gmail.com) to access
    const isAdmin = user.email === 'tharagarealestate@gmail.com';
    console.log('[AI Insights API] Step 3: User check - ID:', user.id, 'Email:', user.email, 'IsAdmin:', isAdmin);

    console.log('[AI Insights API] Step 4: Fetching builder metrics...');
    const metrics = await getBuilderMetrics(supabase, user.id, isAdmin);
    console.log('[AI Insights API] Step 4: Metrics fetched - Leads:', metrics.total_leads, 'Properties:', metrics.total_properties);

    // Generate insights with timeout protection (25 seconds max for Netlify)
    console.log('[AI Insights API] Step 5: Generating AI insights...');
    const aiInsights = await Promise.race([
      generateAIInsights(metrics),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI insights timeout')), 20000)
      )
    ]).catch((error) => {
      console.warn('[AI Insights API] AI insights generation failed or timed out:', error.message);
      return generateAIInsights(metrics); // Will return fallback
    }) as Promise<any>;
    console.log('[AI Insights API] Step 5: AI insights generated');

    console.log('[AI Insights API] Step 6: Generating market insights...');
    const marketInsights = await generateMarketInsights(metrics);
    console.log('[AI Insights API] Step 6: Market insights generated');

    console.log('[AI Insights API] Step 7: Detecting anomalies...');
    const anomalies = detectAnomalies(metrics);
    console.log('[AI Insights API] Step 7: Anomalies detected:', anomalies.length);

    console.log('[AI Insights API] Step 8: Generating recommendations...');
    let recommendations: any[];
    try {
      recommendations = await Promise.race([
        generateRecommendations(metrics, aiInsights, anomalies),
        new Promise<any[]>((_, reject) => 
          setTimeout(() => reject(new Error('Recommendations timeout')), 15000)
        )
      ]);
    } catch (error: any) {
      console.warn('[AI Insights API] Recommendations generation failed or timed out:', error.message);
      recommendations = getFallbackRecommendations(metrics, anomalies);
    }
    console.log('[AI Insights API] Step 8: Recommendations generated:', recommendations.length);

    const duration = Date.now() - startTime;
    console.log('[AI Insights API] Request completed successfully in', duration, 'ms');

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        aiInsights,
        marketInsights,
        anomalies,
        recommendations,
        generatedAt: new Date().toISOString()
      },
      debug: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[AI Insights API] Error after', duration, 'ms:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    // Return a graceful error response that the frontend can handle
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate AI insights',
      debug: {
        errorType: error.name || 'UnknownError',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
}

async function getBuilderMetrics(supabase: any, userId: string, isAdmin: boolean = false): Promise<DashboardMetrics> {
  console.log('[getBuilderMetrics] Starting with userId:', userId, 'isAdmin:', isAdmin);
  
  // Build query for leads - admin can see all, builder sees only their own
  let leadsQuery = supabase
    .from('leads')
    .select('id, created_at, score, category, budget, property_id, status')
    .order('created_at', { ascending: false });
  
  if (!isAdmin) {
    console.log('[getBuilderMetrics] Filtering leads by builder_id:', userId);
    leadsQuery = leadsQuery.eq('builder_id', userId);
  } else {
    console.log('[getBuilderMetrics] Admin user - fetching all leads');
  }
  
  console.log('[getBuilderMetrics] Executing leads query...');
  const { data: leads, error: leadsError } = await leadsQuery;
  
  if (leadsError) {
    console.error('[getBuilderMetrics] Error fetching leads:', {
      message: leadsError.message,
      code: leadsError.code,
      details: leadsError.details,
      hint: leadsError.hint
    });
    // Continue with empty array instead of failing
  } else {
    console.log('[getBuilderMetrics] Leads fetched successfully:', leads?.length || 0, 'leads');
  }

  // Build query for properties - admin can see all, builder sees only their own
  console.log('[getBuilderMetrics] Building properties query...');
  let propertiesQuery = supabase
    .from('properties')
    .select('id, created_at, listing_status');
  
  if (!isAdmin) {
    console.log('[getBuilderMetrics] Filtering properties by builder_id:', userId);
    propertiesQuery = propertiesQuery.eq('builder_id', userId);
  } else {
    console.log('[getBuilderMetrics] Admin user - fetching all properties');
  }
  
  console.log('[getBuilderMetrics] Executing properties query...');
  const { data: properties, error: propertiesError } = await propertiesQuery;
  
  if (propertiesError) {
    console.error('[getBuilderMetrics] Error fetching properties:', {
      message: propertiesError.message,
      code: propertiesError.code,
      details: propertiesError.details,
      hint: propertiesError.hint
    });
    // Continue with empty array instead of failing
  } else {
    console.log('[getBuilderMetrics] Properties fetched successfully:', properties?.length || 0, 'properties');
  }
  
  // Ensure we have arrays even if queries failed
  const safeLeads = leads || [];
  const safeProperties = properties || [];
  console.log('[getBuilderMetrics] Safe arrays - Leads:', safeLeads.length, 'Properties:', safeProperties.length);

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
    console.log('[getBuilderMetrics] Fetching revenue data...');
    let revenueQuery = supabase
      .from('revenue')
      .select('*')
      .order('date', { ascending: false })
      .limit(30)
    
    if (!isAdmin) {
      console.log('[getBuilderMetrics] Filtering revenue by builder_id:', userId);
      revenueQuery = revenueQuery.eq('builder_id', userId);
    } else {
      console.log('[getBuilderMetrics] Admin user - fetching all revenue data');
    }
    
    const { data: revenueData, error: revenueError } = await revenueQuery;
    if (revenueError) {
      throw revenueError;
    }
    revenue = revenueData || [];
    console.log('[getBuilderMetrics] Revenue data fetched:', revenue.length, 'records');
  } catch (error: any) {
    // Revenue table might not exist, use empty array
    console.warn('[getBuilderMetrics] Revenue table not available or query failed:', {
      message: error.message,
      code: error.code
    });
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
  console.log('[getBuilderMetrics] Calculating trends...');
  const leadTrends = calculateTrends(safeLeads, 'created_at');
  const revenueTrends = revenue?.map((r: any) => ({
    date: r.date,
    revenue: r.amount || 0
  })) || [];
  console.log('[getBuilderMetrics] Trends calculated - Lead trends:', leadTrends.length, 'Revenue trends:', revenueTrends.length);

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

  const result = {
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
  
  console.log('[getBuilderMetrics] Final metrics calculated:', {
    total_leads: result.total_leads,
    total_properties: result.total_properties,
    conversion_rate: result.conversion_rate.toFixed(2) + '%',
    lead_trends_count: result.lead_trends.length,
    property_performance_count: result.property_performance.length
  });
  
  return result;
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
  console.log('[generateAIInsights] Starting AI insights generation...');
  try {
    const openai = getOpenAIClient();
    
    if (!openai) {
      console.warn('[generateAIInsights] OpenAI client not available, returning fallback insights');
      return {
        keyFindings: [
          `You have ${metrics.total_leads} total leads with ${metrics.hot_leads} hot leads requiring immediate attention.`,
          `Your conversion rate is ${metrics.conversion_rate.toFixed(1)}% - ${metrics.conversion_rate > 15 ? 'excellent' : 'needs improvement'}.`,
          `Active properties: ${metrics.active_properties} out of ${metrics.total_properties} total properties.`
        ],
        performanceSummary: `Your dashboard shows ${metrics.total_leads} leads with ${metrics.hot_leads} high-priority opportunities. Conversion rate is ${metrics.conversion_rate.toFixed(1)}%.`,
        trendAnalysis: metrics.lead_trends.length > 0 
          ? `Lead generation trends show activity over the past ${metrics.lead_trends.length} days.`
          : 'Insufficient data for trend analysis.',
        opportunities: [
          metrics.hot_leads > 0 ? `Focus on ${metrics.hot_leads} hot leads for immediate conversion.` : 'Build lead pipeline through marketing efforts.',
          metrics.conversion_rate < 10 ? 'Improve lead nurturing to increase conversion rate.' : 'Maintain current conversion strategies.'
        ],
        risks: metrics.total_leads === 0 
          ? ['No leads in pipeline - urgent action needed to generate leads.'] 
          : []
      };
    }
    
    console.log('[generateAIInsights] OpenAI client available, generating insights...');
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
    console.log('[generateAIInsights] OpenAI insights generated successfully');
    return result;
  } catch (error: any) {
    console.error('[generateAIInsights] OpenAI error:', {
      message: error.message,
      name: error.name,
      status: error.status,
      code: error.code
    });
    // Return meaningful fallback insights based on metrics
    return {
      keyFindings: [
        `You have ${metrics.total_leads} total leads with ${metrics.hot_leads} hot leads requiring immediate attention.`,
        `Your conversion rate is ${metrics.conversion_rate.toFixed(1)}% - ${metrics.conversion_rate > 15 ? 'excellent' : 'needs improvement'}.`,
        `Active properties: ${metrics.active_properties} out of ${metrics.total_properties} total properties.`
      ],
      performanceSummary: `Your dashboard shows ${metrics.total_leads} leads with ${metrics.hot_leads} high-priority opportunities. Conversion rate is ${metrics.conversion_rate.toFixed(1)}%.`,
      trendAnalysis: metrics.lead_trends.length > 0 
        ? `Lead generation trends show activity over the past ${metrics.lead_trends.length} days.`
        : 'Insufficient data for trend analysis.',
      opportunities: [
        metrics.hot_leads > 0 ? `Focus on ${metrics.hot_leads} hot leads for immediate conversion.` : 'Build lead pipeline through marketing efforts.',
        metrics.conversion_rate < 10 ? 'Improve lead nurturing to increase conversion rate.' : 'Maintain current conversion strategies.'
      ],
      risks: metrics.total_leads === 0 
        ? ['No leads in pipeline - urgent action needed to generate leads.'] 
        : []
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
  console.log('[generateRecommendations] Starting recommendations generation...');
  try {
    const openai = getOpenAIClient();
    
    if (!openai) {
      console.warn('[generateRecommendations] OpenAI client not available, returning fallback recommendations');
      return getFallbackRecommendations(metrics, anomalies);
    }
    
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
    console.log('[generateRecommendations] OpenAI recommendations generated:', result.recommendations?.length || 0);
    return result.recommendations || [];
  } catch (error: any) {
    console.error('[generateRecommendations] Error:', {
      message: error.message,
      name: error.name,
      status: error.status
    });
    // Fallback recommendations
    return getFallbackRecommendations(metrics, anomalies);
  }
}

function getFallbackRecommendations(metrics: DashboardMetrics, anomalies: any[]): any[] {
  const recommendations: any[] = [];
  
  if (metrics.hot_leads > 0) {
    recommendations.push({
      title: 'Focus on Hot Leads',
      description: `You have ${metrics.hot_leads} hot leads. Prioritize immediate follow-up.`,
      priority: 'high',
      category: 'leads',
      impact: 'High conversion potential',
      effort: 'low'
    });
  }
  
  if (metrics.conversion_rate < 10) {
    recommendations.push({
      title: 'Improve Conversion Rate',
      description: `Current conversion rate is ${metrics.conversion_rate.toFixed(1)}%. Implement lead nurturing.`,
      priority: 'medium',
      category: 'leads',
      impact: 'Increase revenue from existing leads',
      effort: 'medium'
    });
  }
  
  if (metrics.total_leads === 0) {
    recommendations.push({
      title: 'Generate More Leads',
      description: 'No leads in pipeline. Focus on marketing and lead generation.',
      priority: 'high',
      category: 'leads',
      impact: 'Build sales pipeline',
      effort: 'high'
    });
  }
  
  if (metrics.active_properties < metrics.total_properties) {
    recommendations.push({
      title: 'Activate More Properties',
      description: `${metrics.total_properties - metrics.active_properties} properties are inactive. Review and activate them.`,
      priority: 'medium',
      category: 'properties',
      impact: 'Increase property visibility',
      effort: 'low'
    });
  }
  
  // Add anomaly-based recommendations
  anomalies.forEach(anomaly => {
    recommendations.push({
      title: anomaly.title,
      description: anomaly.recommendation,
      priority: anomaly.severity === 'high' ? 'high' : 'medium',
      category: 'operations',
      impact: 'Address performance issue',
      effort: 'medium'
    });
  });
  
  return recommendations.length > 0 ? recommendations : [
    {
      title: 'Monitor Dashboard Regularly',
      description: 'Keep track of your leads and properties to identify opportunities.',
      priority: 'low',
      category: 'operations',
      impact: 'Better decision making',
      effort: 'low'
    }
  ];
}
