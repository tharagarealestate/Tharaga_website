/**
 * AI Feature Recommendations API
 * ML-powered feature recommendations based on user behavior
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateRecommendationReason } from '@/lib/services/openai-documentation-service';

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

    // Get user context
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

    // Get user's viewed features
    const { data: viewedFeatures } = await supabase
      .from('user_feature_interactions')
      .select('feature_key')
      .eq('user_id', user.id)
      .eq('interaction_type', 'viewed')
      .limit(20);

    const viewedFeatureKeys = viewedFeatures?.map(f => f.feature_key) || [];

    // Get user's completed tutorials
    const { data: completedTutorials } = await supabase
      .from('user_feature_interactions')
      .select('feature_key')
      .eq('user_id', user.id)
      .eq('interaction_type', 'tutorial_completed')
      .limit(20);

    const completedFeatureKeys = completedTutorials?.map(f => f.feature_key) || [];

    // Get all features (filtered by tier)
    const { data: allFeatures, error: featuresError } = await supabase
      .from('feature_documentation')
      .select('feature_key, feature_name, category, short_description, tier_required, is_ai_powered, is_new_feature')
      .in('tier_required', userTier === 'pro' ? ['free', 'pro'] : ['free'])
      .order('view_count', { ascending: false })
      .limit(50);

    if (featuresError) {
      console.error('Error fetching features:', featuresError);
      return NextResponse.json({ recommendations: [] });
    }

    // Filter out already viewed features
    const unviewedFeatures = (allFeatures || []).filter(
      f => !viewedFeatureKeys.includes(f.feature_key)
    );

    // Simple recommendation algorithm (can be enhanced with ML later)
    // Prioritize: new features > AI-powered > high view count > same category as viewed
    const recommendations = unviewedFeatures
      .map(feature => {
        let score = 0;
        
        // New features get high priority
        if (feature.is_new_feature) score += 100;
        
        // AI-powered features get priority
        if (feature.is_ai_powered) score += 50;
        
        // Same category as viewed features
        const viewedCategories = viewedFeatures
          ?.map(vf => allFeatures?.find(af => af.feature_key === vf.feature_key)?.category)
          .filter(Boolean) || [];
        if (viewedCategories.includes(feature.category)) score += 30;
        
        // Popular features (high view count)
        score += Math.min(20, (feature.view_count || 0) / 10);
        
        return { feature, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(async ({ feature }) => {
        // Generate AI-powered recommendation reason
        const { reason, confidence } = await generateRecommendationReason(
          {
            viewedFeatures: viewedFeatureKeys,
            completedTutorials: completedFeatureKeys,
            userRole: userRoleName,
            userTier,
          },
          {
            featureKey: feature.feature_key,
            featureName: feature.feature_name,
            category: feature.category,
          }
        );

        return {
          feature_key: feature.feature_key,
          feature_name: feature.feature_name,
          category: feature.category,
          short_description: feature.short_description,
          recommendation_reason: reason,
          confidence_score: confidence,
          is_ai_powered: feature.is_ai_powered,
          is_new_feature: feature.is_new_feature,
        };
      });

    const resolvedRecommendations = await Promise.all(recommendations);

    // Save recommendations to database (for tracking)
    if (resolvedRecommendations.length > 0) {
      await supabase
        .from('ai_feature_recommendations')
        .insert(
          resolvedRecommendations.map(rec => ({
            user_id: user.id,
            recommended_feature_key: rec.feature_key,
            recommendation_reason: rec.recommendation_reason,
            confidence_score: rec.confidence_score,
            recommendation_source: 'behavior_analysis',
            source_data: {
              viewed_features: viewedFeatureKeys.length,
              completed_tutorials: completedFeatureKeys.length,
            },
          }))
        );
    }

    return NextResponse.json({
      recommendations: resolvedRecommendations,
    });
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}


