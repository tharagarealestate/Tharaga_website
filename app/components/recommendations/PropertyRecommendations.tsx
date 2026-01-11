'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, MapPin, Home, Star, Clock, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabase';
import Image from 'next/image';

interface Recommendation {
  property_id: string;
  recommendation_score: number;
  fit_score: number;
  reason: string;
  factors: Record<string, number>;
}

interface PropertyRecommendationsProps {
  buyerId: string;
  limit?: number;
  algorithm?: 'collaborative' | 'content_based' | 'hybrid';
}

export default function PropertyRecommendations({ 
  buyerId, 
  limit = 10, 
  algorithm = 'hybrid' 
}: PropertyRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(algorithm);

  useEffect(() => {
    loadRecommendations();
  }, [buyerId, selectedAlgorithm, limit]);

  const loadRecommendations = async () => {
    if (!buyerId) return;

    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_URL}/api/recommendations/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyer_id: buyerId,
          limit,
          algorithm: selectedAlgorithm,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load recommendations');
      }

      const data = await response.json();
      setRecommendations(data);

      // Fetch property details
      if (data.length > 0) {
        const supabase = getSupabase();
        const propertyIds = data.map((r: Recommendation) => r.property_id);
        const { data: props } = await supabase
          .from('properties')
          .select('*')
          .in('id', propertyIds);

        if (props) {
          // Match properties with recommendations
          const propsMap = new Map(props.map((p: any) => [p.id, p]));
          const sortedProps = data
            .map((r: Recommendation) => propsMap.get(r.property_id))
            .filter(Boolean);
          setProperties(sortedProps);
        }
      }
    } catch (error: any) {
      console.error('Failed to load recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-gold-400';
    return 'text-white/60';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
    if (score >= 60) return 'bg-gold-500/20 border-gold-500/30 text-gold-400';
    return 'bg-white/10 border-white/20 text-white/60';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center">
        <div className="text-white">Loading recommendations...</div>
      </div>
    );
  }

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

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gold-500/20 border border-gold-500/30 rounded-lg p-3">
                <Sparkles className="w-6 h-6 text-gold-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Personalized Recommendations</h2>
                <p className="text-white/60">Properties matched to your preferences</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="invisible"
                size="sm"
                onClick={() => setSelectedAlgorithm('hybrid')}
                className={selectedAlgorithm === 'hybrid' ? 'bg-gold-500/20 text-gold-400' : ''}
              >
                Hybrid
              </Button>
              <Button
                variant="invisible"
                size="sm"
                onClick={() => setSelectedAlgorithm('collaborative')}
                className={selectedAlgorithm === 'collaborative' ? 'bg-gold-500/20 text-gold-400' : ''}
              >
                Collaborative
              </Button>
              <Button
                variant="invisible"
                size="sm"
                onClick={() => setSelectedAlgorithm('content_based')}
                className={selectedAlgorithm === 'content_based' ? 'bg-gold-500/20 text-gold-400' : ''}
              >
                Content-Based
              </Button>
            </div>
          </div>
        </div>

        {/* Recommendations Grid */}
        {recommendations.length === 0 ? (
          <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 p-12 text-center">
            <p className="text-white/60 text-lg">No recommendations available yet</p>
            <p className="text-white/40 text-sm mt-2">Start viewing properties to get personalized recommendations</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => {
              const property = properties.find(p => p?.id === rec.property_id);
              if (!property) return null;

              const images = property.images || [];
              const mainImage = images[0] || '/placeholder-property.jpg';

              return (
                <div
                  key={rec.property_id}
                  className="group relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 hover:shadow-2xl"
                >
                  {/* Shimmer Effect */}
                  <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
                  
                  {/* Score Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className={getScoreBadgeColor(rec.recommendation_score)}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {Math.round(rec.recommendation_score)}% Match
                    </Badge>
                  </div>

                  {/* Property Image */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={mainImage}
                      alt={property.title || 'Property'}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  {/* Property Details */}
                  <div className="relative z-10 p-6 space-y-4">
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-1">{property.title || 'Property'}</h3>
                      <div className="flex items-center text-white/60 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {property.location || property.locality || 'Location'}
                      </div>
                    </div>

                    {/* Match Reason */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-white/80 text-sm">{rec.reason}</p>
                    </div>

                    {/* Property Specs */}
                    <div className="flex items-center justify-between text-white/60 text-sm">
                      <div className="flex items-center">
                        <Home className="w-4 h-4 mr-1" />
                        {property.bedrooms || 'N/A'} BHK
                      </div>
                      <div className="flex items-center">
                        <span className="text-gold-400 font-semibold">
                          ₹{(property.price || property.price_inr || 0) / 100000}L
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 pt-2">
                      <Button
                        variant="invisible"
                        size="sm"
                        className="flex-1 bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 border border-gold-500/30"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Contact
                      </Button>
                      <Button
                        variant="invisible"
                        size="sm"
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

