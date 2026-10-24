'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  MapPin,
  Home,
  TrendingUp,
  Clock,
  Eye,
  Star,
  Target,
  Zap,
  Brain,
  DollarSign,
  BarChart3,
  Activity,
  AlertCircle,
  Plus,
  Download,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getSupabase } from '@/lib/supabase';
import SmartScoreCard from '@/components/leads/SmartScoreCard';
import { BuyerJourneyTimeline } from '../../../_components/ultra-automation/components/BuyerJourneyTimeline';

interface LeadDetail {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  last_login: string | null;
  score: number;
  category: string;
  score_breakdown: {
    budget_alignment: number;
    engagement: number;
    property_fit: number;
    time_investment: number;
    contact_intent: number;
    recency: number;
  };
  score_history: Array<{
    score: number;
    timestamp: string;
    category: string;
  }>;
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  preferred_property_type: string | null;
  additional_requirements: string | null;
  behavior_summary: {
    total_sessions: number;
    total_views: number;
    total_time_spent: number;
    avg_session_duration: number;
    most_active_day: string;
    most_active_hour: number;
    device_breakdown: Record<string, number>;
  };
  viewed_properties: Array<{
    property_id: string;
    property_title: string;
    property_price: number;
    property_location: string;
    view_count: number;
    total_time_spent: number;
    first_viewed: string;
    last_viewed: string;
    engagement_score: number;
  }>;
  activity_timeline: Array<{
    type: 'behavior' | 'interaction' | 'score_change';
    timestamp: string;
    description: string;
    metadata: Record<string, any>;
  }>;
  interactions: Array<{
    id: string;
    type: string;
    timestamp: string;
    status: string;
    notes: string | null;
    outcome: string | null;
    response_time: number | null;
  }>;
  recommendations: {
    suggested_properties: string[];
    next_best_action: string;
    optimal_contact_time: string;
    conversion_probability: number;
  };
}

interface LeadDetailModalProps {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
}

type CategoryKey =
  | 'Hot Lead'
  | 'Warm Lead'
  | 'Developing Lead'
  | 'Cold Lead'
  | 'Low Quality';

const CATEGORY_STYLES: Record<
  CategoryKey,
  {
    gradient: string;
    text: string;
    bg: string;
    border: string;
    glow: string;
  }
> = {
  'Hot Lead': {
    gradient: 'from-amber-500 to-orange-500',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/30',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.4)]',
  },
  'Warm Lead': {
    gradient: 'from-blue-500 to-cyan-500',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-400/30',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  },
  'Developing Lead': {
    gradient: 'from-purple-500 to-pink-500',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-400/30',
    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]',
  },
  'Cold Lead': {
    gradient: 'from-slate-500 to-gray-500',
    text: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-400/30',
    glow: 'shadow-none',
  },
  'Low Quality': {
    gradient: 'from-red-500 to-rose-500',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-400/30',
    glow: 'shadow-none',
  },
};

const COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#F97316', '#E11D48'];

export function LeadDetailModal({ leadId, isOpen, onClose }: LeadDetailModalProps) {
  const supabase = useMemo(() => getSupabase(), []);

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'properties' | 'analytics' | 'buyer-journey'>('overview');
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [interactionForm, setInteractionForm] = useState({
    type: 'phone_call',
    notes: '',
    outcome: '',
    scheduled_for: '',
  });
  const hasLoadedRef = useRef(false);

  const fetchLeadDetails = useCallback(async () => {
    if (!leadId) return;

    if (!hasLoadedRef.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch lead details');
      }

      const result = await response.json();
      setLead(result.data as LeadDetail);
      hasLoadedRef.current = true;
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching lead details:', err);
      setError('Failed to load lead details. Please try again.');
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (isOpen && leadId) {
      void fetchLeadDetails();
    }
  }, [fetchLeadDetails, isOpen, leadId]);

  useEffect(() => {
    if (!leadId || !isOpen) return;

    const scoreChannel = supabase
      .channel(`lead-score-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lead_scores',
          filter: `user_id=eq.${leadId}`,
        },
        () => {
          void fetchLeadDetails();
        },
      )
      .subscribe();

    const interactionChannel = supabase
      .channel(`lead-interactions-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lead_interactions',
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          void fetchLeadDetails();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scoreChannel);
      supabase.removeChannel(interactionChannel);
    };
  }, [fetchLeadDetails, isOpen, leadId, supabase]);

  const handleAddInteraction = async () => {
    if (!interactionForm.notes.trim()) {
      alert('Please add notes for this interaction');
      return;
    }

    try {
      const response = await fetch(`/api/leads/${leadId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interaction_type: interactionForm.type,
          notes: interactionForm.notes,
          outcome: interactionForm.outcome || undefined,
          scheduled_for: interactionForm.scheduled_for || undefined,
          status: interactionForm.scheduled_for ? 'scheduled' : 'completed',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add interaction');
      }

      setInteractionForm({
        type: 'phone_call',
        notes: '',
        outcome: '',
        scheduled_for: '',
      });
      setIsAddingInteraction(false);
      void fetchLeadDetails();
    } catch (err) {
      console.error('Failed to add interaction:', err);
      alert('Failed to add interaction. Please try again.');
    }
  };

  const handleQuickAction = async (action: 'email' | 'phone' | 'whatsapp') => {
    if (!lead) return;

    if (action === 'email') {
      window.location.href = `mailto:${lead.email}`;
    } else if (action === 'phone' && lead.phone) {
      window.location.href = `tel:${lead.phone}`;
    } else if (action === 'whatsapp' && lead.phone) {
      window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer');
    }

    await fetch(`/api/leads/${leadId}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interaction_type:
          action === 'email'
            ? 'email_sent'
            : action === 'phone'
              ? 'phone_call'
              : 'whatsapp_message',
        notes: `Quick action from lead profile`,
        status: 'completed',
      }),
    });

    void fetchLeadDetails();
  };

  const handleExportProfile = () => {
    if (!lead) return;

    const dataStr = JSON.stringify(lead, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lead-${lead.full_name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const categoryStyle =
    lead && lead.category in CATEGORY_STYLES
      ? CATEGORY_STYLES[lead.category as CategoryKey]
      : CATEGORY_STYLES['Cold Lead'];

  const scoreBreakdownData =
    lead?.score_breakdown
      ? [
          { name: 'Budget', value: lead.score_breakdown.budget_alignment, fullMark: 10 },
          { name: 'Engagement', value: lead.score_breakdown.engagement, fullMark: 10 },
          { name: 'Property Fit', value: lead.score_breakdown.property_fit, fullMark: 10 },
          { name: 'Time Investment', value: lead.score_breakdown.time_investment, fullMark: 10 },
          { name: 'Contact Intent', value: lead.score_breakdown.contact_intent, fullMark: 10 },
          { name: 'Recency', value: lead.score_breakdown.recency, fullMark: 10 },
        ]
      : [];

  const scoreHistoryData =
    lead?.score_history?.map((entry) => ({
      date: new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: entry.score,
    })).reverse() ?? [];

  const deviceBreakdownData =
    lead?.behavior_summary
      ? Object.entries(lead.behavior_summary.device_breakdown || {}).map(([device, count]) => ({
          name: device.charAt(0).toUpperCase() + device.slice(1),
          value: count,
        }))
      : [];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-2xl flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 240 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-7xl max-h-[95vh] bg-gradient-to-br from-slate-950 via-primary-950 to-slate-900 rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(15,23,42,0.6)] border border-white/10"
        >
          <div
            className={`sticky top-0 z-20 backdrop-blur-xl bg-gradient-to-r ${categoryStyle.gradient} bg-opacity-10 border-b border-white/10 p-6`}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center text-white font-bold text-3xl ${categoryStyle.glow}`}
                >
                  {lead?.full_name?.charAt(0).toUpperCase() ?? '?'}
                </motion.div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold text-white mb-2"
                  >
                    {lead?.full_name || 'Loading...'}
                  </motion.h2>

                  {lead && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-wrap gap-4 text-slate-200/80 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Joined{' '}
                          {new Date(lead.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {lead && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mt-3"
                    >
                      <span
                        className={`inline-block px-4 py-2 rounded-full text-sm font-bold border-2 ${categoryStyle.bg} ${categoryStyle.border} ${categoryStyle.text} ${categoryStyle.glow}`}
                      >
                        {lead.category}
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {lead && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickAction('email')}
                      className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                      title="Send Email"
                    >
                      <Mail className="w-5 h-5" />
                    </motion.button>
                    {lead.phone && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleQuickAction('phone')}
                          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                          title="Call"
                        >
                          <Phone className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleQuickAction('whatsapp')}
                          className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transition-all"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </motion.button>
                      </>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleExportProfile}
                      className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                      title="Export Profile"
                    >
                      <Download className="w-5 h-5" />
                    </motion.button>
                  </>
                )}
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-3 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-300 transition-all"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(95vh - 150px)' }}>
            {isLoading && (
              <div className="p-12 text-center space-y-4">
                <div className="inline-block w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-slate-400">Loading lead details…</p>
              </div>
            )}

            {error && (
              <div className="p-12 text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
                <p className="text-red-400">{error}</p>
                <button
                  onClick={() => void fetchLeadDetails()}
                  className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  Retry
                </button>
              </div>
            )}

            {lead && !isLoading && !error && (
              <>
                <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-6">
                  <div className="flex gap-2 overflow-x-auto">
                    {[
                      { id: 'overview', label: 'Overview', icon: <Target className="w-4 h-4" /> },
                      { id: 'timeline', label: 'Timeline', icon: <Activity className="w-4 h-4" /> },
                      { id: 'buyer-journey', label: 'Buyer Journey', icon: <Sparkles className="w-4 h-4" /> },
                      { id: 'properties', label: 'Properties', icon: <Home className="w-4 h-4" /> },
                      { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
                    ].map((tab) => (
                      <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${
                          activeTab === tab.id
                            ? `border-amber-500 ${categoryStyle.text} font-semibold`
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                      <OverviewTab
                        lead={lead}
                        categoryStyle={categoryStyle}
                      />
                    )}

                    {activeTab === 'timeline' && (
                      <TimelineTab
                        timeline={lead.activity_timeline}
                        interactions={lead.interactions}
                        isAddingInteraction={isAddingInteraction}
                        setIsAddingInteraction={setIsAddingInteraction}
                        interactionForm={interactionForm}
                        setInteractionForm={setInteractionForm}
                        handleAddInteraction={handleAddInteraction}
                      />
                    )}

                    {activeTab === 'buyer-journey' && (
                      <div className="py-4">
                        <BuyerJourneyTimeline leadId={leadId} />
                      </div>
                    )}

                    {activeTab === 'properties' && <PropertiesTab properties={lead.viewed_properties} />}

                    {activeTab === 'analytics' && (
                      <AnalyticsTab
                        lead={lead}
                        scoreBreakdownData={scoreBreakdownData}
                        scoreHistoryData={scoreHistoryData}
                        deviceBreakdownData={deviceBreakdownData}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function OverviewTab({ lead, categoryStyle }: { lead: LeadDetail; categoryStyle: (typeof CATEGORY_STYLES)[CategoryKey] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* SmartScore 2.0 Card */}
      <div className="mb-6">
        <SmartScoreCard leadId={lead.id.toString()} variant="glass" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`lg:col-span-1 p-6 rounded-2xl bg-gradient-to-br ${categoryStyle.gradient} bg-opacity-10 border ${categoryStyle.border} ${categoryStyle.glow}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Lead Score</h3>
            <Star className={`w-6 h-6 ${categoryStyle.text}`} />
          </div>

          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className={`text-6xl font-bold ${categoryStyle.text} mb-2`}
            >
              {lead.score.toFixed(1)}
            </motion.div>
            <p className="text-slate-300 text-sm">out of 10.0</p>

            <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((lead.score / 10) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className={`h-full bg-gradient-to-r ${categoryStyle.gradient}`}
              />
            </div>

            {lead.recommendations && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-slate-300/80 mb-2">Conversion Probability</p>
                <p className={`text-2xl font-bold ${categoryStyle.text}`}>
                  {lead.recommendations.conversion_probability.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <QuickStatCard
            icon={<Eye className="w-5 h-5" />}
            label="Property Views"
            value={lead.behavior_summary.total_views}
            color="from-blue-500 to-cyan-500"
          />
          <QuickStatCard
            icon={<MessageCircle className="w-5 h-5" />}
            label="Interactions"
            value={lead.interactions.length}
            color="from-purple-500 to-pink-500"
          />
          <QuickStatCard
            icon={<Clock className="w-5 h-5" />}
            label="Time Spent"
            value={`${Math.round(lead.behavior_summary.total_time_spent / 60)}m`}
            color="from-emerald-500 to-teal-500"
          />
          <QuickStatCard
            icon={<Activity className="w-5 h-5" />}
            label="Sessions"
            value={lead.behavior_summary.total_sessions}
            color="from-orange-500 to-red-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-400" />
            Score Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Budget Alignment', value: lead.score_breakdown.budget_alignment, icon: <DollarSign className="w-4 h-4" /> },
              { label: 'Engagement', value: lead.score_breakdown.engagement, icon: <Zap className="w-4 h-4" /> },
              { label: 'Property Fit', value: lead.score_breakdown.property_fit, icon: <Home className="w-4 h-4" /> },
              { label: 'Time Investment', value: lead.score_breakdown.time_investment, icon: <Clock className="w-4 h-4" /> },
              { label: 'Contact Intent', value: lead.score_breakdown.contact_intent, icon: <Target className="w-4 h-4" /> },
              { label: 'Recency', value: lead.score_breakdown.recency, icon: <TrendingUp className="w-4 h-4" /> },
            ].map((factor, index) => (
              <motion.div
                key={factor.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-slate-200">
                    {factor.icon}
                    <span className="text-sm">{factor.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{factor.value.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((factor.value / 10) * 100, 100)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`h-full bg-gradient-to-r ${categoryStyle.gradient}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/30 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-400" />
            AI Recommendations
          </h3>
          <div className="space-y-4">
            {lead.recommendations?.next_best_action && (
              <div className="p-4 rounded-xl bg-white/10 border border-white/10">
                <p className="text-xs text-amber-300 font-semibold mb-2">🎯 NEXT BEST ACTION</p>
                <p className="text-white font-medium">{lead.recommendations.next_best_action}</p>
              </div>
            )}
            {lead.recommendations?.optimal_contact_time && (
              <div className="p-4 rounded-xl bg-white/10 border border-white/10">
                <p className="text-xs text-blue-300 font-semibold mb-2">⏰ OPTIMAL CONTACT TIME</p>
                <p className="text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-300" />
                  {lead.recommendations.optimal_contact_time}
                </p>
              </div>
            )}
            {lead.recommendations?.suggested_properties?.length ? (
              <div className="p-4 rounded-xl bg-white/10 border border-white/10">
                <p className="text-xs text-purple-300 font-semibold mb-2">🏠 PROPERTY MATCHES</p>
                <p className="text-white">
                  {lead.recommendations.suggested_properties.length} properties match their preferences
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">Budget & Preferences</h3>
          {lead.budget_min !== null && lead.budget_max !== null && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Budget Range</p>
              <p className="text-lg font-semibold text-white">
                ₹{(lead.budget_min / 10000000).toFixed(2)}Cr - ₹{(lead.budget_max / 10000000).toFixed(2)}Cr
              </p>
            </div>
          )}
          {lead.preferred_location && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Preferred Location</p>
              <p className="text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                {lead.preferred_location}
              </p>
            </div>
          )}
          {lead.preferred_property_type && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Property Type</p>
              <p className="text-white flex items-center gap-2">
                <Home className="w-4 h-4 text-purple-400" />
                {lead.preferred_property_type}
              </p>
            </div>
          )}
          {lead.additional_requirements && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Additional Requirements</p>
              <p className="text-white text-sm">{lead.additional_requirements}</p>
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-4">
          <h3 className="text-lg font-semibold text-white">Behavior Insights</h3>
          <div>
            <p className="text-sm text-slate-400 mb-1">Most Active Day</p>
            <p className="text-white font-medium">{lead.behavior_summary.most_active_day}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Most Active Hour</p>
            <p className="text-white font-medium">
              {lead.behavior_summary.most_active_hour}:00 - {lead.behavior_summary.most_active_hour + 1}:00
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Avg Session Duration</p>
            <p className="text-white font-medium">
              {Math.round(lead.behavior_summary.avg_session_duration / 60)} minutes
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Primary Device</p>
            <p className="text-white font-medium capitalize">
              {Object.entries(lead.behavior_summary.device_breakdown)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickStatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${color} bg-opacity-20 text-white`}>{icon}</div>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
      <p className="text-sm text-slate-400">{label}</p>
    </motion.div>
  );
}

function TimelineTab({
  timeline,
  interactions,
  isAddingInteraction,
  setIsAddingInteraction,
  interactionForm,
  setInteractionForm,
  handleAddInteraction,
}: {
  timeline: LeadDetail['activity_timeline'];
  interactions: LeadDetail['interactions'];
  isAddingInteraction: boolean;
  setIsAddingInteraction: (val: boolean) => void;
  interactionForm: {
    type: string;
    notes: string;
    outcome: string;
    scheduled_for: string;
  };
  setInteractionForm: (form: {
    type: string;
    notes: string;
    outcome: string;
    scheduled_for: string;
  }) => void;
  handleAddInteraction: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsAddingInteraction(!isAddingInteraction)}
        className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add New Interaction
      </motion.button>

      <AnimatePresence initial={false}>
        {isAddingInteraction && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Log Interaction</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Interaction Type</label>
                <select
                  value={interactionForm.type}
                  onChange={(e) =>
                    setInteractionForm({
                      ...interactionForm,
                      type: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="phone_call">📞 Phone Call</option>
                  <option value="email_sent">✉️ Email Sent</option>
                  <option value="whatsapp_message">💬 WhatsApp Message</option>
                  <option value="site_visit_scheduled">🏠 Site Visit Scheduled</option>
                  <option value="site_visit_completed">✅ Site Visit Completed</option>
                  <option value="negotiation_started">💰 Negotiation Started</option>
                  <option value="offer_made">🤝 Offer Made</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Notes *</label>
                <textarea
                  value={interactionForm.notes}
                  onChange={(e) =>
                    setInteractionForm({
                      ...interactionForm,
                      notes: e.target.value,
                    })
                  }
                  placeholder="What happened during this interaction?"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Outcome</label>
                <input
                  type="text"
                  value={interactionForm.outcome}
                  onChange={(e) =>
                    setInteractionForm({
                      ...interactionForm,
                      outcome: e.target.value,
                    })
                  }
                  placeholder="e.g., Interested, Need follow-up, Not interested"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddInteraction}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold transition-all"
                >
                  Save Interaction
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAddingInteraction(false)}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {timeline.slice(0, 20).map((event, index) => (
          <TimelineEvent key={`${event.timestamp}-${index}`} event={event} index={index} />
        ))}

        {timeline.length === 0 && (
          <div className="p-12 text-center">
            <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No activity yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TimelineEvent({
  event,
  index,
}: {
  event: LeadDetail['activity_timeline'][number];
  index: number;
}) {
  const getEventIcon = () => {
    if (event.type === 'behavior') {
      return <Eye className="w-4 h-4" />;
    }
    if (event.type === 'interaction') {
      return <MessageCircle className="w-4 h-4" />;
    }
    return <TrendingUp className="w-4 h-4" />;
  };

  const getEventColor = () => {
    if (event.type === 'behavior') return 'from-blue-500 to-cyan-500';
    if (event.type === 'interaction') return 'from-purple-500 to-pink-500';
    return 'from-amber-500 to-orange-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
    >
      <div className={`p-3 rounded-lg bg-gradient-to-r ${getEventColor()} bg-opacity-20 flex-shrink-0 text-white`}>
        {getEventIcon()}
      </div>
      <div className="flex-1">
        <p className="text-white font-medium mb-1">{event.description}</p>
        <p className="text-sm text-slate-400">
          {new Date(event.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}

function PropertiesTab({ properties }: { properties: LeadDetail['viewed_properties'] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-6"
    >
      {properties.map((property, index) => (
        <motion.div
          key={property.property_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:border-amber-400/30 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">{property.property_title}</h3>
              <p className="text-sm text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {property.property_location}
              </p>
            </div>
            <span className="text-lg font-bold text-amber-400">
              ₹{(property.property_price / 10000000).toFixed(2)}Cr
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Views</p>
              <p className="text-lg font-semibold text-white">{property.view_count}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Time Spent</p>
              <p className="text-lg font-semibold text-white">
                {Math.max(1, Math.round(property.total_time_spent / 60))}m
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Engagement Score</span>
              <span className="text-sm font-bold text-amber-400">
                {property.engagement_score.toFixed(1)}/10
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((property.engagement_score / 10) * 100, 100)}%` }}
                transition={{ duration: 1, delay: index * 0.08 }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Last viewed{' '}
            {new Date(property.last_viewed).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </motion.div>
      ))}

      {properties.length === 0 && (
        <div className="col-span-2 p-12 text-center">
          <Home className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No properties viewed yet</p>
        </div>
      )}
    </motion.div>
  );
}

function AnalyticsTab({
  lead,
  scoreBreakdownData,
  scoreHistoryData,
  deviceBreakdownData,
}: {
  lead: LeadDetail;
  scoreBreakdownData: Array<{ name: string; value: number; fullMark: number }>;
  scoreHistoryData: Array<{ date: string; score: number }>;
  deviceBreakdownData: Array<{ name: string; value: number }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Score History</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={scoreHistoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 10]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ fill: '#F59E0B', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Score Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={scoreBreakdownData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="name" stroke="#94a3b8" />
              <PolarRadiusAxis domain={[0, 10]} stroke="#94a3b8" />
              <Radar name="Score" dataKey="value" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Device Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceBreakdownData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

export default LeadDetailModal;

