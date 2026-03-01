'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Star,
  StarOff,
  Eye,
  MessageSquare,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { PremiumButton } from '@/components/ui/premium-button';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface LeadTracking {
  id: string;
  leadId: number;
  displayStatus: string;
  timeline: Array<{ event: string; timestamp: string; details?: string }>;
  lastActivityAt?: string;
  responseCount: number;
  isFavorite: boolean;
  property: {
    id: string;
    title: string;
    image?: string;
    price?: number;
    location: string;
  };
  builder: {
    id: string;
    companyName: string;
    logo?: string;
    isVerified: boolean;
  };
  siteVisit?: {
    id: string;
    status: string;
    scheduledDate: string;
    scheduledTime: string;
  };
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: typeof Eye;
  }
> = {
  submitted: {
    label: 'Submitted',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: FileText,
  },
  viewed: {
    label: 'Viewed by Builder',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: Eye,
  },
  contacted: {
    label: 'In Contact',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: MessageSquare,
  },
  site_visit: {
    label: 'Site Visit',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    icon: Calendar,
  },
  negotiating: {
    label: 'Negotiating',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: TrendingUp,
  },
  closed_won: {
    label: 'Closed - Won',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: CheckCircle2,
  },
  closed_lost: {
    label: 'Closed',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    icon: XCircle,
  },
};

export function LeadTrackingDashboard() {
  const [leads, setLeads] = useState<LeadTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadTracking | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {} as Record<string, number>,
    responseRate: 0,
    avgResponseTime: null as number | null,
  });

  useEffect(() => {
    void fetchLeads();
    void fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus) params.set('status', selectedStatus);

      const response = await fetch(`/api/buyer/leads?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/buyer/leads/stats', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const toggleFavorite = async (leadId: number) => {
    try {
      const response = await fetch(`/api/buyer/leads/${leadId}/favorite`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to toggle favorite');
      const { isFavorite } = await response.json();

      setLeads(prev =>
        prev.map(lead =>
          lead.leadId === leadId ? { ...lead, isFavorite } : lead
        )
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.property.title.toLowerCase().includes(query) ||
      lead.builder.companyName.toLowerCase().includes(query) ||
      lead.property.location.toLowerCase().includes(query)
    );
  });

  const formatPrice = (price?: number) => {
    if (!price) return 'Price on request';
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard variant="light" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#0F52BA] flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="light" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Response Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.responseRate.toFixed(0)}%
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="light" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Response</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.avgResponseTime
                  ? `${stats.avgResponseTime.toFixed(1)}h`
                  : '-'}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="light" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Site Visits</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.byStatus.site_visit || 0}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by property, builder, or location..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D4AF37]/50 focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setSelectedStatus(null)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
              !selectedStatus
                ? 'bg-gradient-to-br from-[#D4AF37] to-[#0F52BA] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            )}
          >
            All
          </button>
          {Object.entries(STATUS_CONFIG)
            .slice(0, 5)
            .map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedStatus(key)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
                  selectedStatus === key
                    ? `${config.bgColor} ${config.color}`
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                )}
              >
                {config.label}
              </button>
            ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <GlassCard variant="light" className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No inquiries found
            </h3>
            <p className="text-gray-500 mb-6">
              {selectedStatus
                ? 'No inquiries match the selected status'
                : "You haven't submitted any property inquiries yet"}
            </p>
            <PremiumButton
              variant="primary"
              onClick={() => {
                window.location.href = '/properties';
              }}
            >
              Browse Properties
            </PremiumButton>
          </GlassCard>
        ) : (
          filteredLeads.map((lead, index) => {
            const statusConfig =
              STATUS_CONFIG[lead.displayStatus] || STATUS_CONFIG.submitted;
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard
                  variant="light"
                  className="p-4 hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex gap-4">
                    {/* Property Image */}
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                      {lead.property.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={lead.property.image}
                          alt={lead.property.title}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          void toggleFavorite(lead.leadId);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                      >
                        {lead.isFavorite ? (
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        ) : (
                          <StarOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {lead.property.title}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {lead.property.location}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0',
                            statusConfig.bgColor,
                            statusConfig.color
                          )}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="font-semibold text-[#D4AF37]">
                          {formatPrice(lead.property.price)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {lead.builder.companyName}
                          {lead.builder.isVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          )}
                        </span>
                      </div>

                      {/* Timeline Preview */}
                      {lead.timeline.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {lead.timeline[lead.timeline.length - 1].event}
                          </span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(
                              new Date(
                                lead.timeline[lead.timeline.length - 1]
                                  .timestamp
                              ),
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                      )}

                      {/* Site Visit Badge */}
                      {lead.siteVisit &&
                        lead.siteVisit.status !== 'cancelled' && (
                          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              Site visit{' '}
                              {lead.siteVisit.status === 'confirmed'
                                ? 'on'
                                : 'pending'}{' '}
                              {format(
                                new Date(lead.siteVisit.scheduledDate),
                                'MMM d'
                              )}
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Arrow */}
                    <div className="hidden sm:flex items-center">
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Lead detail modal integration can be added here using selectedLead */}
      {selectedLead && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60">
          <GlassCard
            variant="dark"
            className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {selectedLead.property.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {selectedLead.property.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{selectedLead.builder.companyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Status: {selectedLead.displayStatus}</span>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Timeline</h4>
                <div className="space-y-2 text-xs">
                  {selectedLead.timeline
                    .slice()
                    .reverse()
                    .map((event, idx) => (
                      <div
                        key={`${event.event}-${idx}`}
                        className="flex items-start gap-2"
                      >
                        <div className="mt-0.5">
                          <Clock className="w-3 h-3 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-gray-100">{event.event}</p>
                          <p className="text-gray-400">
                            {format(
                              new Date(event.timestamp),
                              'MMM d, yyyy h:mm a'
                            )}
                          </p>
                          {event.details && (
                            <p className="text-gray-400 mt-0.5">
                              {event.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}












