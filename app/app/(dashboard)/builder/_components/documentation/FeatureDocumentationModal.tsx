'use client';

import { useState, useEffect } from 'react';
import { X, PlayCircle, CheckCircle, ThumbsUp, ThumbsDown, ExternalLink, Brain, Zap, Users, MessageCircle, Mail, Target, UserPlus, TrendingUp, Filter, Bell, Upload, Home, BarChart, Activity, DollarSign, Calculator, CreditCard, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, any> = {
  Brain,
  Zap,
  Users,
  MessageCircle,
  Mail,
  Target,
  UserPlus,
  TrendingUp,
  Filter,
  Bell,
  Upload,
  Home,
  BarChart,
  Activity,
  DollarSign,
  Calculator,
  CreditCard,
  GitBranch
};

interface FeatureDocumentationModalProps {
  featureKey: string;
  isOpen: boolean;
  onClose: () => void;
}

interface FeatureData {
  feature_key: string;
  feature_name: string;
  category: string;
  short_description: string;
  full_description: string;
  benefits: string[];
  use_cases: string[];
  how_to_steps: {
    steps: Array<{
      step_number: number;
      title: string;
      description: string;
      screenshot_url?: string;
      duration_seconds: number;
    }>;
    total_duration_seconds: number;
    difficulty: string;
  };
  video_url?: string;
  related_features: string[];
  tier_required: string;
  is_ai_powered: boolean;
  is_new_feature: boolean;
  feature_icon: string;
  icon_color: string;
}

export default function FeatureDocumentationModal({
  featureKey,
  isOpen,
  onClose
}: FeatureDocumentationModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'howto' | 'examples'>('overview');
  const [featureData, setFeatureData] = useState<FeatureData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && featureKey) {
      fetchFeatureDocumentation();
    }
  }, [isOpen, featureKey]);

  const fetchFeatureDocumentation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/documentation/feature/${featureKey}`);
      if (!response.ok) {
        throw new Error('Failed to fetch feature documentation');
      }
      const data = await response.json();
      setFeatureData(data.feature);
    } catch (error) {
      console.error('Error fetching feature documentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const markHelpful = async (helpful: boolean) => {
    try {
      await fetch('/api/documentation/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_key: featureKey,
          interaction_type: helpful ? 'marked_helpful' : 'marked_not_helpful'
        })
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (!isOpen) return null;

  const IconComponent = featureData?.feature_icon ? iconMap[featureData.feature_icon] || Brain : Brain;
  const iconColorClass = featureData?.icon_color === 'amber' ? 'text-amber-300' :
    featureData?.icon_color === 'emerald' ? 'text-emerald-300' :
    featureData?.icon_color === 'blue' ? 'text-blue-300' :
    'text-purple-300';
  const iconBgClass = featureData?.icon_color === 'amber' ? 'bg-amber-500/20' :
    featureData?.icon_color === 'emerald' ? 'bg-emerald-500/20' :
    featureData?.icon_color === 'blue' ? 'bg-blue-500/20' :
    'bg-purple-500/20';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-800/95 backdrop-blur-xl rounded-xl glow-border max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${iconBgClass}`}>
                <IconComponent className={`w-6 h-6 ${iconColorClass}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {featureData?.feature_name || 'Loading...'}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  {featureData?.is_ai_powered && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                      AI-Powered
                    </span>
                  )}
                  {featureData?.is_new_feature && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      NEW
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700/50">
            {[
              { id: 'overview' as const, label: 'Overview' },
              { id: 'howto' as const, label: 'How It Works' },
              { id: 'examples' as const, label: 'Use Cases' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'text-amber-300'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600 to-amber-500"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              </div>
            ) : featureData ? (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Short Description */}
                    <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 rounded-lg border border-amber-500/20">
                      <p className="text-lg text-slate-200">
                        {featureData.short_description}
                      </p>
                    </div>

                    {/* Full Description */}
                    <div>
                      <h3 className="text-xl font-bold text-white mb-3">
                        What This Feature Does
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {featureData.full_description}
                      </p>
                    </div>

                    {/* Benefits */}
                    <div>
                      <h3 className="text-xl font-bold text-white mb-3">
                        Key Benefits
                      </h3>
                      <div className="grid gap-3">
                        {featureData.benefits?.map((benefit: string, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg"
                          >
                            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <p className="text-slate-300">{benefit}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Video Tutorial */}
                    {featureData.video_url && (
                      <div>
                        <h3 className="text-xl font-bold text-white mb-3">
                          Video Tutorial
                        </h3>
                        <a
                          href={featureData.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors group"
                        >
                          <PlayCircle className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <p className="font-medium text-white">
                              Watch Complete Tutorial
                            </p>
                            <p className="text-sm text-slate-400">
                              {featureData.how_to_steps?.total_duration_seconds
                                ? `${Math.ceil(featureData.how_to_steps.total_duration_seconds / 60)} min`
                                : '5 min'}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400 ml-auto" />
                        </a>
                      </div>
                    )}

                    {/* Tier Required */}
                    <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                      <p className="text-sm text-slate-400">
                        Available on:{' '}
                        <span className={`font-semibold ${
                          featureData.tier_required === 'pro'
                            ? 'text-amber-300'
                            : 'text-emerald-300'
                        }`}>
                          {featureData.tier_required === 'pro' ? 'Tharaga Pro' : 'Free Plan'}
                        </span>
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* How It Works Tab */}
                {activeTab === 'howto' && featureData.how_to_steps?.steps && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {featureData.how_to_steps.steps.map((step: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative pl-8 pb-8 last:pb-0"
                      >
                        {/* Timeline line */}
                        {index !== featureData.how_to_steps.steps.length - 1 && (
                          <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/50 to-slate-700/50" />
                        )}

                        {/* Step number badge */}
                        <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 flex items-center justify-center text-xs font-bold text-slate-900">
                          {step.step_number}
                        </div>

                        {/* Step content */}
                        <div className="ml-6 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-semibold text-white">
                              {step.title}
                            </h4>
                            <span className="text-xs text-slate-500">
                              ~{step.duration_seconds}s
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {step.description}
                          </p>
                          {step.screenshot_url && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-slate-700/50">
                              <img
                                src={step.screenshot_url}
                                alt={step.title}
                                className="w-full h-auto"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {/* Total time */}
                    {featureData.how_to_steps.total_duration_seconds && (
                      <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                        <p className="text-sm text-slate-400">
                          Total setup time:{' '}
                          <span className="font-semibold text-amber-300">
                            ~{Math.ceil(featureData.how_to_steps.total_duration_seconds / 60)} minutes
                          </span>
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Use Cases Tab */}
                {activeTab === 'examples' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-xl font-bold text-white mb-4">
                      Real-World Examples
                    </h3>
                    <div className="grid gap-4">
                      {featureData.use_cases?.map((useCase: string, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-amber-500/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-amber-300">
                                {index + 1}
                              </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed">
                              {useCase}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Related Features */}
                    {featureData.related_features && featureData.related_features.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-white mb-3">
                          Related Features
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {featureData.related_features.map((relatedKey: string, index: number) => (
                            <button
                              key={index}
                              onClick={() => {
                                // Navigate to related feature (implement navigation logic)
                                console.log('Navigate to feature:', relatedKey);
                              }}
                              className="px-4 py-2 bg-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/70 hover:text-amber-300 transition-colors"
                            >
                              {relatedKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400">Feature documentation not found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Was this helpful?</span>
              <button
                onClick={() => markHelpful(true)}
                className="p-2 hover:bg-emerald-500/20 rounded-lg transition-colors group"
              >
                <ThumbsUp className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
              </button>
              <button
                onClick={() => markHelpful(false)}
                className="p-2 hover:bg-rose-500/20 rounded-lg transition-colors group"
              >
                <ThumbsDown className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5"
            >
              Got It!
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}





