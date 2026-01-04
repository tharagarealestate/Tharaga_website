'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X, Brain, Zap, Users, MessageCircle, Mail, Target, UserPlus, TrendingUp, Filter, Bell, Upload, Home, BarChart, Activity, DollarSign, Calculator, CreditCard, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Icon mapping
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

interface Feature {
  feature_key: string;
  feature_name: string;
  short_description: string;
  feature_icon: string;
  icon_color: string;
  is_ai_powered: boolean;
}

export default function FeatureDiscoveryWidget() {
  const [newFeatures, setNewFeatures] = useState<Feature[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    fetchNewFeatures();
    checkDismissedState();
  }, []);

  const fetchNewFeatures = async () => {
    try {
      const response = await fetch('/api/documentation/new-features');
      if (response.ok) {
        const data = await response.json();
        setNewFeatures(data.features?.slice(0, 3) || []); // Show top 3
      }
    } catch (error) {
      console.error('Error fetching new features:', error);
    }
  };

  const checkDismissedState = () => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('feature_widget_dismissed');
      setIsDismissed(dismissed === 'true');
    }
  };

  const dismissWidget = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('feature_widget_dismissed', 'true');
      setIsDismissed(true);
    }
  };

  if (isDismissed || newFeatures.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed bottom-6 right-6 w-80 bg-slate-800/95 backdrop-blur-xl rounded-xl glow-border shadow-2xl z-40"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-white">New Features</h3>
          </div>
          <button
            onClick={dismissWidget}
            className="p-1 hover:bg-slate-700/50 rounded transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Feature List */}
        <div className="p-4 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
          {newFeatures.map((feature, index) => {
            const IconComponent = iconMap[feature.feature_icon] || Brain;
            const iconColorClass = feature.icon_color === 'amber' ? 'text-amber-300' :
              feature.icon_color === 'emerald' ? 'text-emerald-300' :
              feature.icon_color === 'blue' ? 'text-blue-300' :
              'text-purple-300';
            const iconBgClass = feature.icon_color === 'amber' ? 'bg-amber-500/20' :
              feature.icon_color === 'emerald' ? 'bg-emerald-500/20' :
              feature.icon_color === 'blue' ? 'bg-blue-500/20' :
              'bg-purple-500/20';

            return (
              <motion.button
                key={feature.feature_key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  // Open feature documentation modal (implement navigation logic)
                  console.log('Open feature:', feature.feature_key);
                }}
                className="w-full text-left p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all hover:-translate-y-0.5 group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${iconBgClass} flex-shrink-0`}>
                    <IconComponent className={`w-4 h-4 ${iconColorClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white text-sm truncate group-hover:text-amber-300 transition-colors">
                        {feature.feature_name}
                      </h4>
                      {feature.is_ai_powered && (
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {feature.short_description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={() => {
              // Navigate to full feature catalog (implement navigation logic)
              console.log('Navigate to feature catalog');
            }}
            className="w-full px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-amber-500/30"
          >
            Explore All Features
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}





