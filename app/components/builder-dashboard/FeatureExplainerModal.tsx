"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Info, Search, Play, CheckCircle2 } from 'lucide-react';

interface FeatureExplanation {
  id: string;
  title: string;
  description: string;
  how_it_works: string[];
  benefits: string[];
  metrics: {
    label: string;
    value: string;
    context: string;
  }[];
  video_url?: string;
  documentation_link?: string;
}

const THARAGA_FEATURES: FeatureExplanation[] = [
  {
    id: 'behavioral_automation',
    title: 'Behavioral Psychology-Driven Automation',
    description: 'Our AI tracks every buyer interaction in real-time to understand their psychological profile (Monkey/Lion/Dog buyer types) and automatically triggers personalized marketing workflows.',
    how_it_works: [
      'Tracks 20+ micro-behaviors (time spent, clicks, downloads, searches)',
      'Classifies buyers into 3 psychological types with 85%+ confidence',
      'Monitors 10 readiness signals to identify "hot" leads',
      'Triggers personalized messages at optimal times via WhatsApp/Email/SMS',
      'Auto-assigns best-fit agents based on buyer psychology',
    ],
    benefits: [
      'Convert 3x more leads compared to manual follow-up',
      'Reduce response time from hours to seconds',
      'Match buyers with right properties automatically',
      'Save 15+ hours per week on lead nurturing',
      'Increase qualified lead ratio by 50%+',
    ],
    metrics: [
      { label: 'Lead Conversion Rate', value: '+3x', context: 'vs manual outreach' },
      { label: 'Response Time', value: '< 2 minutes', context: 'average' },
      { label: 'Agent Productivity', value: '+40%', context: 'time saved' },
    ],
  },
  {
    id: 'ai_content_generation',
    title: 'AI-Powered Content Factory (50+ Variants)',
    description: 'Automatically generates 50+ marketing content variants in 5 languages when you add a new property - including ads, emails, WhatsApp messages, social posts, blog articles, and video scripts.',
    how_it_works: [
      'Analyzes property details + market context',
      'Generates content for 10+ channels (Google Ads, Facebook, Instagram, LinkedIn, Twitter)',
      'Creates 5 psychological variants (emotional, rational, urgency, luxury, investment)',
      'Translates into Hindi, Tamil, Kannada, Telugu with cultural adaptation',
      'A/B tests variants to identify best performers',
    ],
    benefits: [
      'Launch campaigns in 5 minutes (vs 5+ hours manually)',
      'Professional copywriting quality without hiring agencies',
      'Multi-language reach for wider audience',
      'Continuous A/B testing for optimization',
      'Consistent brand voice across all channels',
    ],
    metrics: [
      { label: 'Content Variants', value: '50+', context: 'per property' },
      { label: 'Languages Supported', value: '5', context: 'automated translation' },
      { label: 'Launch Time', value: '5 mins', context: 'vs 5+ hours' },
    ],
  },
  {
    id: 'progressive_lead_capture',
    title: 'Progressive Profiling Lead Forms',
    description: 'Intelligent multi-step forms that collect data gradually, providing value at each stage. Increases completion rates from 2-3% to 8-12% through psychological optimization.',
    how_it_works: [
      'Step 1: Micro-commitment (no email required)',
      'Step 2: Value exchange (email for personalized results)',
      'Step 3: Qualification (phone + budget after showing value)',
      'Step 4: Deep profile (preferences + timeline)',
      'A/B testing framework for continuous optimization',
    ],
    benefits: [
      '8-12% completion rate (vs 2-3% industry standard)',
      'Higher quality leads with complete information',
      'Reduced form abandonment through progressive disclosure',
      'Better lead qualification before contact',
      'Automated lead scoring and routing',
    ],
    metrics: [
      { label: 'Completion Rate', value: '8-12%', context: 'vs 2-3% standard' },
      { label: 'Lead Quality', value: '+65%', context: 'higher scores' },
      { label: 'Time to Convert', value: '-40%', context: 'faster' },
    ],
  },
  {
    id: 'readiness_scoring',
    title: '10-Point Readiness Score System',
    description: 'Real-time monitoring of 10 critical buyer signals to identify hot leads ready to purchase. Automatically triggers high-priority workflows for maximum conversion.',
    how_it_works: [
      'Tracks 10 readiness signals (time spent, calculator use, document downloads, etc.)',
      'Calculates real-time readiness score (0-10)',
      'Determines urgency level (LOW, MEDIUM, HIGH, CRITICAL)',
      'Triggers appropriate workflow based on score',
      'Calculates optimal contact time based on buyer behavior patterns',
    ],
    benefits: [
      '3x conversion rate for high-readiness leads',
      'Immediate response to hot leads (< 2 minutes)',
      'Prioritized agent assignment',
      'Reduced time wasted on cold leads',
      'Better resource allocation',
    ],
    metrics: [
      { label: 'Hot Lead Conversion', value: '3x', context: 'higher rate' },
      { label: 'Response Time', value: '< 2 min', context: 'for critical leads' },
      { label: 'Lead Prioritization', value: '100%', context: 'accuracy' },
    ],
  },
];

interface FeatureDetailModalProps {
  feature: FeatureExplanation;
  onClose: () => void;
}

function FeatureDetailModal({ feature, onClose }: FeatureDetailModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25 p-8"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-500/20 rounded-lg">
              <Zap className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{feature.title}</h2>
              <p className="text-slate-300">{feature.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {feature.metrics.map((metric, index) => (
            <div
              key={index}
              className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50"
            >
              <div className="text-2xl font-bold text-amber-300 mb-1">{metric.value}</div>
              <div className="text-sm text-slate-300 mb-1">{metric.label}</div>
              <div className="text-xs text-slate-400">{metric.context}</div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-amber-300" />
            How It Works
          </h3>
          <ul className="space-y-3">
            {feature.how_it_works.map((item, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Benefits */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            Key Benefits
          </h3>
          <ul className="space-y-3">
            {feature.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-300">
                <div className="w-2 h-2 rounded-full bg-amber-300 mt-2 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FeatureExplainerDashboard() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFeatures = THARAGA_FEATURES.filter(
    (feature) =>
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20 glow-border rounded-xl border border-amber-300/25"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-500/20 rounded-lg">
              <Sparkles className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Tharaga Platform Features</h2>
              <p className="text-slate-300 mt-1">
                Advanced marketing automation built specifically for Indian real estate builders
              </p>
            </div>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 font-medium rounded-lg hover:shadow-lg transition-all">
            Watch Platform Tour →
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-800/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none"
          />
        </div>
      </motion.div>

      {/* Feature Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredFeatures.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setActiveFeature(feature.id)}
            className="p-6 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-slate-700/50 cursor-pointer hover:border-amber-300/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-all">
                <Zap className="w-6 h-6 text-amber-300" />
              </div>
              <button className="text-slate-400 hover:text-amber-300 transition-colors">
                <Info className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
              {feature.title}
            </h3>
            <p className="text-sm text-slate-300 mb-4 line-clamp-3">{feature.description}</p>

            {/* Metrics Preview */}
            <div className="flex items-center gap-4 pt-4 border-t border-slate-700/50">
              {feature.metrics.slice(0, 2).map((metric, idx) => (
                <div key={idx} className="flex-1">
                  <div className="text-xl font-bold text-amber-300">{metric.value}</div>
                  <div className="text-xs text-slate-400">{metric.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detailed View Modal */}
      <AnimatePresence>
        {activeFeature && (
          <FeatureDetailModal
            feature={THARAGA_FEATURES.find((f) => f.id === activeFeature)!}
            onClose={() => setActiveFeature(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

