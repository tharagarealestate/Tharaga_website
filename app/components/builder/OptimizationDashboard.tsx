'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, 
  Lightbulb, Target, BarChart3, Zap, ArrowRight,
  ImageIcon, DollarSign, FileText, Users, Clock, Loader2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import clsx from 'clsx';

interface OptimizationDashboardProps {
  propertyId: string;
}

interface Suggestion {
  id: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  impact_score: number;
  action_steps?: Array<{step: number; action: string; difficulty: string}>;
  estimated_view_increase_pct?: number;
  estimated_lead_increase_pct?: number;
  status: string;
}

interface Performance {
  overall_score?: number;
  total_views?: number;
  view_trend?: string;
  market_position?: number;
  view_to_contact_rate?: number;
  bounce_rate?: number;
}

interface CompetitiveData {
  view_performance_index?: number;
  price_percentile?: number;
  competitive_advantages?: string[];
  competitive_disadvantages?: string[];
}

export default function OptimizationDashboard({ propertyId }: OptimizationDashboardProps) {
  const supabase = createClientComponentClient();
  
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [competitiveData, setCompetitiveData] = useState<CompetitiveData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  
  const loadOptimizationData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/ai/optimize/${propertyId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setPerformance(data.data.performance || {});
        setSuggestions(data.data.suggestions || []);
        setCompetitiveData(data.data.competitive_insights || null);
      }
    } catch (error) {
      console.error('Failed to load optimization data:', error);
      toast.error('Failed to load optimization data');
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);
  
  useEffect(() => {
    loadOptimizationData();
    subscribeToUpdates();
  }, [loadOptimizationData]);
  
  const subscribeToUpdates = () => {
    // Real-time subscription to performance metrics
    const channel = supabase
      .channel(`optimization-${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listing_performance_metrics',
          filter: `property_id=eq.${propertyId}`
        },
        (payload) => {
          setPerformance(payload.new as Performance);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_optimization_suggestions',
          filter: `property_id=eq.${propertyId}`
        },
        () => {
          loadOptimizationData(); // Reload suggestions
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  };
  
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch(`/api/ai/optimize/${propertyId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Optimization analysis started. Results will appear shortly.');
        // Wait a bit for analysis to complete
        setTimeout(() => {
          loadOptimizationData();
          setIsAnalyzing(false);
        }, 5000);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error(error instanceof Error ? error.message : 'Analysis failed');
      setIsAnalyzing(false);
    }
  };
  
  const implementSuggestion = async (suggestionId: string) => {
    try {
      const response = await fetch(
        `/api/ai/optimize/${propertyId}/implement`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suggestion_id: suggestionId })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Suggestion marked as implemented. Results will be tracked.');
          loadOptimizationData();
        }
      }
    } catch (error) {
      console.error('Failed to implement suggestion:', error);
      toast.error('Failed to implement suggestion');
    }
  };
  
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'images': ImageIcon,
      'pricing': DollarSign,
      'description': FileText,
      'marketing': Users
    };
    return icons[category] || Lightbulb;
  };
  
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'critical': 'from-red-500/20 to-red-600/20 border-red-500/50',
      'high': 'from-orange-500/20 to-orange-600/20 border-orange-500/50',
      'medium': 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50',
      'low': 'from-blue-500/20 to-blue-600/20 border-blue-500/50'
    };
    return colors[priority] || 'from-gray-500/20 to-gray-600/20 border-gray-500/50';
  };
  
  const getPriorityBadgeColor = (priority: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-red-100 text-red-700 border-red-300',
      'high': 'bg-orange-100 text-orange-700 border-orange-300',
      'medium': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'low': 'bg-blue-100 text-blue-700 border-blue-300'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700 border-gray-300';
  };
  
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 shadow-lg text-white">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold text-primary-200">
            <BarChart3 className="mr-2 h-5 w-5" /> Optimization Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
          <span className="ml-3 text-primary-300">Loading optimization insights...</span>
        </CardContent>
      </Card>
    );
  }
  
  if (!performance) {
    return (
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 shadow-lg text-white">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold text-primary-200">
            <BarChart3 className="mr-2 h-5 w-5" /> Optimization Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64 text-primary-300">
          <p className="text-lg font-medium mb-4">No performance data available</p>
          <Button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" /> Run Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const criticalCount = suggestions.filter(s => s.priority === 'critical').length;
  const highCount = suggestions.filter(s => s.priority === 'high').length;
  
  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 shadow-lg text-white group relative overflow-hidden">
        {/* Shimmer Effect on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
        
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-2 relative">
          <div className="flex-1">
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary-200">Listing Performance</CardTitle>
            <CardDescription className="text-sm sm:text-base text-primary-300">AI-powered optimization insights</CardDescription>
          </div>
          <Button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 min-h-[44px]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span className="text-sm sm:text-base">Analyzing...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Re-analyze</span>
              </>
            )}
          </Button>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Overall Score */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-primary-300">Overall Score</span>
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {performance.overall_score?.toFixed(0) || 0}
                <span className="text-base sm:text-lg text-primary-400">/100</span>
              </div>
              <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${performance.overall_score || 0}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
            
            {/* Total Views */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-primary-300">Total Views</span>
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white">{performance.total_views || 0}</div>
              <div className="flex items-center gap-1 mt-1">
                {performance.view_trend === 'increasing' ? (
                  <>
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    <span className="text-xs sm:text-sm text-green-400">Trending up</span>
                  </>
                ) : performance.view_trend === 'decreasing' ? (
                  <>
                    <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                    <span className="text-xs sm:text-sm text-red-400">Trending down</span>
                  </>
                ) : (
                  <span className="text-xs sm:text-sm text-primary-400">Stable</span>
                )}
              </div>
            </div>
            
            {/* Market Position */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-primary-300">Market Rank</span>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white">
                #{performance.market_position || 'N/A'}
              </div>
              <span className="text-xs sm:text-sm text-primary-400">Among similar listings</span>
            </div>
            
            {/* Contact Rate */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-primary-300">Contact Rate</span>
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {performance.view_to_contact_rate?.toFixed(1) || 0}%
              </div>
              <span className="text-xs sm:text-sm text-primary-400">View to contact</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Alert Summary */}
      {(criticalCount > 0 || highCount > 0) && (
        <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-lg border border-orange-500/50 shadow-lg text-white">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-white">Action Required</h3>
                <p className="text-xs sm:text-sm text-primary-200 mt-1">
                  {criticalCount > 0 && `${criticalCount} critical issues `}
                  {criticalCount > 0 && highCount > 0 && 'and '}
                  {highCount > 0 && `${highCount} high-priority improvements`} found
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Suggestions List */}
      <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 shadow-lg text-white group relative overflow-hidden">
        {/* Shimmer Effect on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
        
        <CardHeader className="relative p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-bold text-primary-200 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
            <span>AI Recommendations <span className="text-primary-300">({suggestions.length})</span></span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
          <AnimatePresence>
            {suggestions.map((suggestion) => {
              const Icon = getCategoryIcon(suggestion.category);
              const isExpanded = selectedSuggestion === suggestion.id;
              
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={clsx(
                    "bg-gradient-to-br backdrop-blur-sm rounded-xl shadow-md overflow-hidden border",
                    getPriorityColor(suggestion.priority),
                    "hover:shadow-lg transition-all"
                  )}
                >
                  <div
                    className="p-3 sm:p-4 cursor-pointer min-h-[44px]"
                    onClick={() => setSelectedSuggestion(isExpanded ? null : suggestion.id)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={clsx(
                        "p-2 sm:p-3 rounded-xl bg-gradient-to-br border border-white/20 flex-shrink-0",
                        getPriorityColor(suggestion.priority)
                      )}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="text-sm sm:text-base font-semibold text-white break-words">{suggestion.title}</h4>
                              <Badge className={clsx(getPriorityBadgeColor(suggestion.priority), "text-xs")}>
                                {suggestion.priority}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-primary-200 break-words">{suggestion.description}</p>
                          </div>
                          
                          <div className="text-left sm:text-right flex-shrink-0">
                            <div className="text-xl sm:text-2xl font-bold text-primary-400">{suggestion.impact_score}</div>
                            <div className="text-xs text-primary-300">Impact</div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                          {suggestion.estimated_view_increase_pct && (
                            <div className="flex items-center gap-1 text-green-400">
                              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>+{suggestion.estimated_view_increase_pct}% views</span>
                            </div>
                          )}
                          {suggestion.estimated_lead_increase_pct && (
                            <div className="flex items-center gap-1 text-purple-400">
                              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>+{suggestion.estimated_lead_increase_pct}% leads</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {isExpanded && suggestion.action_steps && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="border-t border-white/10 bg-white/5 overflow-hidden"
                      >
                        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                          <div>
                            <h5 className="text-sm sm:text-base font-medium text-white mb-2">Action Steps:</h5>
                            <div className="space-y-2">
                              {suggestion.action_steps.map((step) => (
                                <div key={step.step} className="flex items-start gap-2 sm:gap-3">
                                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary-500/20 text-primary-300 flex items-center justify-center text-xs sm:text-sm font-medium border border-primary-500/30">
                                    {step.step}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm text-primary-200 break-words">{step.action}</p>
                                    <Badge className={clsx(
                                      "text-xs mt-1",
                                      step.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                      step.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                      'bg-red-500/20 text-red-400 border-red-500/30'
                                    )}>
                                      {step.difficulty}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <Button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              implementSuggestion(suggestion.id);
                            }}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white min-h-[44px] text-sm sm:text-base"
                          >
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Mark as Implemented
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {suggestions.length === 0 && (
            <div className="text-center py-8 sm:py-12 bg-white/5 rounded-xl border-2 border-dashed border-white/10 px-4">
              <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">All Optimized!</h3>
              <p className="text-sm sm:text-base text-primary-300">Your listing is performing well. Keep monitoring for new insights.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

