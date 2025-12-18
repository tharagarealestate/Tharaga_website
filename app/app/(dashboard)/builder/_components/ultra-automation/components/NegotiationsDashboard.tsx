/**
 * Negotiations Dashboard Component
 * Advanced negotiation tracking with price strategy analysis
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Handshake,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Lightbulb,
  User,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNegotiations } from '../hooks/useUltraAutomationData';
import { analyzeNegotiations, formatSmartDate } from '../utils/dataProcessing';
import { LoadingSpinner, GlassLoadingOverlay } from '@/components/ui/loading-spinner';
import { ErrorDisplay } from '../../ErrorDisplay';
import type { ApiError } from '../hooks/useUltraAutomationData';
import { builderGlassPanel, builderGlassSubPanel } from '../../builderGlassStyles';

interface NegotiationsDashboardProps {
  builderId?: string;
}

export function NegotiationsDashboard({ builderId }: NegotiationsDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  
  const { data, isLoading, error } = useNegotiations({
    builder_id: builderId,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const negotiations = data?.negotiations || [];
  const insights = data?.insights || [];
  const isEmpty = data?.isEmpty || false;

  // Analyze negotiations
  const analysis = useMemo(() => {
    return analyzeNegotiations(negotiations);
  }, [negotiations]);

  if (isLoading) {
    return (
      <div className={builderGlassPanel + ' p-6'}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={builderGlassSubPanel + ' h-32 relative'}>
              <GlassLoadingOverlay />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isLoading && !error && isEmpty) {
    return (
      <div className={glassPrimary + ' p-6 text-center'}>
        <Handshake className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-blue-400 mb-2">No Negotiations Yet</h3>
        <p className="text-gray-400">
          Negotiations will appear here once price discussions begin with leads.
        </p>
      </div>
    );
  }

  if (error) {
    const apiError = error as ApiError;
    return (
      <ErrorDisplay
        errorType={apiError.type || 'UNKNOWN_ERROR'}
        message={apiError.userMessage || apiError.message}
        technicalDetails={apiError.technicalDetails}
        onRetry={() => window.location.reload()}
        retryable={apiError.retryable !== false}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Analysis */}
      <div className={glassPrimary + ' p-6'}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Negotiations</h3>
            <p className="text-sm text-gray-400">Track and manage price negotiations</p>
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'active', 'completed', 'cancelled'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                  statusFilter === filter
                    ? 'bg-gold-500/20 border-gold-500/40 text-gold-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                )}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <AnalysisCard
            icon={Handshake}
            label="Active Negotiations"
            value={analysis.activeCount}
            color="text-blue-400"
          />
          <AnalysisCard
            icon={TrendingUp}
            label="Avg Price Gap"
            value={`${analysis.avgPriceGap.toFixed(1)}%`}
            color="text-orange-400"
          />
          <AnalysisCard
            icon={BarChart3}
            label="Success Probability"
            value={`${analysis.successProbability.toFixed(0)}%`}
            color="text-emerald-400"
          />
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className={glassPrimary + ' p-6'}>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h4 className="text-lg font-semibold text-white">AI Recommendations</h4>
          </div>
          <div className="space-y-3">
            {analysis.recommendations.slice(0, 5).map((rec) => (
              <RecommendationCard key={rec.negotiationId} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Negotiations List */}
      <div className="space-y-4">
        {negotiations.length === 0 ? (
          <div className={glassPrimary + ' p-12 text-center'}>
            <Handshake className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400">No negotiations found</p>
          </div>
        ) : (
          negotiations.map((negotiation: any) => (
            <NegotiationCard key={negotiation.id} negotiation={negotiation} />
          ))
        )}
      </div>
    </div>
  );
}

function NegotiationCard({ negotiation }: { negotiation: any }) {
  const askingPrice = negotiation.asking_price || 0;
  const currentPrice = negotiation.current_price || 0;
  const gap = Math.abs(askingPrice - currentPrice);
  const gapPercent = askingPrice > 0 ? (gap / askingPrice) * 100 : 0;
  const isPriceUp = currentPrice > askingPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={glassPrimary + ' p-6'}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h5 className="font-semibold text-white">
              {negotiation.journey?.lead?.lead_buyer_name || 'Unknown Lead'}
            </h5>
            <span className={cn(
              'px-2 py-1 rounded text-xs font-medium',
              negotiation.status === 'active'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : negotiation.status === 'completed'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            )}>
              {negotiation.status}
            </span>
          </div>
          {negotiation.journey?.property && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Building2 className="w-4 h-4" />
              <span>{negotiation.journey.property.title}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">Price Gap</div>
          <div className={cn(
            'text-lg font-bold',
            gapPercent < 5 ? 'text-emerald-400' : gapPercent < 15 ? 'text-yellow-400' : 'text-red-400'
          )}>
            {gapPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Price Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={glassSecondary + ' p-4'}>
          <div className="text-xs text-gray-400 mb-1">Asking Price</div>
          <div className="text-xl font-bold text-white">
            ₹{askingPrice.toLocaleString('en-IN')}
          </div>
        </div>
        <div className={glassSecondary + ' p-4'}>
          <div className="text-xs text-gray-400 mb-1">Current Offer</div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-white">
              ₹{currentPrice.toLocaleString('en-IN')}
            </div>
            {isPriceUp ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      {negotiation.insights && negotiation.insights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-xs text-gray-400 mb-2">Strategy Insights</div>
          <div className="space-y-2">
            {negotiation.insights.slice(0, 2).map((insight: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>{insight.recommendation || insight.insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function AnalysisCard({ icon: Icon, label, value, color }: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className={glassSecondary + ' p-4'}>
      <Icon className={cn('w-6 h-6 mb-3', color)} />
      <div className={cn('text-2xl font-bold mb-1', color)}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function RecommendationCard({ recommendation }: {
  recommendation: {
    negotiationId: string;
    recommendedAction: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
  };
}) {
  const priorityColors = {
    high: 'bg-red-500/20 border-red-500/30 text-red-400',
    medium: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    low: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  };

  return (
    <div className={cn(glassSecondary, 'p-4 border', priorityColors[recommendation.priority])}>
      <div className="flex items-start justify-between mb-2">
        <h6 className="font-semibold text-white">{recommendation.recommendedAction}</h6>
        <span className={cn('px-2 py-1 rounded text-xs font-medium', priorityColors[recommendation.priority])}>
          {recommendation.priority.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-gray-300">{recommendation.reasoning}</p>
    </div>
  );
}

