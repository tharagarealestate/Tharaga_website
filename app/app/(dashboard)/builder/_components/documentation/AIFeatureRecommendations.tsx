'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, X, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Recommendation {
  feature_key: string;
  feature_name: string;
  category: string;
  short_description: string;
  recommendation_reason: string;
  confidence_score: number;
  is_ai_powered: boolean;
  is_new_feature: boolean;
}

export default function AIFeatureRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documentation/ai/recommendations');
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (featureKey: string) => {
    setDismissed(prev => new Set(prev).add(featureKey));
  };

  const handleClick = async (recommendation: Recommendation) => {
    // Track recommendation click
    try {
      await fetch('/api/documentation/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureKey: recommendation.feature_key,
          clicked: true,
        }),
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }

    // Open feature documentation (you can integrate with your modal system)
    console.log('Open feature:', recommendation.feature_key);
  };

  const visibleRecommendations = recommendations.filter(
    r => !dismissed.has(r.feature_key)
  ).slice(0, 3);

  if (loading || visibleRecommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">Recommended for You</h3>
      </div>

      <AnimatePresence>
        {visibleRecommendations.map((rec, idx) => (
          <motion.div
            key={rec.feature_key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: idx * 0.1 }}
            className="relative bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-4 hover:border-amber-500/50 transition-all group"
          >
            <button
              onClick={() => handleDismiss(rec.feature_key)}
              className="absolute top-2 right-2 p-1 hover:bg-slate-700/50 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-lg flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-amber-300" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white">{rec.feature_name}</h4>
                  {rec.is_new_feature && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-300 rounded">
                      New
                    </span>
                  )}
                  {rec.is_ai_powered && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-300 rounded">
                      AI
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-300 mb-2">{rec.short_description}</p>

                <div className="flex items-start gap-2 p-2 bg-slate-700/30 rounded text-xs text-slate-400 mb-3">
                  <Sparkles className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span>{rec.recommendation_reason}</span>
                </div>

                <button
                  onClick={() => handleClick(rec)}
                  className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  Learn more
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

