/**
 * Viewings Calendar Component
 * Displays property viewings with calendar view and list view
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  CalendarDays,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewings } from '../hooks/useUltraAutomationData';
import { filterAndSortViewings, formatSmartDate } from '../utils/dataProcessing';
import { LoadingSpinner, GlassLoadingOverlay } from '@/components/ui/loading-spinner';
import { ErrorDisplay } from '../../ErrorDisplay';
import type { ApiError } from '../hooks/useUltraAutomationData';
import { builderGlassPanel, builderGlassSubPanel } from '../../builderGlassStyles';

interface ViewingsCalendarProps {
  builderId?: string;
  initialFilter?: 'scheduled' | 'completed' | 'cancelled' | 'all';
}

export function ViewingsCalendar({ builderId, initialFilter = 'all' }: ViewingsCalendarProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  
  const { data, isLoading, error } = useViewings({ 
    builder_id: builderId,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const viewings = data?.viewings || [];
  const reminders = data?.reminders || [];
  const isEmpty = data?.isEmpty || false;

  // Filter and sort viewings
  const processedViewings = useMemo(() => {
    return filterAndSortViewings(viewings, {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      upcoming: statusFilter === 'all' ? undefined : statusFilter === 'scheduled',
    });
  }, [viewings, statusFilter]);

  // Group by date for calendar view
  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof viewings> = {};
    
    processedViewings.forEach((viewing: any) => {
      const date = new Date(viewing.scheduled_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(viewing);
    });
    
    return groups;
  }, [processedViewings]);

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
      <div className={builderGlassPanel + ' p-6 text-center'}>
        <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-blue-400 mb-2">No Viewings Scheduled</h3>
        <p className="text-gray-400">
          Property viewings will appear here once they are scheduled.
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

  const stats = {
    scheduled: viewings.filter((v: any) => v.status === 'scheduled').length,
    completed: viewings.filter((v: any) => v.status === 'completed').length,
    cancelled: viewings.filter((v: any) => v.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats and Filters */}
      <div className={builderGlassPanel + ' p-6'}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Property Viewings</h3>
            <p className="text-sm text-gray-400">Manage and track scheduled viewings</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-4 py-2 rounded-lg border transition-all',
                viewMode === 'list'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'px-4 py-2 rounded-lg border transition-all',
                viewMode === 'calendar'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
              )}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Scheduled" value={stats.scheduled} color="text-blue-400" />
          <StatCard label="Completed" value={stats.completed} color="text-emerald-400" />
          <StatCard label="Cancelled" value={stats.cancelled} color="text-red-400" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((filter) => (
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

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {processedViewings.length === 0 ? (
            <div className={builderGlassPanel + ' p-12 text-center'}>
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400">No viewings found</p>
            </div>
          ) : (
            processedViewings.map((viewing: any) => (
              <ViewingCard key={viewing.id} viewing={viewing} reminders={reminders} />
            ))
          )}
        </div>
      ) : (
        <div className={builderGlassPanel + ' p-6'}>
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([date, dateViewings]) => (
              <div key={date}>
                <h4 className="text-lg font-semibold text-white mb-4">{date}</h4>
                <div className="space-y-3">
                  {dateViewings.map((viewing: any) => (
                    <ViewingCard key={viewing.id} viewing={viewing} reminders={reminders} compact />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ViewingCard({ viewing, reminders, compact = false }: {
  viewing: any;
  reminders?: any[];
  compact?: boolean;
}) {
  const dateInfo = formatSmartDate(viewing.scheduled_at);
  const viewingReminders = reminders?.filter((r: any) => r.viewing_id === viewing.id) || [];

  const statusConfig = {
    scheduled: { icon: Clock, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    completed: { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    cancelled: { icon: XCircle, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  };

  const config = statusConfig[viewing.status as keyof typeof statusConfig] || statusConfig.scheduled;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        glassSecondary,
        'p-4 border transition-all hover:border-white/20',
        dateInfo.isUrgent && 'border-orange-500/30 bg-orange-500/5'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <StatusIcon className={cn('w-5 h-5', config.color.split(' ')[0])} />
            <h5 className="font-semibold text-white">
              {viewing.property?.title || 'Property Viewing'}
            </h5>
          </div>
          {!compact && (
            <div className="space-y-1 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{viewing.lead?.lead_buyer_name || 'Unknown Lead'}</span>
              </div>
              {viewing.property?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{viewing.property.location}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={cn(
          'px-3 py-1 rounded-lg border text-xs font-medium',
          config.color
        )}>
          {viewing.status}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{dateInfo.relative}</span>
          </div>
          {viewingReminders.length > 0 && (
            <div className="flex items-center gap-2 text-purple-400">
              <AlertCircle className="w-4 h-4" />
              <span>{viewingReminders.length} reminder{viewingReminders.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        {dateInfo.isUrgent && (
          <div className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-lg text-xs text-orange-400">
            Urgent
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, color }: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={glassSecondary + ' p-4 text-center'}>
      <div className={cn('text-2xl font-bold mb-1', color)}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

