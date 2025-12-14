'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, MapPin, ArrowRight, RefreshCw } from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import Image from 'next/image';
import Link from 'next/link';

interface Property {
  id: string;
  title: string;
  locality: string;
  city: string;
  price: number;
  sqft: number;
  bedrooms: number;
  property_type: string;
  images: string[];
  builder_name?: string;
}

interface Recommendation {
  id: string;
  property_id: string;
  match_score: number;
  score_breakdown: {
    budget: number;
    location: number;
    bhk: number;
    type: number;
    amenities: number;
  };
  match_reasons: string[];
  was_saved: boolean;
  property: Property;
}

export default function PerfectMatches() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { supabase } = useSupabase();

  // Fetch recommendations
  const fetchRecommendations = useCallback(async (showRefresh = false) => {
    if (!supabase) {
      setError('Database connection not ready');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Please log in to see recommendations');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // First, trigger recommendation generation
      const { error: rpcError } = await supabase.rpc('generate_user_recommendations', {
        p_user_id: user.id
      });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
      }

      // Fetch recommendations with property details
      const { data, error: fetchError } = await supabase
        .from('ai_recommendations')
        .select(`
          *,
          property:properties (
            id, title, locality, city, price, sqft, bedrooms,
            property_type, images, builder_name
          )
        `)
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .gte('match_score', 5)
        .order('match_score', { ascending: false })
        .limit(6);

      if (fetchError) throw fetchError;

      // Transform data to match interface
      const transformed = (data || []).map((rec: any) => ({
        ...rec,
        property: rec.property,
        score_breakdown: rec.score_breakdown || {
          budget: 0,
          location: 0,
          bhk: 0,
          type: 0,
          amenities: 0
        },
        match_reasons: rec.match_reasons || []
      }));

      setRecommendations(transformed);
      setError(null);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Real-time subscription for new properties
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('new-properties')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'properties',
        },
        () => {
          fetchRecommendations(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchRecommendations]);

  // Toggle save/favorite
  const toggleSave = async (e: React.MouseEvent, recommendation: Recommendation) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (recommendation.was_saved) {
      // Remove from favorites
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', recommendation.property_id);
    } else {
      // Add to favorites
      await supabase.from('user_favorites').insert({
        user_id: user.id,
        property_id: recommendation.property_id,
        price_at_save: recommendation.property.price,
        current_price: recommendation.property.price
      });
    }

    // Update recommendation status
    await supabase
      .from('ai_recommendations')
      .update({ was_saved: !recommendation.was_saved })
      .eq('id', recommendation.id);

    // Update local state
    setRecommendations(prev =>
      prev.map(r =>
        r.id === recommendation.id ? { ...r, was_saved: !r.was_saved } : r
      )
    );
  };

  // Format price for Indian currency
  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(0)} Lakhs`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Get match score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-emerald-400 to-emerald-600';
    if (score >= 75) return 'from-blue-400 to-blue-600';
    if (score >= 60) return 'from-amber-400 to-amber-600';
    return 'from-gray-400 to-gray-600';
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-72 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5
            border border-[#D4AF37]/30">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Perfect Matches For You</h2>
            <p className="text-sm text-gray-400">AI-curated based on your preferences</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => fetchRecommendations(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10
              border border-white/10 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>

          <Link
            href="/property-listing"
            className="flex items-center gap-2 px-4 py-2 rounded-xl
              bg-white/5 hover:bg-white/10 border border-white/10
              text-sm text-gray-300 hover:text-white transition-all"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!error && recommendations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl backdrop-blur-xl bg-white/[0.04] border border-white/10 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5
            flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Matches Yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Complete your preferences to get personalized property recommendations
          </p>
          <Link
            href="/preferences"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
              bg-gradient-to-r from-[#D4AF37] to-[#F0D78C]
              text-slate-900 font-semibold
              hover:shadow-lg hover:shadow-[#D4AF37]/20
              transition-all"
          >
            Set Preferences
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {/* Recommendations Grid */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredId(rec.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <Link href={`/properties/${rec.property_id}`}>
                  <div className="relative h-full rounded-2xl overflow-hidden
                    backdrop-blur-xl bg-white/[0.04] border border-white/10
                    hover:bg-white/[0.08] hover:border-white/20
                    transition-all duration-300 group">

                    {/* Property Image */}
                    <div className="relative h-44 overflow-hidden">
                      <Image
                        src={rec.property.images?.[0] || '/property1.jpg'}
                        alt={rec.property.title}
                        fill
                        className="object-cover transition-transform duration-500
                          group-hover:scale-110"
                      />

                      {/* Match Score Badge */}
                      <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full
                        bg-gradient-to-r ${getScoreColor(rec.match_score)}
                        text-white text-sm font-bold shadow-lg`}>
                        {Math.round(rec.match_score)}% Match
                      </div>

                      {/* Save Button */}
                      <motion.button
                        onClick={(e) => toggleSave(e, rec)}
                        className={`absolute top-3 right-3 p-2 rounded-full
                          backdrop-blur-md transition-all
                          ${rec.was_saved
                            ? 'bg-red-500 text-white'
                            : 'bg-black/50 text-white hover:bg-black/70'
                          }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Heart className={`w-5 h-5 ${rec.was_saved ? 'fill-current' : ''}`} />
                      </motion.button>

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t
                        from-black/60 via-transparent to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="text-white font-semibold line-clamp-1 group-hover:text-[#D4AF37]
                          transition-colors">
                          {rec.property.title}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-sm">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{rec.property.locality}, {rec.property.city}</span>
                        </div>
                      </div>

                      {/* Price & Specs */}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-[#D4AF37]">
                          {formatPrice(rec.property.price)}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>{rec.property.bedrooms} BHK</span>
                          <span>•</span>
                          <span>{rec.property.sqft?.toLocaleString() || 'N/A'} sqft</span>
                        </div>
                      </div>

                      {/* Match Reasons (on hover) */}
                      <AnimatePresence>
                        {hoveredId === rec.id && rec.match_reasons.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-3 border-t border-white/10"
                          >
                            <p className="text-xs text-gray-500 mb-1.5">Why we matched you:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {rec.match_reasons.slice(0, 2).map((reason, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 rounded-full text-xs
                                    bg-white/5 text-gray-300 border border-white/10"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

