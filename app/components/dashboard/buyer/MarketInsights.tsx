'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, MapPin, BarChart3, Activity,
  Train, Building, Sparkles, ChevronRight, RefreshCw
} from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';

interface MarketInsight {
  id: string;
  city: string;
  locality: string;
  avg_price_sqft: number;
  median_price: number;
  price_change_weekly: number;
  price_change_monthly: number;
  price_change_quarterly: number;
  trend_direction: 'up' | 'down' | 'stable';
  trend_strength: number;
  total_listings: number;
  new_listings_week: number;
  demand_score: number;
  infrastructure_updates: Array<{
    type: string;
    name: string;
    status: string;
    expected_completion?: string;
  }>;
  calculated_at: string;
}

export default function MarketInsights() {
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLocality, setSelectedLocality] = useState<string | null>(null);
  const { supabase } = useSupabase();

  // Fetch insights based on user preferences
  const fetchInsights = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      // Get user preferences
      let preferredLocalities = ['Whitefield', 'Sarjapur Road', 'Electronic City'];

      if (user) {
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('preferred_localities')
          .eq('user_id', user.id)
          .single();

        if (prefs?.preferred_localities?.length > 0) {
          preferredLocalities = prefs.preferred_localities;
        }
      }

      // Fetch insights for preferred localities
      const { data, error } = await supabase
        .from('market_insights')
        .select('*')
        .in('locality', preferredLocalities)
        .order('demand_score', { ascending: false })
        .limit(5);

      if (error) throw error;
      setInsights(data || []);

      if (data && data.length > 0 && !selectedLocality) {
        setSelectedLocality(data[0].locality);
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase, selectedLocality]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('market-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'market_insights',
        },
        () => {
          fetchInsights(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchInsights]);

  // Get trend icon
  const getTrendIcon = (direction: string, change: number) => {
    if (direction === 'up' || change > 0) {
      return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    } else if (direction === 'down' || change < 0) {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  // Get trend color
  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-emerald-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  // Format price
  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(0)}L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Get infrastructure icon
  const getInfraIcon = (type: string) => {
    switch (type) {
      case 'metro': return <Train className="w-4 h-4" />;
      case 'office': return <Building className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const selectedInsight = insights.find(i => i.locality === selectedLocality);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Empty state
  if (insights.length === 0) {
    return (
      <div className="rounded-2xl backdrop-blur-xl bg-white/[0.04] border border-white/10 p-8 text-center">
        <BarChart3 className="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Market Data</h3>
        <p className="text-gray-400 text-sm">
          Market insights for your preferred locations will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5
            border border-purple-500/30">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Market Insights</h2>
            <p className="text-sm text-gray-400">Real-time market trends</p>
          </div>
        </div>

        <motion.button
          onClick={() => fetchInsights(true)}
          disabled={refreshing}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10
            border border-white/10 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Locality Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {insights.map((insight) => (
          <button
            key={insight.locality}
            onClick={() => setSelectedLocality(insight.locality)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
              text-sm font-medium transition-all
              ${selectedLocality === insight.locality
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }
            `}
          >
            <MapPin className="w-3.5 h-3.5" />
            {insight.locality}
            <span className={`
              px-2 py-0.5 rounded-full text-xs
              ${selectedLocality === insight.locality
                ? 'bg-white/20'
                : 'bg-white/10'
              }
            `}>
              {insight.trend_direction === 'up' ? '↑' : insight.trend_direction === 'down' ? '↓' : '–'}
            </span>
          </button>
        ))}
      </div>

      {/* Selected Insight Details */}
      {selectedInsight && (
        <motion.div
          key={selectedInsight.locality}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl backdrop-blur-xl bg-white/[0.04] border border-white/10
            overflow-hidden"
        >
          {/* Price Overview */}
          <div className="p-6 border-b border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Avg Price/sqft */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Avg. Price/sqft</p>
                <p className="text-2xl font-bold text-white">
                  ₹{selectedInsight.avg_price_sqft.toLocaleString('en-IN')}
                </p>
                <div className={`flex items-center gap-1 text-sm ${getTrendColor(selectedInsight.price_change_monthly)}`}>
                  {getTrendIcon(selectedInsight.trend_direction, selectedInsight.price_change_monthly)}
                  {selectedInsight.price_change_monthly > 0 ? '+' : ''}
                  {selectedInsight.price_change_monthly.toFixed(1)}% this month
                </div>
              </div>

              {/* Median Price */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Median Price</p>
                <p className="text-2xl font-bold text-[#D4AF37]">
                  {formatPrice(selectedInsight.median_price)}
                </p>
                <p className="text-sm text-gray-400">
                  For {selectedInsight.total_listings} listings
                </p>
              </div>

              {/* Demand Score */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Demand Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-white">
                    {selectedInsight.demand_score}/100
                  </p>
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${selectedInsight.demand_score >= 75
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : selectedInsight.demand_score >= 50
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }
                  `}>
                    {selectedInsight.demand_score >= 75 ? 'High' : selectedInsight.demand_score >= 50 ? 'Medium' : 'Low'}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  {selectedInsight.new_listings_week} new this week
                </p>
              </div>

              {/* Trend Strength */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Trend Strength</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedInsight.trend_strength}%` }}
                      className={`h-full rounded-full ${
                        selectedInsight.trend_direction === 'up'
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          : selectedInsight.trend_direction === 'down'
                            ? 'bg-gradient-to-r from-red-500 to-red-400'
                            : 'bg-gradient-to-r from-gray-500 to-gray-400'
                      }`}
                    />
                  </div>
                  <span className="text-sm text-white font-medium">
                    {selectedInsight.trend_strength}%
                  </span>
                </div>
                <p className="text-sm text-gray-400 capitalize">
                  {selectedInsight.trend_direction} trend
                </p>
              </div>
            </div>
          </div>

          {/* Price Changes */}
          <div className="p-6 border-b border-white/10">
            <h4 className="text-sm font-medium text-gray-400 mb-4">Price Change History</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl bg-white/5 ${
                selectedInsight.price_change_weekly > 0 ? 'border border-emerald-500/20' :
                selectedInsight.price_change_weekly < 0 ? 'border border-red-500/20' :
                'border border-white/10'
              }`}>
                <p className="text-xs text-gray-500 mb-1">Weekly</p>
                <p className={`text-lg font-bold ${getTrendColor(selectedInsight.price_change_weekly)}`}>
                  {selectedInsight.price_change_weekly > 0 ? '+' : ''}
                  {selectedInsight.price_change_weekly.toFixed(1)}%
                </p>
              </div>
              <div className={`p-4 rounded-xl bg-white/5 ${
                selectedInsight.price_change_monthly > 0 ? 'border border-emerald-500/20' :
                selectedInsight.price_change_monthly < 0 ? 'border border-red-500/20' :
                'border border-white/10'
              }`}>
                <p className="text-xs text-gray-500 mb-1">Monthly</p>
                <p className={`text-lg font-bold ${getTrendColor(selectedInsight.price_change_monthly)}`}>
                  {selectedInsight.price_change_monthly > 0 ? '+' : ''}
                  {selectedInsight.price_change_monthly.toFixed(1)}%
                </p>
              </div>
              <div className={`p-4 rounded-xl bg-white/5 ${
                selectedInsight.price_change_quarterly > 0 ? 'border border-emerald-500/20' :
                selectedInsight.price_change_quarterly < 0 ? 'border border-red-500/20' :
                'border border-white/10'
              }`}>
                <p className="text-xs text-gray-500 mb-1">Quarterly</p>
                <p className={`text-lg font-bold ${getTrendColor(selectedInsight.price_change_quarterly)}`}>
                  {selectedInsight.price_change_quarterly > 0 ? '+' : ''}
                  {selectedInsight.price_change_quarterly.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Infrastructure Updates */}
          {selectedInsight.infrastructure_updates && selectedInsight.infrastructure_updates.length > 0 && (
            <div className="p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-4">Infrastructure Updates</h4>
              <div className="space-y-3">
                {selectedInsight.infrastructure_updates.map((update, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5
                      border border-white/10 hover:bg-white/[0.08] transition-all"
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20
                      text-cyan-400">
                      {getInfraIcon(update.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{update.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`
                          px-2 py-0.5 rounded-full text-xs font-medium
                          ${update.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : update.status === 'under_construction'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }
                        `}>
                          {update.status.replace('_', ' ')}
                        </span>
                        {update.expected_completion && (
                          <span className="text-xs text-gray-500">
                            Expected: {update.expected_completion}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

