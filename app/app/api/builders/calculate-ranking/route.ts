/**
 * Calculate Builder Ranking API
 * Calculates or recalculates AI-powered builder ranking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60;

const calculateRankingSchema = z.object({
  builder_id: z.string().uuid(),
  force_recalculate: z.boolean().default(false),
});

/**
 * Helper function to get builder rank position
 */
async function getBuilderRankPosition(builderId: string, supabase: ReturnType<typeof getSupabase>) {
  const { data: builderMetrics } = await supabase
    .from('builder_engagement_metrics')
    .select('overall_ai_ranking')
    .eq('builder_id', builderId)
    .single();

  if (!builderMetrics) return null;

  const { count } = await supabase
    .from('builder_engagement_metrics')
    .select('*', { count: 'exact', head: true })
    .gt('overall_ai_ranking', builderMetrics.overall_ai_ranking);

  return (count || 0) + 1;
}

/**
 * Helper function to get total active builders
 */
async function getTotalActiveBuilders(supabase: ReturnType<typeof getSupabase>) {
  const { count } = await supabase
    .from('builder_engagement_metrics')
    .select('*', { count: 'exact', head: true });

  return count || 0;
}

/**
 * POST /api/builders/calculate-ranking
 * Calculates or recalculates builder ranking
 */
export const POST = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = getSupabase();
    const body = await request.json();
    const validatedData = calculateRankingSchema.parse(body);

    try {
      // Check if recent calculation exists (< 24 hours)
      if (!validatedData.force_recalculate) {
        const { data: existingMetrics } = await supabase
          .from('builder_engagement_metrics')
          .select('overall_ai_ranking, last_calculated')
          .eq('builder_id', validatedData.builder_id)
          .single();

        if (existingMetrics && existingMetrics.last_calculated) {
          const hoursSinceCalc =
            (Date.now() - new Date(existingMetrics.last_calculated).getTime()) /
            (1000 * 60 * 60);

          if (hoursSinceCalc < 24) {
            // Return cached ranking
            const rankPosition = await getBuilderRankPosition(validatedData.builder_id, supabase);
            const totalBuilders = await getTotalActiveBuilders(supabase);

            return NextResponse.json({
              success: true,
              builder_id: validatedData.builder_id,
              ranking: {
                engagement_score: existingMetrics.engagement_score || 0,
                quality_score: existingMetrics.quality_score || 0,
                velocity_score: existingMetrics.velocity_score || 0,
                overall_ai_ranking: existingMetrics.overall_ai_ranking || 0,
              },
              rank_position: rankPosition,
              total_builders: totalBuilders,
              percentile: totalBuilders > 0 ? ((totalBuilders - (rankPosition || 0) + 1) / totalBuilders) * 100 : 0,
              cached: true,
            });
          }
        }
      }

      // Calculate fresh ranking using database function if available
      const { data: rankingResult, error: rpcError } = await supabase.rpc(
        'calculate_builder_ranking',
        { p_builder_id: validatedData.builder_id }
      );

      // If RPC function doesn't exist, calculate manually
      if (rpcError && rpcError.code === '42883') {
        // Function doesn't exist, calculate manually
        const calculationDate = new Date().toISOString().split('T')[0];

        // Get builder's property IDs
        const { data: builderProperties } = await supabase
          .from('properties')
          .select('id, views_count, favorites_count')
          .eq('builder_id', validatedData.builder_id)
          .eq('status', 'active');

        const propertyIds = builderProperties?.map((p) => p.id) || [];

        if (propertyIds.length === 0) {
          // No properties, return zero metrics
          const zeroMetrics = {
            builder_id: validatedData.builder_id,
            calculation_date: calculationDate,
            engagement_score: 0,
            quality_score: 0,
            velocity_score: 0,
            overall_ai_ranking: 0,
            last_calculated: new Date().toISOString(),
          };

          // Upsert zero metrics
          await supabase
            .from('builder_engagement_metrics')
            .upsert(zeroMetrics, { onConflict: 'builder_id' });

          return NextResponse.json({
            success: true,
            builder_id: validatedData.builder_id,
            ranking: {
              engagement_score: 0,
              quality_score: 0,
              velocity_score: 0,
              overall_ai_ranking: 0,
            },
            rank_position: null,
            total_builders: await getTotalActiveBuilders(supabase),
            percentile: 0,
          });
        }

        // Get engagement metrics
        const { data: propertyViews } = await supabase
          .from('property_views')
          .select('property_id, user_id, view_duration')
          .in('property_id', propertyIds)
          .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const { data: favorites } = await supabase
          .from('property_favorites')
          .select('property_id, user_id')
          .in('property_id', propertyIds);

        const { data: leads } = await supabase
          .from('leads')
          .select('id, score, status')
          .eq('builder_id', validatedData.builder_id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        // Calculate scores
        const totalViews = propertyViews?.length || 0;
        const uniqueViewers = new Set(propertyViews?.map((v) => v.user_id)).size;
        const totalFavorites = favorites?.length || 0;
        const totalLeads = leads?.length || 0;
        const qualifiedLeads = leads?.filter((l) => l.status === 'qualified' || l.status === 'hot').length || 0;

        // Engagement score (0-100)
        const engagementScore = Math.min(
          100,
          (totalViews * 0.1 + uniqueViewers * 2 + totalFavorites * 5 + totalLeads * 10) / 10
        );

        // Quality score (based on lead quality and property engagement)
        const avgLeadScore = leads && leads.length > 0
          ? leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length
          : 0;
        const qualityScore = Math.min(100, (avgLeadScore * 0.5 + (qualifiedLeads / Math.max(totalLeads, 1)) * 50));

        // Velocity score (based on recent activity)
        const velocityScore = Math.min(100, (totalLeads * 2 + qualifiedLeads * 5));

        // Overall ranking (weighted average)
        const overallRanking = engagementScore * 0.4 + qualityScore * 0.4 + velocityScore * 0.2;

        const metrics = {
          builder_id: validatedData.builder_id,
          calculation_date: calculationDate,
          engagement_score: Math.round(engagementScore * 100) / 100,
          quality_score: Math.round(qualityScore * 100) / 100,
          velocity_score: Math.round(velocityScore * 100) / 100,
          overall_ai_ranking: Math.round(overallRanking * 100) / 100,
          last_calculated: new Date().toISOString(),
        };

        // Upsert metrics
        const { error: upsertError } = await supabase
          .from('builder_engagement_metrics')
          .upsert(metrics, { onConflict: 'builder_id' });

        if (upsertError) {
          console.error('[Calculate Ranking] Upsert error:', upsertError);
          return NextResponse.json(
            { success: false, error: 'Failed to save ranking metrics' },
            { status: 500 }
          );
        }

        const rankPosition = await getBuilderRankPosition(validatedData.builder_id, supabase);
        const totalBuilders = await getTotalActiveBuilders(supabase);

        return NextResponse.json({
          success: true,
          builder_id: validatedData.builder_id,
          ranking: {
            engagement_score: metrics.engagement_score,
            quality_score: metrics.quality_score,
            velocity_score: metrics.velocity_score,
            overall_ai_ranking: metrics.overall_ai_ranking,
          },
          rank_position: rankPosition,
          total_builders: totalBuilders,
          percentile: totalBuilders > 0 ? ((totalBuilders - (rankPosition || 0) + 1) / totalBuilders) * 100 : 0,
        });
      }

      if (rpcError) {
        console.error('[Calculate Ranking] RPC error:', rpcError);
        return NextResponse.json(
          { success: false, error: 'Failed to calculate ranking' },
          { status: 500 }
        );
      }

      // Fetch updated metrics
      const { data: updatedMetrics } = await supabase
        .from('builder_engagement_metrics')
        .select('*')
        .eq('builder_id', validatedData.builder_id)
        .single();

      if (!updatedMetrics) {
        return NextResponse.json(
          { success: false, error: 'Ranking calculation completed but metrics not found' },
          { status: 500 }
        );
      }

      const rankPosition = await getBuilderRankPosition(validatedData.builder_id, supabase);
      const totalBuilders = await getTotalActiveBuilders(supabase);

      return NextResponse.json({
        success: true,
        builder_id: validatedData.builder_id,
        ranking: {
          engagement_score: updatedMetrics.engagement_score || 0,
          quality_score: updatedMetrics.quality_score || 0,
          velocity_score: updatedMetrics.velocity_score || 0,
          overall_ai_ranking: updatedMetrics.overall_ai_ranking || 0,
        },
        rank_position: rankPosition,
        total_builders: totalBuilders,
        percentile: totalBuilders > 0 ? ((totalBuilders - (rankPosition || 0) + 1) / totalBuilders) * 100 : 0,
      });
    } catch (error: any) {
      console.error('[Calculate Ranking] Error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to calculate ranking' },
        { status: 500 }
      );
    }
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.PROPERTY_READ,
  }
);



































