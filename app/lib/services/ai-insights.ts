import { createClient } from '@supabase/supabase-js';

interface Insight {
  id: string;
  type: string;
  category: string;
  title: string;
  summary: string;
  detailedAnalysis?: string;
  confidenceScore: number;
  priority: string;
  recommendations: Array<{
    action: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
  }>;
  dataPoints: Record<string, any>;
  status: string;
  createdAt: string;
}

interface LeadPrediction {
  leadId: number;
  conversionProbability: number;
  predictedCloseDate?: string;
  predictedValue?: number;
  engagementScore: number;
  intentScore: number;
  fitScore: number;
  urgencyScore: number;
  positiveFactors: string[];
  negativeFactors: string[];
  nextBestAction: string;
  recommendedFollowUpDate?: string;
}

export class AIInsightsService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and service role key are required');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get active insights for a builder
   */
  async getInsights(
    builderId: string,
    options: {
      category?: string;
      priority?: string;
      limit?: number;
    } = {}
  ): Promise<Insight[]> {
    const { category, priority, limit = 10 } = options;

    let query = this.supabase
      .from('ai_insights')
      .select('*')
      .eq('builder_id', builderId)
      .eq('status', 'active')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) query = query.eq('category', category);
    if (priority) query = query.eq('priority', priority);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(this.mapInsight);
  }

  /**
   * Predict lead score and persist prediction
   */
  async predictLeadScore(leadId: number): Promise<LeadPrediction> {
    const { data: lead, error } = await this.supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .maybeSingle();

    if (error || !lead) {
      throw new Error('Lead not found');
    }

    const scores = this.calculateLeadScores(lead);
    const { positiveFactors, negativeFactors } = this.analyzeLeadFactors(
      lead,
      scores
    );
    const conversionProbability =
      this.calculateConversionProbability(scores);
    const nextBestAction = this.determineNextBestAction(lead, scores);
    const predictedCloseDate = this.predictCloseDate(
      lead,
      conversionProbability
    );
    const recommendedFollowUpDate = this.recommendFollowUpDate(lead, scores);

    const prediction: LeadPrediction = {
      leadId,
      conversionProbability,
      predictedCloseDate,
      predictedValue: lead.budget || null,
      engagementScore: scores.engagement,
      intentScore: scores.intent,
      fitScore: scores.fit,
      urgencyScore: scores.urgency,
      positiveFactors,
      negativeFactors,
      nextBestAction,
      recommendedFollowUpDate,
    };

    await this.supabase.from('lead_predictions').upsert({
      lead_id: leadId,
      conversion_probability: prediction.conversionProbability,
      predicted_close_date: prediction.predictedCloseDate,
      predicted_value: prediction.predictedValue,
      engagement_score: prediction.engagementScore,
      intent_score: prediction.intentScore,
      fit_score: prediction.fitScore,
      urgency_score: prediction.urgencyScore,
      positive_factors: prediction.positiveFactors,
      negative_factors: prediction.negativeFactors,
      next_best_action: prediction.nextBestAction,
      recommended_follow_up_date: prediction.recommendedFollowUpDate,
      model_version: '1.0',
    });

    // keep compatibility with existing smartscore_v2
    await this.supabase
      .from('leads')
      .update({ smartscore_v2: prediction.conversionProbability })
      .eq('id', leadId);

    return prediction;
  }

  private calculateLeadScores(lead: any): {
    engagement: number;
    intent: number;
    fit: number;
    urgency: number;
  } {
    let engagement = 50;
    let intent = 50;
    let fit = 50;
    let urgency = 50;

    // Very lightweight heuristic using existing columns
    if (lead.status === 'contacted') engagement += 10;
    if (lead.status === 'site_visit_scheduled') engagement += 20;

    if (lead.buying_urgency === 'immediate') urgency += 30;
    else if (lead.buying_urgency === '3_months') urgency += 15;

    if (lead.budget && Number(lead.budget) > 0) intent += 20;

    return {
      engagement: Math.min(engagement, 100),
      intent: Math.min(intent, 100),
      fit: Math.min(fit, 100),
      urgency: Math.min(urgency, 100),
    };
  }

  private analyzeLeadFactors(
    lead: any,
    scores: {
      engagement: number;
      intent: number;
      fit: number;
      urgency: number;
    }
  ): { positiveFactors: string[]; negativeFactors: string[] } {
    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];

    if (scores.urgency >= 70) positiveFactors.push('High urgency buyer');
    if (scores.intent >= 70) positiveFactors.push('Strong buying intent');
    if (scores.engagement >= 70) positiveFactors.push('Highly engaged');

    if (scores.engagement < 40) {
      negativeFactors.push('Low engagement - consider re-engaging');
    }

    if (!lead.next_best_action) {
      negativeFactors.push('No clear follow-up defined yet');
    }

    return { positiveFactors, negativeFactors };
  }

  private calculateConversionProbability(scores: {
    engagement: number;
    intent: number;
    fit: number;
    urgency: number;
  }): number {
    const weights = {
      engagement: 0.25,
      intent: 0.3,
      fit: 0.25,
      urgency: 0.2,
    };

    const p =
      scores.engagement * weights.engagement +
      scores.intent * weights.intent +
      scores.fit * weights.fit +
      scores.urgency * weights.urgency;

    return Math.round(p * 10) / 10;
  }

  private determineNextBestAction(lead: any, scores: any): string {
    if (lead.status === 'new') {
      return 'Respond to the inquiry within 2 hours.';
    }

    if (scores.urgency >= 70) {
      return 'Call the buyer and propose a site visit within 48 hours.';
    }

    if (scores.engagement < 40) {
      return 'Send a personalized follow-up with similar properties.';
    }

    return 'Maintain regular contact and share updated listings.';
  }

  private predictCloseDate(
    _lead: any,
    probability: number
  ): string | undefined {
    if (probability < 30) return undefined;
    const baseDays = probability >= 70 ? 30 : probability >= 50 ? 60 : 90;
    const d = new Date();
    d.setDate(d.getDate() + baseDays);
    return d.toISOString().split('T')[0];
  }

  private recommendFollowUpDate(_lead: any, scores: any): string {
    let days = 3;
    if (scores.urgency >= 70) days = 1;
    else if (scores.engagement >= 70) days = 2;
    else if (scores.engagement < 40) days = 7;

    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  private mapInsight(data: any): Insight {
    return {
      id: data.id,
      type: data.insight_type,
      category: data.category,
      title: data.title,
      summary: data.summary,
      detailedAnalysis: data.detailed_analysis,
      confidenceScore: Number(data.confidence_score || 0),
      priority: data.priority,
      recommendations: data.recommendations || [],
      dataPoints: data.data_points || {},
      status: data.status,
      createdAt: data.created_at,
    };
  }
}

export const aiInsightsService = new AIInsightsService();




