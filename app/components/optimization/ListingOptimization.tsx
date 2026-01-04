'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Lightbulb, Image as ImageIcon, DollarSign, FileText, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { toast } from 'sonner';

interface OptimizationSuggestion {
  id?: string;
  suggestion_type: string;
  suggestion_category: string;
  suggestion_title: string;
  suggestion_text: string;
  expected_impact: string;
  estimated_improvement: number;
  action_required: string;
  confidence_score: number;
  is_implemented?: boolean;
}

interface ListingOptimizationProps {
  propertyId: string;
}

export default function ListingOptimization({ propertyId }: ListingOptimizationProps) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [performanceScore, setPerformanceScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadOptimizationData();
  }, [propertyId]);

  const loadOptimizationData = async () => {
    if (!propertyId) return;

    setLoading(true);
    try {
      const supabase = getSupabase();
      
      // Load existing suggestions
      const { data: existingSuggestions } = await supabase
        .from('optimization_suggestions')
        .select('*')
        .eq('property_id', propertyId)
        .eq('is_implemented', false)
        .order('suggestion_category', { ascending: false });

      if (existingSuggestions) {
        setSuggestions(existingSuggestions);
      }

      // Load performance score
      const { data: performance } = await supabase
        .from('listing_performance')
        .select('performance_score')
        .eq('property_id', propertyId)
        .single();

      if (performance) {
        setPerformanceScore(performance.performance_score || 0);
      }
    } catch (error: any) {
      console.error('Failed to load optimization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!propertyId) return;

    setAnalyzing(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_URL}/api/optimization/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: propertyId,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setSuggestions(result.suggestions || []);
      setPerformanceScore(result.performance_score || 0);
      toast.success(`Analysis complete! Found ${result.total_suggestions} suggestions`);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      toast.error('Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'price':
        return <DollarSign className="w-5 h-5" />;
      case 'description':
        return <FileText className="w-5 h-5" />;
      case 'timing':
        return <Clock className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'critical':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'high':
        return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
      case 'medium':
        return 'bg-gold-500/20 border-gold-500/30 text-gold-400';
      case 'low':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      default:
        return 'bg-white/10 border-white/20 text-white/60';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-emerald-400';
      case 'medium':
        return 'text-gold-400';
      case 'low':
        return 'text-white/60';
      default:
        return 'text-white/60';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center">
        <div className="text-white">Loading optimization data...</div>
      </div>
    );
  }

  const criticalCount = suggestions.filter(s => s.suggestion_category === 'critical').length;
  const highCount = suggestions.filter(s => s.suggestion_category === 'high').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden p-6">
      {/* Animated Background Elements */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow' />
        <div 
          className='absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow' 
          style={{ animationDelay: '1s' }} 
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gold-500/20 border border-gold-500/30 rounded-lg p-3">
                <Target className="w-6 h-6 text-gold-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Listing Optimization</h2>
                <p className="text-white/60">AI-powered suggestions to improve performance</p>
              </div>
            </div>
            <Button
              onClick={runAnalysis}
              disabled={analyzing}
              variant="primary"
              className="bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-primary-950"
            >
              {analyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </div>

        {/* Performance Score */}
        <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-lg mb-1">Performance Score</h3>
              <p className="text-white/60 text-sm">Overall listing performance</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${performanceScore >= 70 ? 'text-emerald-400' : performanceScore >= 50 ? 'text-gold-400' : 'text-white/60'}`}>
                {Math.round(performanceScore)}
              </div>
              <div className="text-white/40 text-sm">out of 100</div>
            </div>
          </div>
          <Progress value={performanceScore} className="h-3" />
        </div>

        {/* Suggestions Summary */}
        {suggestions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative rounded-2xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-red-500/10 border border-red-500/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Critical</p>
                  <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-orange-500/10 border border-orange-500/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">High Priority</p>
                  <p className="text-2xl font-bold text-orange-400">{highCount}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-400" />
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Suggestions</p>
                  <p className="text-2xl font-bold text-white">{suggestions.length}</p>
                </div>
                <Lightbulb className="w-8 h-8 text-gold-400" />
              </div>
            </div>
          </div>
        )}

        {/* Suggestions List */}
        {suggestions.length === 0 ? (
          <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 p-12 text-center">
            <Lightbulb className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/60 text-lg">No suggestions available</p>
            <p className="text-white/40 text-sm mt-2">Run analysis to get optimization suggestions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id || index}
                className="group relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 p-6"
              >
                {/* Shimmer Effect */}
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`bg-white/10 border rounded-lg p-3 ${getCategoryColor(suggestion.suggestion_category)}`}>
                        {getCategoryIcon(suggestion.suggestion_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-white font-semibold text-lg">{suggestion.suggestion_title}</h3>
                          <Badge className={getCategoryColor(suggestion.suggestion_category)}>
                            {suggestion.suggestion_category}
                          </Badge>
                        </div>
                        <p className="text-white/70 mb-3">{suggestion.suggestion_text}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center text-white/60">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span className={getImpactColor(suggestion.expected_impact)}>
                              {suggestion.estimated_improvement}% improvement
                            </span>
                          </div>
                          <div className="flex items-center text-white/60">
                            <span>Confidence: {Math.round(suggestion.confidence_score)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-white/80 text-sm">
                      <strong className="text-gold-400">Action Required:</strong> {suggestion.action_required}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { getSupabase } from '@/lib/supabase';

