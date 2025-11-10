'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, Mail, Phone, TrendingUp, Clock, Star, AlertCircle } from 'lucide-react';

import { getSupabase } from '@/lib/supabase';
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking';

export interface Lead {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  score: number;
  category: 'Hot Lead' | 'Warm Lead' | 'Developing Lead' | 'Cold Lead' | 'Low Quality';
  score_breakdown: {
    budget_alignment: number;
    engagement: number;
    property_fit: number;
    time_investment: number;
    contact_intent: number;
    recency: number;
  };
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  preferred_property_type: string | null;
  total_views: number;
  total_interactions: number;
  last_activity: string | null;
  days_since_last_activity: number;
  viewed_properties: Array<{
    property_id: string;
    property_title: string;
    view_count: number;
    last_viewed: string;
  }>;
  last_interaction: {
    type: string;
    timestamp: string;
    status: string;
  } | null;
  has_pending_interactions: boolean;
}

interface LeadsListProps {
  onSelectLead?: (lead: Lead) => void;
  initialFilters?: Partial<FilterState>;
}

interface FilterState {
  search: string;
  category: string;
  score_min: number;
  score_max: number;
  budget_min: string;
  budget_max: string;
  location: string;
  property_type: string;
  sort_by: 'score' | 'created_at' | 'last_activity';
  sort_order: 'asc' | 'desc';
  has_interactions: boolean | null;
  no_response: boolean | null;
}

interface StatsSummary {
  total_leads: number;
  hot_leads: number;
  warm_leads: number;
  pending_interactions: number;
  average_score: number;
}

export function LeadsList({ onSelectLead, initialFilters }: LeadsListProps) {
  const supabase = useMemo(() => getSupabase(), []);
  const { trackBehavior } = useBehaviorTracking();

  const [userId, setUserId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<StatsSummary>({
    total_leads: 0,
    hot_leads: 0,
    warm_leads: 0,
    pending_interactions: 0,
    average_score: 0,
  });

  const [filters, setFilters] = useState<FilterState>({
    search: initialFilters?.search || '',
    category: initialFilters?.category || '',
    score_min: initialFilters?.score_min ?? 0,
    score_max: initialFilters?.score_max ?? 10,
    budget_min: initialFilters?.budget_min || '',
    budget_max: initialFilters?.budget_max || '',
    location: initialFilters?.location || '',
    property_type: initialFilters?.property_type || '',
    sort_by: initialFilters?.sort_by || 'score',
    sort_order: initialFilters?.sort_order || 'desc',
    has_interactions: initialFilters?.has_interactions ?? null,
    no_response: initialFilters?.no_response ?? null,
  });

  useEffect(() => {
    let isMounted = true;

    async function resolveUser() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (!isMounted) return;
        if (authError || !data?.user) {
          setUserId(null);
          if (authError) {
            console.warn('[LeadsList] Auth error:', authError.message);
          }
        } else {
          setUserId(data.user.id);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[LeadsList] Failed to resolve user:', err);
        setUserId(null);
      }
    }

    resolveUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchLeads = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.score_min > 0) params.append('score_min', filters.score_min.toString());
      if (filters.score_max < 10) params.append('score_max', filters.score_max.toString());
      if (filters.budget_min) params.append('budget_min', filters.budget_min);
      if (filters.budget_max) params.append('budget_max', filters.budget_max);
      if (filters.location) params.append('location', filters.location);
      if (filters.property_type) params.append('property_type', filters.property_type);
      if (filters.has_interactions !== null) {
        params.append('has_interactions', filters.has_interactions.toString());
      }
      if (filters.no_response !== null) {
        params.append('no_response', filters.no_response.toString());
      }

      const response = await fetch(`/api/leads?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }

      const payload = await response.json();
      const leadsData: Lead[] = Array.isArray(payload?.data?.leads) ? payload.data.leads : [];
      const pagination = payload?.data?.pagination || {};
      const statsData = payload?.data?.stats || {};

      setLeads(leadsData);
      setStats({
        total_leads: statsData.total_leads ?? 0,
        hot_leads: statsData.hot_leads ?? 0,
        warm_leads: statsData.warm_leads ?? 0,
        pending_interactions: statsData.pending_interactions ?? 0,
        average_score: statsData.average_score ?? 0,
      });
      setTotalPages(Math.max(1, pagination.total_pages ?? 1));

      const activeFilters = Object.entries(filters)
        .filter(([key, value]) => {
          if (key === 'sort_by' || key === 'sort_order') return false;
          if (key === 'score_min') return value !== 0;
          if (key === 'score_max') return value !== 10;
          return value !== '' && value !== null;
        })
        .map(([key]) => key);

      await trackBehavior({
        behavior_type: 'search',
        metadata: {
          context: 'builder_dashboard',
          filters_applied: activeFilters,
          results_count: leadsData.length,
        },
      }).catch(() => undefined);
    } catch (err) {
      console.error('[LeadsList] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [filters, page, trackBehavior, userId]);

  useEffect(() => {
    if (!userId) return;

    fetchLeads();
  }, [fetchLeads, userId]);

  useEffect(() => {
    if (!userId) return;

    const leadScoresChannel = supabase
      .channel('lead-score-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lead_scores' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            fetchLeads();
          } else if (payload.eventType === 'UPDATE') {
            setLeads((previous) =>
              previous.map((lead) =>
                lead.id === payload.new?.user_id
                  ? {
                      ...lead,
                      score: payload.new?.score ?? lead.score,
                      category: payload.new?.category ?? lead.category,
                    }
                  : lead
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setLeads((previous) => previous.filter((lead) => lead.id !== payload.old?.user_id));
          }
        }
      )
      .subscribe();

    const interactionsChannel = supabase
      .channel('lead-interaction-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lead_interactions',
          filter: `builder_id=eq.${userId}`,
        },
        (payload: any) => {
          setLeads((previous) =>
            previous.map((lead) =>
              lead.id === payload.new?.lead_id
                ? {
                    ...lead,
                    total_interactions: (lead.total_interactions ?? 0) + 1,
                    last_interaction: {
                      type: payload.new?.interaction_type ?? lead.last_interaction?.type ?? 'interaction',
                      timestamp: payload.new?.timestamp ?? new Date().toISOString(),
                      status: payload.new?.status ?? lead.last_interaction?.status ?? 'pending',
                    },
                  }
                : lead
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadScoresChannel);
      supabase.removeChannel(interactionsChannel);
    };
  }, [fetchLeads, supabase, userId]);

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: FilterState[typeof key]) => {
      setFilters((previous) => ({ ...previous, [key]: value }));
      setPage(1);
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: '',
      score_min: 0,
      score_max: 10,
      budget_min: '',
      budget_max: '',
      location: '',
      property_type: '',
      sort_by: 'score',
      sort_order: 'desc',
      has_interactions: null,
      no_response: null,
    });
    setPage(1);
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.score_min > 0) params.append('score_min', filters.score_min.toString());
      if (filters.score_max < 10) params.append('score_max', filters.score_max.toString());

      const response = await fetch(`/api/leads/export?format=csv&${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to export leads');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `leads-export-${Date.now()}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      await trackBehavior({
        behavior_type: 'form_interaction',
        metadata: { action: 'export_leads', format: 'csv' },
      }).catch(() => undefined);
    } catch (err) {
      console.error('[LeadsList] Export error:', err);
      setError(err instanceof Error ? err.message : 'Failed to export leads');
    }
  }, [filters, trackBehavior]);

  const handleSelectLead = useCallback(
    (lead: Lead) => {
      setSelectedLeadId(lead.id);
      onSelectLead?.(lead);

      trackBehavior({
        behavior_type: 'form_interaction',
        metadata: { action: 'select_lead', lead_id: lead.id },
      }).catch(() => undefined);
    },
    [onSelectLead, trackBehavior]
  );

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === 'sort_by' || key === 'sort_order') return count;
      if (key === 'score_min' && value === 0) return count;
      if (key === 'score_max' && value === 10) return count;
      if (value === '' || value === null) return count;
      return count + 1;
    }, 0);
  }, [filters]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-8 text-center max-w-md backdrop-blur-xl">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-100 mb-2">Error Loading Leads</h3>
          <p className="text-red-200/70 mb-4">{error}</p>
          <button
            onClick={() => fetchLeads()}
            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-100 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Leads"
          value={stats.total_leads}
          icon={<UsersGlyph />}
          gradient="from-blue-500/20 to-cyan-500/20"
          borderColor="border-blue-500/50"
        />
        <StatsCard
          title="Hot Leads"
          value={stats.hot_leads}
          icon={<TrendingUp className="w-5 h-5" />}
          gradient="from-red-500/20 to-orange-500/20"
          borderColor="border-red-500/50"
        />
        <StatsCard
          title="Avg Score"
          value={stats.average_score.toFixed(1)}
          icon={<Star className="w-5 h-5" />}
          gradient="from-amber-500/20 to-yellow-500/20"
          borderColor="border-amber-500/50"
        />
        <StatsCard
          title="Pending Actions"
          value={stats.pending_interactions}
          icon={<Clock className="w-5 h-5" />}
          gradient="from-purple-500/20 to-pink-500/20"
          borderColor="border-purple-500/50"
        />
      </div>

      <div className="bg-gradient-to-br from-[#0A1628]/80 to-[#0F1B2D]/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 shadow-lg shadow-blue-500/10">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400/50" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={filters.search}
              onChange={(event) => handleFilterChange('search', event.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#0A1628]/50 border border-blue-500/20 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowFilters((previous) => !previous)}
              className="flex-1 lg:flex-initial px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-100 font-medium transition-all flex items-center justify-center gap-2 relative"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={handleExport}
              className="flex-1 lg:flex-initial px-4 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 rounded-xl text-amber-100 font-medium transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span className="hidden lg:inline">Export</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-6 pt-6 border-t border-blue-500/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200/70 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(event) => handleFilterChange('category', event.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0A1628]/50 border border-blue-500/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  >
                    <option value="">All Categories</option>
                    <option value="Hot Lead">🔥 Hot Lead</option>
                    <option value="Warm Lead">☀️ Warm Lead</option>
                    <option value="Developing Lead">🌱 Developing Lead</option>
                    <option value="Cold Lead">❄️ Cold Lead</option>
                    <option value="Low Quality">⚠️ Low Quality</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200/70 mb-2">
                    Score Range: {filters.score_min} - {filters.score_max}
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={filters.score_min}
                      onChange={(event) => handleFilterChange('score_min', parseFloat(event.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={filters.score_max}
                      onChange={(event) => handleFilterChange('score_max', parseFloat(event.target.value))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200/70 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore, Mumbai"
                    value={filters.location}
                    onChange={(event) => handleFilterChange('location', event.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0A1628]/50 border border-blue-500/20 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200/70 mb-2">Min Budget (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000000"
                    value={filters.budget_min}
                    onChange={(event) => handleFilterChange('budget_min', event.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0A1628]/50 border border-blue-500/20 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200/70 mb-2">Max Budget (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000000"
                    value={filters.budget_max}
                    onChange={(event) => handleFilterChange('budget_max', event.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0A1628]/50 border border-blue-500/20 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200/70 mb-2">Sort By</label>
                  <select
                    value={`${filters.sort_by}-${filters.sort_order}`}
                    onChange={(event) => {
                      const [sortBy, sortOrder] = event.target.value.split('-') as [
                        FilterState['sort_by'],
                        FilterState['sort_order'],
                      ];
                      handleFilterChange('sort_by', sortBy);
                      handleFilterChange('sort_order', sortOrder);
                    }}
                    className="w-full px-4 py-2.5 bg-[#0A1628]/50 border border-blue-500/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  >
                    <option value="score-desc">Score (High to Low)</option>
                    <option value="score-asc">Score (Low to High)</option>
                    <option value="created_at-desc">Newest First</option>
                    <option value="created_at-asc">Oldest First</option>
                    <option value="last_activity-desc">Recently Active</option>
                    <option value="last_activity-asc">Least Active</option>
                  </select>
                </div>

                <div className="md:col-span-2 lg:col-span-3 flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      handleFilterChange('no_response', filters.no_response ? null : true)
                    }
                    className={`px-4 py-2 rounded-xl border transition-all ${
                      filters.no_response
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-100'
                        : 'bg-[#0A1628]/50 border-blue-500/20 text-gray-300 hover:bg-blue-500/10'
                    }`}
                  >
                    ⏰ No Response Yet
                  </button>

                  <button
                    onClick={() =>
                      handleFilterChange('has_interactions', filters.has_interactions ? null : true)
                    }
                    className={`px-4 py-2 rounded-xl border transition-all ${
                      filters.has_interactions
                        ? 'bg-green-500/20 border-green-500/50 text-green-100'
                        : 'bg-[#0A1628]/50 border-blue-500/20 text-gray-300 hover:bg-blue-500/10'
                    }`}
                  >
                    💬 Has Interactions
                  </button>

                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-100 transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-32 bg-gradient-to-br from-[#0A1628]/50 to-[#0F1B2D]/50 backdrop-blur-xl border border-blue-500/20 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-gradient-to-br from-[#0A1628]/80 to-[#0F1B2D]/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-blue-400/50" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Leads Found</h3>
          <p className="text-gray-400 mb-6">Try adjusting your filters or search query</p>
          <button
            onClick={handleClearFilters}
            className="px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-xl text-blue-100 transition-all"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {leads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-gradient-to-br from-[#0A1628]/80 to-[#0F1B2D]/80 backdrop-blur-xl border rounded-2xl p-6 hover:border-blue-500/50 transition-all cursor-pointer ${
                  selectedLeadId === lead.id ? 'border-blue-500/70 ring-2 ring-blue-500/30' : 'border-blue-500/20'
                }`}
                onClick={() => handleSelectLead(lead)}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{lead.full_name}</h3>
                        <p className="text-sm text-gray-400">{lead.email}</p>
                        {lead.phone && (
                          <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(lead.score)}`}>
                          {lead.score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-400">Lead Score</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-medium bg-gradient-to-r border ${getCategoryColor(
                          lead.category
                        )}`}
                      >
                        {lead.category}
                      </span>

                      {lead.has_pending_interactions && (
                        <span className="px-3 py-1 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 text-amber-100">
                          ⏰ Pending Action
                        </span>
                      )}

                      {lead.total_interactions === 0 && (
                        <span className="px-3 py-1 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 text-red-100">
                          🆕 No Contact Yet
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Budget:</span>
                        <span className="text-white ml-2 font-medium">
                          {lead.budget_min && lead.budget_max
                            ? `₹${formatBudget(lead.budget_min)} - ₹${formatBudget(lead.budget_max)}`
                            : 'Not specified'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Location:</span>
                        <span className="text-white ml-2 font-medium">{lead.preferred_location || 'Any'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-64 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Property Views</span>
                      <span className="text-white font-semibold">{lead.total_views}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Interactions</span>
                      <span className="text-white font-semibold">{lead.total_interactions}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Last Active</span>
                      <span className="text-white font-semibold">
                        {lead.days_since_last_activity === 0
                          ? 'Today'
                          : lead.days_since_last_activity === 1
                          ? 'Yesterday'
                          : `${lead.days_since_last_activity}d ago`}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-blue-500/20">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          if (lead.phone) {
                            window.location.href = `tel:${lead.phone}`;
                            trackBehavior({
                              behavior_type: 'phone_clicked',
                              metadata: { lead_id: lead.id },
                            }).catch(() => undefined);
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-green-100 text-sm font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={!lead.phone}
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          window.location.href = `mailto:${lead.email}`;
                          trackBehavior({
                            behavior_type: 'email_clicked',
                            metadata: { lead_id: lead.id },
                          }).catch(() => undefined);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-100 text-sm font-medium transition-all flex items-center justify-center gap-1"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {lead.viewed_properties.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-500/20">
                    <p className="text-xs text-gray-400 mb-2">Most Viewed Properties:</p>
                    <div className="flex flex-wrap gap-2">
                      {lead.viewed_properties.slice(0, 3).map((property) => (
                        <span
                          key={property.property_id}
                          className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-200"
                        >
                          {property.property_title} ({property.view_count}x)
                        </span>
                      ))}
                      {lead.viewed_properties.length > 3 && (
                        <span className="px-3 py-1 bg-gray-500/10 border border-gray-500/20 rounded-lg text-xs text-gray-300">
                          +{lead.viewed_properties.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>

          <div className="flex gap-2">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`w-10 h-10 rounded-xl font-medium transition-all ${
                    page === pageNumber
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-100'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  gradient: string;
  borderColor: string;
}

function StatsCard({ title, value, icon, gradient, borderColor }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br ${gradient} backdrop-blur-xl border ${borderColor} rounded-2xl p-6 shadow-lg shadow-black/10`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-300">{title}</div>
    </motion.div>
  );
}

function getCategoryColor(category: Lead['category']) {
  const colors: Record<Lead['category'], string> = {
    'Hot Lead': 'from-red-500/20 to-orange-500/20 border-red-500/50 text-red-100',
    'Warm Lead': 'from-orange-500/20 to-yellow-500/20 border-orange-500/50 text-orange-100',
    'Developing Lead': 'from-blue-500/20 to-cyan-500/20 border-blue-500/50 text-blue-100',
    'Cold Lead': 'from-slate-500/20 to-gray-500/20 border-slate-500/50 text-slate-200',
    'Low Quality': 'from-gray-700/20 to-gray-600/20 border-gray-600/50 text-gray-300',
  };
  return colors[category] || colors['Developing Lead'];
}

function getScoreColor(score: number) {
  if (score >= 8) return 'text-red-400';
  if (score >= 6) return 'text-orange-400';
  if (score >= 4) return 'text-blue-400';
  return 'text-gray-400';
}

function formatBudget(value: number) {
  return (value / 100000).toFixed(1) + 'L';
}

function UsersGlyph() {
  return (
    <svg
      className="w-5 h-5 text-white/90"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19c1.5 0 4-.75 4-2.25S16.5 14.5 15 14.5s-4 .75-4 2.25S13.5 19 15 19Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19c1.5 0 4-.75 4-2.25S10.5 14.5 9 14.5 5 15.25 5 16.75 7.5 19 9 19Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 13c1.657 0 3-1.567 3-3.5S13.657 6 12 6s-3 1.567-3 3.5S10.343 13 12 13Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.5 12C7.88 12 9 10.657 9 9s-1.12-3-2.5-3S4 7.343 4 9s1.12 3 2.5 3Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.5 12C18.88 12 20 10.657 20 9s-1.12-3-2.5-3S15 7.343 15 9s1.12 3 2.5 3Z"
      />
    </svg>
  );
}


