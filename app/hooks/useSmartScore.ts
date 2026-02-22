// =============================================
// SMARTSCORE REACT HOOK
// Real-time score tracking and updates
// =============================================

'use client'

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';

// =============================================
// TYPES
// =============================================
export interface SmartScore {
  lead_id: number;
  smartscore: number;
  conversion_probability: number;
  predicted_ltv: number;
  churn_risk?: number;
  priority_tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'standard';
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

export interface ScoreHistory {
  id: string;
  lead_id: number;
  score_value: number;
  conversion_probability: number;
  predicted_ltv: number;
  churn_risk?: number;
  confidence_score?: number;
  ai_insights?: any;
  created_at: string;
}

export interface ScoreAnalytics {
  overview: {
    total_leads: number;
    avg_score: number;
    avg_conversion_prob: number;
    avg_churn_risk: number;
    total_predicted_revenue: number;
  };
  tier_distribution: {
    hot: number;
    warm: number;
    developing: number;
    cold: number;
  };
  score_ranges: {
    '90-100': number;
    '80-89': number;
    '70-79': number;
    '60-69': number;
    '0-59': number;
  };
  high_value_leads: Array<{
    lead_id: number;
    smartscore: number;
    predicted_ltv: number;
    conversion_probability: number;
  }>;
  churn_risk_analysis: {
    high_risk: number;
    medium_risk: number;
    low_risk: number;
  };
  trends: Array<{
    date: string;
    avg_score: number;
    hot_leads: number;
  }>;
}

// =============================================
// HOOK IMPLEMENTATION
// =============================================
export function useSmartScore(leadId?: number | string) {
  const supabase = getSupabase();
  const [score, setScore] = useState<SmartScore | null>(null);
  const [history, setHistory] = useState<ScoreHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);

  // Get current user
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (mounted && user && !error) {
          setUser({ id: user.id });
        } else if (mounted) {
          setUser(null);
        }
      } catch (err) {
        console.warn('[useSmartScore] Failed to get user:', err);
        if (mounted) setUser(null);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ? { id: session.user.id } : null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // =============================================
  // FETCH CURRENT SCORE
  // =============================================
  const fetchScore = useCallback(async () => {
    if (!leadId) return;

    const leadIdNum = typeof leadId === 'string' ? parseInt(leadId, 10) : leadId;
    if (isNaN(leadIdNum)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/smartscore/calculate?lead_ids=${leadIdNum}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch score');
      }

      if (data.scores && data.scores.length > 0) {
        setScore(data.scores[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Fetch score error:', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  // =============================================
  // CALCULATE/RECALCULATE SCORE
  // =============================================
  const calculateScore = useCallback(async (forceRecalculate = false) => {
    if (!leadId) return;

    const leadIdNum = typeof leadId === 'string' ? parseInt(leadId, 10) : leadId;
    if (isNaN(leadIdNum)) return;

    setCalculating(true);
    setError(null);

    try {
      const response = await fetch('/api/smartscore/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_ids: [leadIdNum],
          force_recalculate: forceRecalculate,
          notify_builders: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Calculation failed');
      }

      if (data.scores && data.scores.length > 0) {
        setScore(data.scores[0]);
      }

      return data.scores[0];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
      console.error('Calculate score error:', err);
      throw err;
    } finally {
      setCalculating(false);
    }
  }, [leadId]);

  // =============================================
  // FETCH SCORE HISTORY
  // =============================================
  const fetchHistory = useCallback(async (days = 30) => {
    if (!leadId) return;

    const leadIdNum = typeof leadId === 'string' ? parseInt(leadId, 10) : leadId;
    if (isNaN(leadIdNum)) return;

    try {
      const response = await fetch(`/api/smartscore/history?lead_id=${leadIdNum}&days=${days}`);
      const data = await response.json();

      if (response.ok && data.history) {
        setHistory(data.history);
        return data;
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    }
  }, [leadId]);

  // =============================================
  // REAL-TIME SUBSCRIPTION
  // =============================================
  useEffect(() => {
    if (!leadId || !user) return;

    const leadIdNum = typeof leadId === 'string' ? parseInt(leadId, 10) : leadId;
    if (isNaN(leadIdNum)) return;

    // Subscribe to score updates
    const channel = supabase
      .channel(`smartscore:${leadIdNum}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `id=eq.${leadIdNum}`
        },
        (payload) => {
          console.log('🔄 SmartScore updated:', payload.new);

          // Update score with new data
          if (payload.new) {
            setScore(prev => prev ? {
              ...prev,
              smartscore: parseFloat(payload.new.smartscore_v2 || 0),
              conversion_probability: parseFloat(payload.new.conversion_probability || 0),
              predicted_ltv: parseFloat(payload.new.predicted_ltv || 0),
              priority_tier: payload.new.priority_tier || prev.priority_tier,
              next_best_action: payload.new.next_best_action || prev.next_best_action,
              optimal_contact_time: payload.new.optimal_contact_time || prev.optimal_contact_time
            } : null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, user, supabase]);

  // =============================================
  // INITIAL FETCH
  // =============================================
  useEffect(() => {
    if (leadId) {
      fetchScore();
    }
  }, [leadId, fetchScore]);

  return {
    score,
    history,
    loading,
    calculating,
    error,
    calculateScore,
    fetchHistory,
    refresh: fetchScore
  };
}

// =============================================
// BULK SCORES HOOK
// =============================================
export function useSmartScores(leadIds: number[]) {
  const [scores, setScores] = useState<Record<number, SmartScore>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = useCallback(async () => {
    if (leadIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/smartscore/calculate?lead_ids=${leadIds.join(',')}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch scores');
      }

      const scoresMap = data.scores.reduce((acc: Record<number, SmartScore>, score: SmartScore) => {
        acc[score.lead_id] = score;
        return acc;
      }, {});

      setScores(scoresMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Fetch scores error:', err);
    } finally {
      setLoading(false);
    }
  }, [leadIds]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  return {
    scores,
    loading,
    error,
    refresh: fetchScores
  };
}

// =============================================
// ANALYTICS HOOK
// =============================================
export function useSmartScoreAnalytics(period: '7d' | '30d' | '90d' | '1y' = '30d') {
  const [analytics, setAnalytics] = useState<ScoreAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/smartscore/analytics?period=${period}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh: fetchAnalytics
  };
}

