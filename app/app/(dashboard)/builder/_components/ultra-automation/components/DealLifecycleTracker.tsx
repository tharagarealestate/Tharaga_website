/**
 * Deal Lifecycle Tracker Component
 * Advanced deal tracking with stalling detection and stage analytics
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Activity,
  ArrowRight,
  User,
  Building2,
  Filter,
  FileQuestion,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDealLifecycles } from '../hooks/useUltraAutomationData';
import { detectStallingDeals, calculateConversionFunnel } from '../utils/dataProcessing';
import { LoadingSpinner, GlassLoadingOverlay } from '@/components/ui/loading-spinner';
import { ErrorDisplay } from '../../ErrorDisplay';
import type { ApiError } from '../hooks/useUltraAutomationData';
import { builderGlassPanel, builderGlassSubPanel } from '../../builderGlassStyles';

interface DealLifecycleTrackerProps {
  builderId?: string;
}

export function DealLifecycleTracker({ builderId }: DealLifecycleTrackerProps) {
  const [stageFilter, setStageFilter] = useState<string>('all');
  
  const { data, isLoading, error } = useDealLifecycles({
    builder_id: builderId,
    stage: stageFilter !== 'all' ? stageFilter : undefined,
  });

  const lifecycles = data?.lifecycles || [];
  const milestones = data?.milestones || [];
  const isEmpty = data?.isEmpty || false;

  // Analyze deals
  const stallingAnalysis = useMemo(() => {
    return detectStallingDeals(lifecycles, {
      warningDays: 7,
      criticalDays: 14,
    });
  }, [lifecycles]);

  // Calculate funnel
  const funnelData = useMemo(() => {
    return calculateConversionFunnel(lifecycles);
  }, [lifecycles]);

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

  if (error) {
    return (
      <div className={builderGlassPanel + ' p-6 text-center'}>
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-400 mb-4">Failed to load deal lifecycles</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gold-500/20 glow-border text-gold-400 rounded-lg hover:bg-gold-500/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const stages = ['discovery', 'interest', 'evaluation', 'negotiation', 'decision', 'closed'];
  const uniqueStages = Array.from(new Set(lifecycles.map((l: any) => l.current_stage).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header with Alerts */}
      <div className={builderGlassPanel + ' p-6'}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Deal Lifecycle</h3>
            <p className="text-sm text-gray-400">Track deals through all stages</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm"
            >
              <option value="all">All Stages</option>
              {uniqueStages.map((stage: string) => (
                <option key={stage} value={stage}>
                  {stage.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <AlertCard
            icon={AlertTriangle}
            label="Stalled Deals"
            value={stallingAnalysis.stalled.length}
            color="text-red-400 bg-red-500/10 border-red-500/20"
            urgent
          />
          <AlertCard
            icon={Clock}
            label="At Risk"
            value={stallingAnalysis.atRisk.length}
            color="text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
          />
          <AlertCard
            icon={CheckCircle2}
            label="Healthy"
            value={stallingAnalysis.healthy.length}
            color="text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
          />
        </div>

        {/* Conversion Funnel */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-4">Conversion Funnel</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FunnelStage
              label="Overall Conversion"
              value={funnelData.overallConversion}
              color="text-emerald-400"
            />
            <FunnelStage
              label="Bottleneck Stages"
              value={funnelData.bottleneckStages.length}
              color="text-orange-400"
            />
          </div>
        </div>
      </div>

      {/* Stalled Deals Alert */}
      {stallingAnalysis.stalled.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h4 className="text-lg font-semibold text-red-400">
              {stallingAnalysis.stalled.length} Stalled Deal{stallingAnalysis.stalled.length > 1 ? 's' : ''}
            </h4>
          </div>
          <div className="space-y-3">
            {stallingAnalysis.stalled.slice(0, 5).map((deal: any) => (
              <StalledDealCard key={deal.id} deal={deal} milestones={milestones} />
            ))}
          </div>
        </div>
      )}

      {/* Deals List */}
      <div className="space-y-4">
        {lifecycles.length === 0 ? (
          <div className={builderGlassPanel + ' p-12 text-center'}>
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400">No deals found</p>
          </div>
        ) : (
          lifecycles.map((lifecycle: any) => (
            <DealCard key={lifecycle.id} lifecycle={lifecycle} milestones={milestones} />
          ))
        )}
      </div>
    </div>
  );
}

function DealCard({ lifecycle, milestones }: { lifecycle: any; milestones: any[] }) {
  const dealMilestones = milestones.filter((m: any) => m.lifecycle_id === lifecycle.id);
  const stageColors: Record<string, string> = {
    discovery: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    interest: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    evaluation: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    negotiation: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    decision: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    closed: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  const stageColor = stageColors[lifecycle.current_stage] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  const isStalled = lifecycle.is_stalling || lifecycle.days_in_stage > 14;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        builderGlassPanel,
        'p-6',
        isStalled && 'border-red-500/30 bg-red-500/5'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h5 className="font-semibold text-white">
              {lifecycle.journey?.lead?.lead_buyer_name || 'Unknown Lead'}
            </h5>
            <span className={cn('px-3 py-1 rounded-lg border text-xs font-medium', stageColor)}>
              {lifecycle.current_stage?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}
            </span>
            {isStalled && (
              <span className="px-3 py-1 rounded-lg border bg-red-500/20 border-red-500/30 text-xs font-medium text-red-400">
                STALLED
              </span>
            )}
          </div>
          {lifecycle.journey?.property && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Building2 className="w-4 h-4" />
              <span>{lifecycle.journey.property.title}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">Days in Stage</div>
          <div className={cn(
            'text-lg font-bold',
            lifecycle.days_in_stage > 14 ? 'text-red-400' : lifecycle.days_in_stage > 7 ? 'text-yellow-400' : 'text-emerald-400'
          )}>
            {lifecycle.days_in_stage || 0}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Stage Progress</span>
          <span>{Math.min(100, ((lifecycle.days_in_stage || 0) / 30) * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all',
              lifecycle.days_in_stage > 14 ? 'bg-red-400' : lifecycle.days_in_stage > 7 ? 'bg-yellow-400' : 'bg-emerald-400'
            )}
            style={{ width: `${Math.min(100, ((lifecycle.days_in_stage || 0) / 30) * 100)}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      {dealMilestones.length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <div className="text-xs text-gray-400 mb-2">Payment Milestones</div>
          <div className="space-y-2">
            {dealMilestones.slice(0, 3).map((milestone: any) => (
              <div key={milestone.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{milestone.milestone_name || 'Milestone'}</span>
                <span className={cn(
                  milestone.status === 'paid' ? 'text-emerald-400' : 'text-gray-400'
                )}>
                  ₹{milestone.amount?.toLocaleString('en-IN') || '0'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StalledDealCard({ deal, milestones }: { deal: any; milestones: any[] }) {
  return (
    <div className="bg-white/5 border border-red-500/20 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h6 className="font-semibold text-white">
            {deal.journey?.lead?.lead_buyer_name || 'Unknown Lead'}
          </h6>
          <p className="text-sm text-gray-400">
            {deal.current_stage?.replace(/_/g, ' ')} • {deal.days_in_stage} days
          </p>
        </div>
        <button className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 hover:bg-red-500/30 transition-all">
          Take Action
        </button>
      </div>
    </div>
  );
}

function AlertCard({ icon: Icon, label, value, color, urgent }: {
  icon: any;
  label: string;
  value: number;
  color: string;
  urgent?: boolean;
}) {
  return (
    <div className={cn(builderGlassSubPanel, 'p-4 border', color.split(' ').slice(1).join(' '))}>
      <Icon className={cn('w-6 h-6 mb-3', color.split(' ')[0])} />
      <div className={cn('text-2xl font-bold mb-1', color.split(' ')[0])}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function FunnelStage({ label, value, color }: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={builderGlassSubPanel + ' p-4'}>
      <div className={cn('text-2xl font-bold mb-1', color)}>{value.toFixed(1)}%</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

