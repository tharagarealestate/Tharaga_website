/**
 * Builder Ranking API
 * Calculates and returns AI-powered builder rankings based on engagement metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'edge';
export const maxDuration = 30;

/**
 * Calculate builder engagement metrics and ranking scores
 */
async function calculateBuilderMetrics(builderId: string, supabase: ReturnType<typeof getSupabase>) {
  const calculationDate = new Date().toISOString().split('T')[0];
  
  // Get builder's property IDs first
  const { data: builderProperties } = await supabase
    .from('properties')
    .select('id')
    .eq('builder_id', builderId)
    .eq('status', 'active');
  
  const propertyIds = builderProperties?.map(p => p.id) || [];
  
  if (propertyIds.length === 0) {
    // No properties, return zero metrics
    return {
      builder_id: builderId,
      calculation_date: calculationDate,
      total_property_views: 0,
      unique_viewers: 0,
      avg_time_on_property_page_sec: 0,
      property_favorites_count: 0,
      property_inquiries_count: 0,
      total_leads_received: 0,
      qualified_leads_count: 0,
      hot_leads_count: 0,
      avg_lead_score: 0,
      site_visits_scheduled: 0,
      site_visits_completed: 0,
      conversions_count: 0,
      conversion_rate: 0,
      active_properties_count: 0,
      featured_properties_count: 0,
      avg_property_views_per_listing: 0,
      avg_inquiries_per_listing: 0,
      engagement_score: 0,
      quality_score: 0,
      performance_score: 0,
      overall_ranking_score: 0,
      score_breakdown: {
        engagement: 0,
        quality: 0,
        performance: 0,
      },
    };
  }
  
  // Get property views
  const { data: propertyViews } = await supabase
    .from('property_views')
    .select('property_id, user_id, view_duration')
    .in('property_id', propertyIds)
    .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  // Get property favorites
  const { data: favorites } = await supabase
    .from('property_favorites')
    .select('property_id, user_id')
    .in('property_id', propertyIds);
  
  // Get inquiries
  const { data: inquiries } = await supabase
    .from('property_inquiries')
    .select('property_id, buyer_id, status')
    .eq('builder_id', builderId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  // Get leads
  const { data: leads } = await supabase
    .from('leads')
    .select('id, score, status, builder_id')
    .eq('builder_id', builderId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  // Get site visits
  const { data: siteVisits } = await supabase
    .from('site_visits')
    .select('id, status, builder_id')
    .eq('builder_id', builderId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  // Get active properties
  const { data: properties } = await supabase
    .from('properties')
    .select('id, status, featured')
    .eq('builder_id', builderId)
    .eq('status', 'active');
  
  // Calculate metrics
  const totalPropertyViews = propertyViews?.length || 0;
  const uniqueViewers = new Set(propertyViews?.map(v => v.user_id).filter(Boolean)).size;
  const avgTimeOnPage = propertyViews?.reduce((sum, v) => sum + (v.view_duration || 0), 0) / (totalPropertyViews || 1);
  const propertyFavoritesCount = favorites?.length || 0;
  const propertyInquiriesCount = inquiries?.length || 0;
  
  const totalLeadsReceived = leads?.length || 0;
  const qualifiedLeadsCount = leads?.filter(l => l.score && l.score >= 7).length || 0;
  const hotLeadsCount = leads?.filter(l => l.score && l.score >= 9).length || 0;
  const avgLeadScore = leads?.reduce((sum, l) => sum + (l.score || 0), 0) / (totalLeadsReceived || 1);
  
  const siteVisitsScheduled = siteVisits?.filter(s => s.status === 'scheduled' || s.status === 'confirmed').length || 0;
  const siteVisitsCompleted = siteVisits?.filter(s => s.status === 'completed').length || 0;
  const conversionsCount = leads?.filter(l => l.status === 'converted').length || 0;
  const conversionRate = totalLeadsReceived > 0 ? (conversionsCount / totalLeadsReceived) * 100 : 0;
  
  const activePropertiesCount = properties?.length || 0;
  const featuredPropertiesCount = properties?.filter(p => p.featured).length || 0;
  const avgPropertyViewsPerListing = activePropertiesCount > 0 ? totalPropertyViews / activePropertiesCount : 0;
  const avgInquiriesPerListing = activePropertiesCount > 0 ? propertyInquiriesCount / activePropertiesCount : 0;
  
  // Calculate scores (0-100)
  const engagementScore = Math.min(100, (
    (totalPropertyViews * 0.1) +
    (uniqueViewers * 2) +
    (propertyFavoritesCount * 5) +
    (propertyInquiriesCount * 10) +
    (avgTimeOnPage / 10)
  ));
  
  const qualityScore = Math.min(100, (
    (avgLeadScore * 10) +
    (qualifiedLeadsCount * 2) +
    (hotLeadsCount * 5) +
    (conversionRate * 2)
  ));
  
  const performanceScore = Math.min(100, (
    (activePropertiesCount * 2) +
    (featuredPropertiesCount * 5) +
    (avgPropertyViewsPerListing * 0.5) +
    (avgInquiriesPerListing * 10) +
    (conversionRate * 3)
  ));
  
  // Overall ranking score (weighted average)
  const overallRankingScore = (
    engagementScore * 0.4 +
    qualityScore * 0.35 +
    performanceScore * 0.25
  );
  
  return {
    builder_id: builderId,
    calculation_date: calculationDate,
    total_property_views: totalPropertyViews,
    unique_viewers: uniqueViewers,
    avg_time_on_property_page_sec: avgTimeOnPage,
    property_favorites_count: propertyFavoritesCount,
    property_inquiries_count: propertyInquiriesCount,
    total_leads_received: totalLeadsReceived,
    qualified_leads_count: qualifiedLeadsCount,
    hot_leads_count: hotLeadsCount,
    avg_lead_score: avgLeadScore,
    site_visits_scheduled: siteVisitsScheduled,
    site_visits_completed: siteVisitsCompleted,
    conversions_count: conversionsCount,
    conversion_rate: conversionRate,
    active_properties_count: activePropertiesCount,
    featured_properties_count: featuredPropertiesCount,
    avg_property_views_per_listing: avgPropertyViewsPerListing,
    avg_inquiries_per_listing: avgInquiriesPerListing,
    engagement_score: Math.round(engagementScore * 100) / 100,
    quality_score: Math.round(qualityScore * 100) / 100,
    performance_score: Math.round(performanceScore * 100) / 100,
    overall_ranking_score: Math.round(overallRankingScore * 100) / 100,
    score_breakdown: {
      engagement: engagementScore,
      quality: qualityScore,
      performance: performanceScore,
    },
  };
}

/**
 * GET /api/builders/ranking
 * Get builder rankings with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const city = searchParams.get('city');
    const minScore = parseFloat(searchParams.get('min_score') || '0');
    
    // Get all active builders
    let buildersQuery = supabase
      .from('builders')
      .select('id, name, logo_url, reputation_score, total_projects, reviews_count')
      .limit(limit)
      .offset(offset);
    
    if (city) {
      // Filter builders by city (through their properties)
      const { data: cityProperties } = await supabase
        .from('properties')
        .select('builder_id')
        .eq('city', city)
        .eq('status', 'active');
      
      if (cityProperties && cityProperties.length > 0) {
        const uniqueBuilderIds = [...new Set(cityProperties.map(p => p.builder_id).filter(Boolean))];
        if (uniqueBuilderIds.length > 0) {
          buildersQuery = buildersQuery.in('id', uniqueBuilderIds);
        } else {
          return NextResponse.json({ builders: [], total: 0 });
        }
      } else {
        return NextResponse.json({ builders: [], total: 0 });
      }
    }
    
    const { data: builders, error: buildersError } = await buildersQuery;
    
    if (buildersError) {
      return NextResponse.json(
        { error: buildersError.message },
        { status: 500 }
      );
    }
    
    if (!builders || builders.length === 0) {
      return NextResponse.json({ builders: [], total: 0 });
    }
    
    // Calculate metrics for each builder
    const buildersWithMetrics = await Promise.all(
      builders.map(async (builder) => {
        const metrics = await calculateBuilderMetrics(builder.id, supabase);
        
        // Get or create engagement metrics record
        const { data: existingMetrics } = await supabase
          .from('builder_engagement_metrics')
          .select('*')
          .eq('builder_id', builder.id)
          .eq('calculation_date', metrics.calculation_date)
          .single();
        
        if (existingMetrics) {
          // Update existing record
          await supabase
            .from('builder_engagement_metrics')
            .update({
              ...metrics,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingMetrics.id);
        } else {
          // Insert new record
          await supabase
            .from('builder_engagement_metrics')
            .insert([metrics]);
        }
        
        return {
          ...builder,
          metrics: {
            engagement_score: metrics.engagement_score,
            quality_score: metrics.quality_score,
            performance_score: metrics.performance_score,
            overall_ranking_score: metrics.overall_ranking_score,
            total_property_views: metrics.total_property_views,
            total_leads_received: metrics.total_leads_received,
            conversion_rate: metrics.conversion_rate,
            active_properties_count: metrics.active_properties_count,
          },
        };
      })
    );
    
    // Sort by overall ranking score
    buildersWithMetrics.sort((a, b) => 
      (b.metrics?.overall_ranking_score || 0) - (a.metrics?.overall_ranking_score || 0)
    );
    
    // Filter by min_score
    const filteredBuilders = buildersWithMetrics.filter(
      b => (b.metrics?.overall_ranking_score || 0) >= minScore
    );
    
    // Add ranking positions
    const rankedBuilders = filteredBuilders.map((builder, index) => ({
      ...builder,
      ranking_position: index + 1,
    }));
    
    return NextResponse.json({
      builders: rankedBuilders,
      total: rankedBuilders.length,
      calculated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Builder Ranking] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate builder rankings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/builders/ranking/calculate
 * Force recalculation of builder rankings
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const builderId = body.builder_id;
    
    if (!builderId) {
      return NextResponse.json(
        { error: 'builder_id is required' },
        { status: 400 }
      );
    }
    
    const metrics = await calculateBuilderMetrics(builderId, supabase);
    
    // Upsert metrics
    const { data: existingMetrics } = await supabase
      .from('builder_engagement_metrics')
      .select('id')
      .eq('builder_id', builderId)
      .eq('calculation_date', metrics.calculation_date)
      .single();
    
    if (existingMetrics) {
      await supabase
        .from('builder_engagement_metrics')
        .update({
          ...metrics,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMetrics.id);
    } else {
      await supabase
        .from('builder_engagement_metrics')
        .insert([metrics]);
    }
    
    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error('[Builder Ranking Calculate] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate metrics' },
      { status: 500 }
    );
  }
}

