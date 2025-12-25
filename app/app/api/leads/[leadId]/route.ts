// =============================================
// SINGLE LEAD DETAILS API - COMPLETE PROFILE
// GET /api/leads/[leadId]
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// =============================================
// TYPES
// =============================================
interface LeadDetailResponse {
  // Basic Info
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  last_login: string | null;
  
  // AI Scoring
  score: number;
  category: string;
  score_breakdown: Record<string, number>;
  score_history: Array<{
    score: number;
    timestamp: string;
    category: string;
  }>;
  
  // Preferences
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  preferred_property_type: string | null;
  additional_requirements: string | null;
  
  // Behavior Analytics
  behavior_summary: {
    total_sessions: number;
    total_views: number;
    total_time_spent: number; // seconds
    avg_session_duration: number;
    most_active_day: string;
    most_active_hour: number;
    device_breakdown: Record<string, number>;
  };
  
  // Property Interest
  viewed_properties: Array<{
    property_id: string;
    property_title: string;
    property_price: number;
    property_location: string;
    view_count: number;
    total_time_spent: number;
    first_viewed: string;
    last_viewed: string;
    engagement_score: number;
  }>;
  
  // Timeline
  activity_timeline: Array<{
    type: 'behavior' | 'interaction' | 'score_change';
    timestamp: string;
    description: string;
    metadata: Record<string, any>;
  }>;
  
  // Interactions with builder
  interactions: Array<{
    id: string;
    type: string;
    timestamp: string;
    status: string;
    notes: string | null;
    outcome: string | null;
    response_time: number | null;
  }>;
  
  // AI Recommendations
  recommendations: {
    suggested_properties: string[]; // Property IDs
    next_best_action: string;
    optimal_contact_time: string;
    conversion_probability: number;
  };
}

import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit';

// =============================================
// GET HANDLER
// =============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  // Use secureApiRoute wrapper for auth and rate limiting
  const handler = secureApiRoute(
    async (req: NextRequest, user) => {
    try {
    const cookieStore = cookies();
    const supabase = await createClient();
    
    // User is already authenticated via secureApiRoute
    // Verify user is a builder
    if (user.role !== 'builder' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Builders only' },
        { status: 403 }
      );
    }
    
    const { leadId } = params;
    
    // =============================================
    // FETCH LEAD DATA
    // =============================================
    
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        id,
        created_at,
        name,
        email,
        phone,
        message,
        score,
        builder_id,
        property_id,
        properties:property_id (
          id,
          title,
          location,
          price_inr
        )
      `)
      .eq('id', leadId)
      .eq('builder_id', user.id)
      .single();
    
    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    // Try to find user by email
    let userId: string | null = null;
    let userData: any = null;
    if (lead.email) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .eq('email', lead.email)
        .maybeSingle();
      userId = profileData?.id || null;
      
      // Get auth user data if exists
      if (userId) {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: { user: null } }));
        userData = authUser?.user || null;
      }
    }
    
    // =============================================
    // FETCH PREFERENCES
    // =============================================
    
    let preferences: any = null;
    if (userId) {
      const { data: prefData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      preferences = prefData;
    }
    
    // =============================================
    // FETCH ALL BEHAVIORS
    // =============================================
    
    let behaviors: any[] = [];
    if (userId) {
      const { data: behaviorData } = await supabase
        .from('user_behavior')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });
      behaviors = behaviorData || [];
    }
    
    // =============================================
    // ANALYZE BEHAVIOR PATTERNS
    // =============================================
    
    // Session counting (group by session_id)
    const sessions = new Set(behaviors?.map(b => b.session_id).filter(Boolean)).size;
    const totalViews = behaviors?.filter(b => b.behavior_type === 'property_view').length || 0;
    const totalTimeSpent = behaviors?.reduce((sum, b) => sum + (b.duration || 0), 0) || 0;
    const avgSessionDuration = sessions > 0 ? totalTimeSpent / sessions : 0;
    
    // Most active day of week
    const dayCount: Record<string, number> = {};
    behaviors?.forEach(b => {
      const day = new Date(b.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    const mostActiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    // Most active hour
    const hourCount: Record<number, number> = {};
    behaviors?.forEach(b => {
      const hour = new Date(b.timestamp).getHours();
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    });
    const mostActiveHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
    
    // Device breakdown
    const deviceBreakdown: Record<string, number> = {};
    behaviors?.forEach(b => {
      if (b.device_type) {
        deviceBreakdown[b.device_type] = (deviceBreakdown[b.device_type] || 0) + 1;
      }
    });
    
    const behaviorSummary = {
      total_sessions: sessions,
      total_views: totalViews,
      total_time_spent: totalTimeSpent,
      avg_session_duration: avgSessionDuration,
      most_active_day: mostActiveDay,
      most_active_hour: parseInt(mostActiveHour as any),
      device_breakdown: deviceBreakdown,
    };
    
    // =============================================
    // FETCH VIEWED PROPERTIES WITH DETAILS
    // =============================================
    
    const propertyViews = new Map<string, {
      count: number;
      total_time: number;
      first_viewed: string;
      last_viewed: string;
    }>();
    
    behaviors?.forEach(b => {
      if (b.behavior_type === 'property_view' && b.property_id) {
        const existing = propertyViews.get(b.property_id) || {
          count: 0,
          total_time: 0,
          first_viewed: b.timestamp,
          last_viewed: b.timestamp,
        };
        
        propertyViews.set(b.property_id, {
          count: existing.count + 1,
          total_time: existing.total_time + (b.duration || 0),
          first_viewed: b.timestamp < existing.first_viewed ? b.timestamp : existing.first_viewed,
          last_viewed: b.timestamp > existing.last_viewed ? b.timestamp : existing.last_viewed,
        });
      }
    });
    
    const propertyIds = Array.from(propertyViews.keys());
    let viewedProperties: any[] = [];
    if (propertyIds.length > 0) {
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, price_inr, location')
        .in('id', propertyIds);
      
      viewedProperties = properties?.map(prop => {
        const views = propertyViews.get(prop.id)!;
        const engagementScore = Math.min(
          (views.count * 2) + (views.total_time / 60) * 0.5,
          10
        );
        
        return {
          property_id: prop.id,
          property_title: prop.title,
          property_price: prop.price_inr || 0,
          property_location: prop.location || '',
          view_count: views.count,
          total_time_spent: views.total_time,
          first_viewed: views.first_viewed,
          last_viewed: views.last_viewed,
          engagement_score: parseFloat(engagementScore.toFixed(2)),
        };
      }).sort((a, b) => b.engagement_score - a.engagement_score) || [];
    }
    
    // =============================================
    // FETCH INTERACTIONS
    // =============================================
    
    const { data: interactions } = await supabase
      .from('lead_interactions')
      .select('*')
      .eq('lead_id', leadId)
      .eq('builder_id', user.id)
      .order('timestamp', { ascending: false });
    
    const formattedInteractions = interactions?.map(interaction => ({
      id: interaction.id,
      type: interaction.interaction_type,
      timestamp: interaction.timestamp,
      status: interaction.status,
      notes: interaction.notes,
      outcome: interaction.outcome,
      response_time: interaction.response_time_minutes,
    })) || [];
    
    // =============================================
    // BUILD ACTIVITY TIMELINE
    // =============================================
    
    const timeline: LeadDetailResponse['activity_timeline'] = [];
    
    // Add behaviors to timeline
    behaviors?.forEach(behavior => {
      timeline.push({
        type: 'behavior',
        timestamp: behavior.timestamp,
        description: `${behavior.behavior_type.replace(/_/g, ' ')}`,
        metadata: {
          behavior_type: behavior.behavior_type,
          property_id: behavior.property_id,
          duration: behavior.duration,
          device: behavior.device_type,
        },
      });
    });
    
    // Add interactions to timeline
    interactions?.forEach(interaction => {
      timeline.push({
        type: 'interaction',
        timestamp: interaction.timestamp,
        description: `Builder ${interaction.interaction_type.replace(/_/g, ' ')}`,
        metadata: {
          interaction_type: interaction.interaction_type,
          status: interaction.status,
          outcome: interaction.outcome,
        },
      });
    });
    
    // Add lead creation to timeline
    timeline.push({
      type: 'behavior',
      timestamp: lead.created_at,
      description: 'Lead created',
      metadata: {
        source: 'lead_form',
      },
    });
    
    // Sort timeline by timestamp
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // =============================================
    // GENERATE AI RECOMMENDATIONS
    // =============================================
    
    // Find similar properties based on viewed properties
    const viewedPropertyTypes = viewedProperties.map(p => p.property_location);
    const avgViewedPrice = viewedProperties.length > 0
      ? viewedProperties.reduce((sum, p) => sum + p.property_price, 0) / viewedProperties.length
      : preferences?.budget_max || 0;
    
    const { data: suggestedProps } = await supabase
      .from('properties')
      .select('id')
      .eq('builder_id', user.id)
      .gte('price_inr', avgViewedPrice * 0.8)
      .lte('price_inr', avgViewedPrice * 1.2)
      .limit(5);
    
    // Determine next best action
    const baseScore = lead.score || 5;
    let nextBestAction = 'Send introductory email';
    if (baseScore >= 8) {
      nextBestAction = 'Schedule urgent call - Hot lead!';
    } else if (baseScore >= 6) {
      nextBestAction = 'Send WhatsApp message with property recommendations';
    } else if (totalViews > 5 && formattedInteractions.length === 0) {
      nextBestAction = 'Send personalized email about viewed properties';
    }
    
    // Optimal contact time based on behavior
    const optimalContactTime = mostActiveHour 
      ? `${mostActiveHour}:00 - ${mostActiveHour + 1}:00 on ${mostActiveDay}`
      : 'Weekday mornings (10-11 AM)';
    
    // Conversion probability (simplified calculation)
    const conversionProbability = Math.min(
      (baseScore / 10) * 0.6 + 
      (totalViews / 20) * 0.2 + 
      (formattedInteractions.length / 5) * 0.2,
      1
    );
    
    const recommendations = {
      suggested_properties: suggestedProps?.map(p => p.id) || [],
      next_best_action: nextBestAction,
      optimal_contact_time: optimalContactTime,
      conversion_probability: parseFloat((conversionProbability * 100).toFixed(2)),
    };
    
    // Calculate score breakdown
    const scoreBreakdown = {
      budget_alignment: baseScore * 0.2,
      engagement: baseScore * 0.2,
      property_fit: baseScore * 0.2,
      time_investment: baseScore * 0.15,
      contact_intent: baseScore * 0.15,
      recency: baseScore * 0.1,
    };
    
    // Determine category
    let category = 'Low Quality';
    if (baseScore >= 9) category = 'Hot Lead';
    else if (baseScore >= 7) category = 'Warm Lead';
    else if (baseScore >= 5) category = 'Developing Lead';
    else if (baseScore >= 3) category = 'Cold Lead';
    
    // =============================================
    // BUILD RESPONSE
    // =============================================
    
    const response: LeadDetailResponse = {
      id: leadId,
      email: lead.email || '',
      full_name: lead.name || 'Unknown',
      phone: lead.phone || null,
      created_at: lead.created_at,
      last_login: userData?.last_sign_in_at || null,
      
      score: baseScore,
      category,
      score_breakdown: scoreBreakdown,
      score_history: [], // Can be populated if score_history table exists
      
      budget_min: preferences?.budget_min || null,
      budget_max: preferences?.budget_max || null,
      preferred_location: preferences?.preferred_location || null,
      preferred_property_type: preferences?.preferred_property_type || null,
      additional_requirements: preferences?.additional_requirements || null,
      
      behavior_summary: behaviorSummary,
      viewed_properties: viewedProperties,
      activity_timeline: timeline.slice(0, 50), // Limit to 50 most recent
      interactions: formattedInteractions,
      recommendations,
    };
    
    // Log audit event
    await logSecurityEvent(
      request,
      AuditActions.VIEW,
      AuditResourceTypes.LEAD,
      params.leadId,
      user.id
    );

    return NextResponse.json({
      success: true,
      data: response,
    });
    
  } catch (error) {
    console.error('[API/Lead/Details] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

