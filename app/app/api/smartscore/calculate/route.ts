// =============================================
// SMARTSCORE CALCULATION API ROUTE
// POST /api/smartscore/calculate
// GET /api/smartscore/calculate?lead_ids=xxx,yyy
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================
// TYPES
// =============================================
interface CalculateScoreRequest {
  lead_ids: number[];
  force_recalculate?: boolean;
  notify_builders?: boolean;
}

interface SmartScoreResponse {
  lead_id: number;
  smartscore: number;
  conversion_probability: number;
  predicted_ltv: number;
  churn_risk?: number;
  priority_tier: string;
  next_best_action: string;
  optimal_contact_time: string;
  confidence_score?: number;
  ai_insights: {
    score_breakdown: {
      engagement: number;
      intent: number;
      profile: number;
      timing: number;
    };
    key_strengths?: string[];
    improvement_areas?: string[];
    behavioral_summary?: {
      property_views_30d: number;
      high_intent_actions: number;
      total_inquiries?: number;
    };
    recommendations?: string[];
  };
  model_version: string;
  scored_at: string;
}

// =============================================
// VALIDATION SCHEMA
// =============================================
const calculateScoreSchema = z.object({
  lead_ids: z.array(z.number()).min(1).max(100),
  force_recalculate: z.boolean().optional().default(false),
  notify_builders: z.boolean().optional().default(true)
});

// =============================================
// HELPER FUNCTIONS
// =============================================
async function callMLService(leadIds: number[]): Promise<SmartScoreResponse[]> {
  try {
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
    
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/smartscore/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.ML_SERVICE_API_KEY ? `Bearer ${process.env.ML_SERVICE_API_KEY}` : ''
      },
      body: JSON.stringify({
        lead_ids: leadIds,
        use_cached: false,
        cache_ttl_minutes: 30
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ML Service error:', errorText);
      throw new Error(`ML Service error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('ML Service call failed:', error);
    // Fallback: Use database function for scoring
    throw error;
  }
}

async function calculateUsingDBFunction(
  supabase: any,
  leadIds: number[]
): Promise<SmartScoreResponse[]> {
  const results: SmartScoreResponse[] = [];
  
  for (const leadId of leadIds) {
    try {
      const { data, error } = await supabase.rpc('calculate_smartscore_v2', {
        p_lead_id: leadId
      });
      
      if (error) {
        console.error(`Failed to calculate score for lead ${leadId}:`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        const scoreData = data[0];
        results.push({
          lead_id: leadId,
          smartscore: parseFloat(scoreData.smartscore || 0),
          conversion_probability: parseFloat(scoreData.conversion_probability || 0),
          predicted_ltv: parseFloat(scoreData.predicted_ltv || 0),
          churn_risk: 0,
          priority_tier: scoreData.priority_tier || 'standard',
          next_best_action: scoreData.next_best_action || 'nurture_sequence',
          optimal_contact_time: scoreData.optimal_contact_time || new Date().toISOString(),
          confidence_score: 0.8,
          ai_insights: scoreData.ai_insights || {
            score_breakdown: {
              engagement: 0,
              intent: 0,
              profile: 0,
              timing: 0
            }
          },
          model_version: 'v2.0_db',
          scored_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(`Error calculating score for lead ${leadId}:`, err);
    }
  }
  
  return results;
}

async function saveScoresToDatabase(
  supabase: any,
  scores: SmartScoreResponse[]
): Promise<void> {
  try {
    // Update leads table with new scores
    for (const score of scores) {
      await supabase
        .from('leads')
        .update({
          smartscore_v2: score.smartscore,
          conversion_probability: score.conversion_probability,
          predicted_ltv: score.predicted_ltv,
          priority_tier: score.priority_tier,
          next_best_action: score.next_best_action,
          optimal_contact_time: score.optimal_contact_time,
          ai_insights: score.ai_insights,
          smartscore_updated_at: new Date().toISOString()
        })
        .eq('id', score.lead_id);
      
      // Insert into score history
      await supabase
        .from('smartscore_history')
        .insert({
          lead_id: score.lead_id,
          score_version: 'v2.0',
          score_value: score.smartscore,
          conversion_probability: score.conversion_probability,
          score_factors: score.ai_insights.score_breakdown,
          features_used: score.ai_insights.behavioral_summary || {},
          model_version: score.model_version,
          created_at: score.scored_at
        });
    }
    
    console.log(`✅ Saved ${scores.length} scores to database`);
  } catch (error) {
    console.error('Database save failed:', error);
    throw error;
  }
}

async function notifyBuilders(
  supabase: any,
  scores: SmartScoreResponse[]
): Promise<void> {
  try {
    // Get hot leads (score >= 70) with builder info
    const hotLeads = scores.filter(s => s.smartscore >= 70);
    
    if (hotLeads.length === 0) return;
    
    for (const score of hotLeads) {
      // Fetch lead with builder details
      const { data: lead } = await supabase
        .from('leads')
        .select('id, builder_id, property_id, properties:property_id(title)')
        .eq('id', score.lead_id)
        .maybeSingle();
      
      if (!lead || !lead.builder_id) continue;
      
      // Create notification (if notifications table exists)
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: lead.builder_id,
            type: 'hot_lead_alert',
            title: '🔥 Hot Lead Alert!',
            message: `Lead scored ${score.smartscore.toFixed(1)}/100`,
            metadata: {
              lead_id: score.lead_id,
              smartscore: score.smartscore,
              next_action: score.next_best_action
            },
            priority: 'high',
            read: false,
            created_at: new Date().toISOString()
          });
      } catch (notifError) {
        // Notifications table might not exist, skip
        console.warn('Notifications table not available:', notifError);
      }
    }
    
    console.log(`✅ Notified builders about ${hotLeads.length} hot leads`);
  } catch (error) {
    console.error('Builder notification failed:', error);
  }
}

// =============================================
// POST API ROUTE HANDLER
// =============================================
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validatedData = calculateScoreSchema.parse(body);
    const { lead_ids, force_recalculate = false, notify_builders = true } = validatedData;
    
    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has permission (builder or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    
    if (!profile || !['builder', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Fetch leads to verify ownership
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, builder_id')
      .in('id', lead_ids);
    
    if (leadsError) {
      throw leadsError;
    }
    
    // Filter leads owned by user
    const ownedLeadIds = leads
      ?.filter(lead => lead.builder_id === user.id || profile.role === 'admin')
      .map(lead => lead.id) || [];
    
    if (ownedLeadIds.length === 0) {
      return NextResponse.json(
        { error: 'No accessible leads found' },
        { status: 404 }
      );
    }
    
    // Check for recent scores (if not force recalculating)
    let scoresNeedingCalculation = ownedLeadIds;
    const cachedScores: SmartScoreResponse[] = [];
    
    if (!force_recalculate) {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data: recentScores } = await supabase
        .from('smartscore_history')
        .select('lead_id, score_value, conversion_probability, predicted_ltv, ai_insights, created_at')
        .in('lead_id', ownedLeadIds)
        .gte('created_at', thirtyMinutesAgo)
        .order('created_at', { ascending: false });
      
      if (recentScores && recentScores.length > 0) {
        // Group by lead_id and get latest
        const latestScores = new Map();
        for (const score of recentScores) {
          if (!latestScores.has(score.lead_id)) {
            latestScores.set(score.lead_id, score);
          }
        }
        
        // Use cached scores for these leads
        const cachedLeadIds = Array.from(latestScores.keys());
        scoresNeedingCalculation = ownedLeadIds.filter(id => !cachedLeadIds.includes(id));
        
        // Build cached responses
        for (const [leadId, scoreData] of latestScores) {
          cachedScores.push({
            lead_id: leadId,
            smartscore: parseFloat(scoreData.score_value || 0),
            conversion_probability: parseFloat(scoreData.conversion_probability || 0),
            predicted_ltv: parseFloat(scoreData.predicted_ltv || 0),
            churn_risk: 0,
            priority_tier: parseFloat(scoreData.score_value || 0) >= 80 ? 'platinum' : 
                          parseFloat(scoreData.score_value || 0) >= 60 ? 'gold' : 'silver',
            next_best_action: 'Follow up with personalized message',
            optimal_contact_time: new Date(Date.now() + 3600000).toISOString(),
            confidence_score: 0.85,
            ai_insights: scoreData.ai_insights || {
              score_breakdown: { engagement: 0, intent: 0, profile: 0, timing: 0 }
            },
            model_version: 'v2.0_cached',
            scored_at: scoreData.created_at
          });
        }
        
        // If all scores are cached, return them
        if (scoresNeedingCalculation.length === 0) {
          return NextResponse.json({
            success: true,
            scores: cachedScores,
            cached: true,
            calculated_count: 0
          });
        }
      }
    }
    
    // Calculate new scores - try ML service first, fallback to DB function
    let newScores: SmartScoreResponse[] = [];
    
    try {
      newScores = await callMLService(scoresNeedingCalculation);
    } catch (mlError) {
      console.warn('ML Service unavailable, using DB function:', mlError);
      newScores = await calculateUsingDBFunction(supabase, scoresNeedingCalculation);
    }
    
    // Save to database
    if (newScores.length > 0) {
      await saveScoresToDatabase(supabase, newScores);
      
      // Notify builders if requested
      if (notify_builders) {
        await notifyBuilders(supabase, newScores);
      }
    }
    
    // Combine cached and new scores
    const allScores = [...cachedScores, ...newScores];
    
    return NextResponse.json({
      success: true,
      scores: allScores,
      cached: cachedScores.length > 0,
      calculated_count: newScores.length,
      total_requested: lead_ids.length
    });
    
  } catch (error) {
    console.error('SmartScore calculation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to calculate SmartScore',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// =============================================
// GET ROUTE - Fetch existing scores
// =============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadIdsParam = searchParams.get('lead_ids');
    
    if (!leadIdsParam) {
      return NextResponse.json(
        { error: 'lead_ids parameter required' },
        { status: 400 }
      );
    }
    
    const leadIds = leadIdsParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    
    if (leadIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid lead_ids' },
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
    
    // Fetch latest scores from leads table
    const { data: leads, error } = await supabase
      .from('leads')
      .select(`
        id,
        smartscore_v2,
        conversion_probability,
        predicted_ltv,
        priority_tier,
        next_best_action,
        optimal_contact_time,
        ai_insights,
        smartscore_updated_at
      `)
      .in('id', leadIds);
    
    if (error) throw error;
    
    // Format scores for response
    const scores = (leads || []).map(lead => ({
      lead_id: lead.id,
      smartscore: parseFloat(lead.smartscore_v2 || 0),
      conversion_probability: parseFloat(lead.conversion_probability || 0),
      predicted_ltv: parseFloat(lead.predicted_ltv || 0),
      churn_risk: 0,
      priority_tier: lead.priority_tier || 'standard',
      next_best_action: lead.next_best_action || '',
      optimal_contact_time: lead.optimal_contact_time || new Date().toISOString(),
      confidence_score: 0.8,
      ai_insights: lead.ai_insights || {
        score_breakdown: { engagement: 0, intent: 0, profile: 0, timing: 0 }
      },
      model_version: 'v2.0',
      scored_at: lead.smartscore_updated_at || new Date().toISOString()
    }));
    
    return NextResponse.json({
      success: true,
      scores
    });
    
  } catch (error) {
    console.error('Fetch scores error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}

