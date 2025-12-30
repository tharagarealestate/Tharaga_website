'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Zap,
  Target,
  Clock,
  Activity,
  CheckCircle2,
  Eye,
  MessageCircle,
  Star,
  Download,
  Filter,
  ChevronDown,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  BarChart3,
  DollarSign,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { GlassLoadingOverlay } from '@/components/ui/loading-spinner';
import { DashboardPageHeader, StatCard, StatsGrid, PrimaryButton, SecondaryButton } from '../_components/ui/DashboardDesignSystem';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
} from 'recharts';

interface AnalyticsDashboard {
  overview: {
    total_leads: number;
    new_leads_this_period: number;
    new_leads_change: number;
    hot_leads: number;
    hot_leads_change: number;
    warm_leads: number;
    warm_leads_change: number;
    active_conversations: number;
    active_conversations_change: number;
    avg_response_time: number;
    response_time_change: number;
    conversion_rate: number;
    conversion_rate_change: number;
  };
  lead_quality: {
    hot: { count: number; percentage: number };
    warm: { count: number; percentage: number };
    developing: { count: number; percentage: number };
    cold: { count: number; percentage: number };
    low_quality: { count: number; percentage: number };
  };
  funnel: {
    stages: Array<{ name: string; value: number; conversion_rate: number }>;
    overall_conversion: number;
  };
  score_trends: {
    dates: string[];
    avg_scores: number[];
    hot_leads: number[];
    new_leads: number[];
  };
  activity_heatmap: {
    by_hour: Record<string, number>;
    by_day: Record<string, number>;
    peak_hour: number;
    peak_day: string;
  };
  top_properties: Array<{
    property_id: string;
    property_title: string;
    view_count: number;
    unique_viewers: number;
    avg_engagement_time: number;
    lead_count: number;
    conversion_rate: number;
  }>;
  response_metrics: {
    avg_first_response: number;
    avg_response_time: number;
    response_rate: number;
    pending_responses: number;
    overdue_followups: number;
  };
  revenue: {
    pipeline_value: number;
    expected_revenue: number;
    closed_deals_value: number;
    avg_deal_size: number;
    projected_monthly: number;
  };
  lead_sources: Array<{
    source: string;
    count: number;
    percentage: number;
    avg_quality: number;
    conversion_rate: number;
    roi: number;
  }>;
  engagement: {
    avg_session_duration: number;
    avg_pages_per_session: number;
    bounce_rate: number;
    repeat_visitors: number;
  };
}

interface AnalyticsDashboardProps {
  builderId?: string;
  period?: '7d' | '30d' | '90d' | '1y' | 'this_month' | 'last_month';
  compareWithPrevious?: boolean;
}

const COLORS = {
  hot: '#EF4444',
  warm: '#F59E0B',
  developing: '#3B82F6',
  cold: '#6B7280',
  low: '#9CA3AF',
  primary: '#1E40AF',
  gold: '#D4AF37',
  success: '#10B981',
  warning: '#F59E0B',
  purple: '#8B5CF6',
};

const QUALITY_COLORS = [COLORS.hot, COLORS.warm, COLORS.developing, COLORS.cold, COLORS.low];
const SOURCE_COLORS = ['#D4AF37', '#1E40AF', '#8B5CF6', '#10B981', '#F59E0B', '#0EA5E9'];

const formatNumber = (num: number): string => {
  if (!Number.isFinite(num)) return '0';
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return Math.round(num).toLocaleString('en-IN');
};

const formatCurrency = (amount: number): string => {
  if (!Number.isFinite(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDuration = (minutes: number): string => {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const getTrendIcon = (change: number) => {
  if (change > 0) return <ArrowUpRight className="w-4 h-4 text-emerald-600" />;
  if (change < 0) return <ArrowDownRight className="w-4 h-4 text-red-600" />;
  return <Minus className="w-4 h-4 text-gray-500" />;
};

const getTrendColor = (change: number, reverse = false) => {
  if (reverse) {
    if (change > 0) return 'text-red-600';
    if (change < 0) return 'text-emerald-600';
  } else {
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-red-600';
  }
  return 'text-gray-600';
};

export default function AnalyticsDashboard({
  builderId,
  period = '30d',
  compareWithPrevious = true,
}: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(period);
  const [showComparison, setShowComparison] = useState(compareWithPrevious);

  const fetchAnalytics = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const params = new URLSearchParams({
          period: selectedPeriod,
          compare: showComparison ? 'true' : 'false',
        });
        if (builderId) {
          params.set('builderId', builderId);
        }

        const response = await fetch(`/api/analytics/dashboard?${params.toString()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const payload = await response.json();
        setData(payload.data ?? null);
      } catch (error) {
        console.error('[AnalyticsDashboard] fetch error', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [builderId, selectedPeriod, showComparison],
  );

  const handleExport = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${selectedPeriod}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data, selectedPeriod]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card p-6 rounded-2xl relative">
            <GlassLoadingOverlay />
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  const showChangeIndicators = showComparison;
  const hourValues = Object.values(data.activity_heatmap.by_hour || {});
  const maxHourCount = hourValues.length > 0 ? Math.max(...hourValues) : 0;
  const dayValues = Object.values(data.activity_heatmap.by_day || {});
  const maxDayCount = dayValues.length > 0 ? Math.max(...dayValues) : 0;
  const funnelBaseline = data.funnel.stages[0]?.value ?? 0;

  const trendData = data.score_trends.dates.map((date, index) => ({
    date,
    avgScore: data.score_trends.avg_scores[index] ?? 0,
    hotLeads: data.score_trends.hot_leads[index] ?? 0,
    newLeads: data.score_trends.new_leads[index] ?? 0,
  }));
  
  return (
    <div className="space-y-6">
      {/* Page Header using Design System */}
      <DashboardPageHeader
        title="Analytics Dashboard"
        subtitle={showComparison ? "Comprehensive insights and performance metrics • Comparing against previous period" : "Comprehensive insights and performance metrics"}
        emoji="📊"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white">
              <input
                type="checkbox"
                checked={showComparison}
                onChange={(event) => setShowComparison(event.target.checked)}
                className="h-4 w-4 rounded border-slate-600 text-amber-500 focus:ring-amber-500"
              />
              Compare
            </label>
            <PrimaryButton onClick={() => fetchAnalytics(true)} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </PrimaryButton>
            <SecondaryButton onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export
            </SecondaryButton>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:shadow-2xl transition-shadow duration-300"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" />
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <Users className="w-8 h-8 text-blue-600" />
              {showChangeIndicators && getTrendIcon(data.overview.new_leads_change)}
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Total Leads</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatNumber(data.overview.total_leads)}
              </p>
          </div>
            <div className="flex items-center gap-2 text-sm">
              {showChangeIndicators && (
                <span className={getTrendColor(data.overview.new_leads_change)}>
                  {data.overview.new_leads_change > 0 ? '+' : ''}
                  {data.overview.new_leads_change.toFixed(1)}%
                </span>
              )}
              <span className="text-gray-500">
                +{formatNumber(data.overview.new_leads_this_period)} this period
              </span>
          </div>
        </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:shadow-2xl transition-shadow duration-300"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-full -mr-16 -mt-16" />
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <Zap className="w-8 h-8 text-red-600" />
              {showChangeIndicators && getTrendIcon(data.overview.hot_leads_change)}
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Hot Leads</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatNumber(data.overview.hot_leads)}
              </p>
            </div>
            {showChangeIndicators && (
              <div className="flex items-center gap-2 text-sm">
                <span className={getTrendColor(data.overview.hot_leads_change)}>
                  {data.overview.hot_leads_change > 0 ? '+' : ''}
                  {data.overview.hot_leads_change.toFixed(1)}%
                </span>
                <span className="text-gray-500">vs previous period</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:shadow-2xl transition-shadow duration-300"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-16 -mt-16" />
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <Target className="w-8 h-8 text-emerald-600" />
              {showChangeIndicators && getTrendIcon(data.overview.conversion_rate_change)}
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Conversion Rate</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {data.overview.conversion_rate.toFixed(1)}%
              </p>
            </div>
            {showChangeIndicators && (
              <div className="flex items-center gap-2 text-sm">
                <span className={getTrendColor(data.overview.conversion_rate_change)}>
                  {data.overview.conversion_rate_change > 0 ? '+' : ''}
                  {data.overview.conversion_rate_change.toFixed(1)}%
                </span>
                <span className="text-gray-500">change</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:shadow-2xl transition-shadow duration-300"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-16 -mt-16" />
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <Clock className="w-8 h-8 text-amber-600" />
              {showChangeIndicators && getTrendIcon(data.overview.response_time_change)}
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Avg Response Time</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {formatDuration(data.overview.avg_response_time)}
              </p>
            </div>
            {showChangeIndicators && (
              <div className="flex items-center gap-2 text-sm">
                <span className={getTrendColor(data.overview.response_time_change, true)}>
                  {data.overview.response_time_change > 0 ? '+' : ''}
                  {data.overview.response_time_change.toFixed(1)}%
                </span>
                <span className="text-gray-500">
                  {data.overview.response_time_change < 0 ? 'faster' : 'slower'}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Lead Quality Distribution</h3>
              <p className="text-sm text-gray-600">Score-based categorization</p>
            </div>
            <PieChartIcon className="w-6 h-6 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Hot (9-10)', value: data.lead_quality.hot.count },
                  { name: 'Warm (7-8)', value: data.lead_quality.warm.count },
                  { name: 'Developing (5-6)', value: data.lead_quality.developing.count },
                  { name: 'Cold (3-4)', value: data.lead_quality.cold.count },
                  { name: 'Low (1-2)', value: data.lead_quality.low_quality.count },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                innerRadius={60}
                dataKey="value"
              >
                {QUALITY_COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fff',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[
              { label: 'Hot', ...data.lead_quality.hot, color: COLORS.hot },
              { label: 'Warm', ...data.lead_quality.warm, color: COLORS.warm },
              { label: 'Developing', ...data.lead_quality.developing, color: COLORS.developing },
              { label: 'Cold', ...data.lead_quality.cold, color: COLORS.cold },
              { label: 'Low Quality', ...data.lead_quality.low_quality, color: COLORS.low },
            ].map((quality) => (
              <div key={quality.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: quality.color }} />
                <span className="text-sm text-gray-700">
                  {quality.label}: <strong>{formatNumber(quality.count)}</strong> (
                  {quality.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Conversion Funnel</h3>
              <p className="text-sm text-gray-600">
                Overall conversion: <strong>{data.funnel.overall_conversion.toFixed(1)}%</strong>
              </p>
            </div>
            <Filter className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            {data.funnel.stages.map((stage, index) => {
              const baseline = funnelBaseline > 0 ? funnelBaseline : 1;
              const percentage = baseline > 0 ? (stage.value / baseline) * 100 : 0;
              const cappedPercentage = Number.isFinite(percentage) ? percentage : 0;
              const isLast = index === data.funnel.stages.length - 1;
              return (
                <div key={stage.name} className="relative">
          <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                    <span className="text-sm text-gray-600">
                      {formatNumber(stage.value)} ({stage.conversion_rate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(cappedPercentage, 100)}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{
                        background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.gold})`,
                      }}
                    >
                      {Math.min(cappedPercentage, 100).toFixed(1)}%
                    </motion.div>
                  </div>
                  {!isLast && (
                    <div className="flex items-center justify-center mt-2">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="glass-card p-6 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Lead Score Trends</h3>
            <p className="text-sm text-gray-600">Average scores and lead counts over time</p>
          </div>
          <LineChartIcon className="w-6 h-6 text-gray-400" />
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="left" stroke="#6B7280" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                color: '#fff',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="avgScore"
              fill="url(#scoreGradient)"
              stroke={COLORS.primary}
              strokeWidth={3}
              name="Avg Score"
            />
            <Bar
              yAxisId="right"
              dataKey="hotLeads"
              fill={COLORS.hot}
              name="Hot Leads"
              radius={[8, 8, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="newLeads"
              stroke={COLORS.gold}
              strokeWidth={2}
              dot={{ fill: COLORS.gold, r: 4 }}
              name="New Leads"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {data.top_properties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Top Performing Properties</h3>
                <p className="text-sm text-gray-600">Highest engagement and conversions</p>
              </div>
              <Star className="w-6 h-6 text-gray-400" />
            </div>
            <div className="space-y-4">
              {data.top_properties.slice(0, 5).map((property, index) => (
                <div
                  key={property.property_id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{property.property_title}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(property.view_count)} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {formatNumber(property.unique_viewers)} viewers
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {property.conversion_rate.toFixed(1)}% CVR
                      </span>
                    </div>
          </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatNumber(property.lead_count)}</p>
                    <p className="text-xs text-gray-600">leads</p>
          </div>
        </div>
              ))}
            </div>
          </motion.div>
        )}

        {data.lead_sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Lead Sources</h3>
                <p className="text-sm text-gray-600">Marketing channel performance</p>
              </div>
              <Activity className="w-6 h-6 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data.lead_sources}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 100, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis type="category" dataKey="source" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill={COLORS.gold} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {data.lead_sources.map((source, index) => (
                <div key={source.source} className="flex flex-wrap items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }}
                    />
                    <span className="font-medium text-gray-700">{source.source}</span>
          </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                    <span>Quality: {source.avg_quality.toFixed(1)}/10</span>
                    <span>CVR: {source.conversion_rate.toFixed(1)}%</span>
                    <span className={source.roi > 0 ? 'text-emerald-600' : 'text-red-600'}>
                      ROI: {source.roi.toFixed(0)}%
                    </span>
          </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        </div>
        
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Projections</h3>
              <p className="text-sm text-gray-600">Pipeline value and forecasts</p>
            </div>
            <DollarSign className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl">
              <p className="text-sm text-emerald-700 mb-1">Pipeline Value</p>
              <p className="text-2xl font-bold text-emerald-900">
                {formatCurrency(data.revenue.pipeline_value)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">Expected Revenue</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(data.revenue.expected_revenue)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">Closed Deals</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(data.revenue.closed_deals_value)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">Avg Deal Size</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(data.revenue.avg_deal_size)}
                </p>
          </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-600 mb-1">Projected Monthly</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(data.revenue.projected_monthly)}
                </p>
          </div>
        </div>
      </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Response Performance</h3>
              <p className="text-sm text-gray-600">Builder response metrics</p>
            </div>
            <MessageCircle className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Response Rate</span>
                <span className="text-lg font-bold text-gray-900">
                  {data.response_metrics.response_rate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(data.response_metrics.response_rate, 100)}%` }}
                  transition={{ duration: 1, delay: 1.2 }}
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full"
                />
        </div>
      </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <p className="text-xs text-gray-600">First Response</p>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {formatDuration(data.response_metrics.avg_first_response)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <p className="text-xs text-gray-600">Avg Response</p>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {formatDuration(data.response_metrics.avg_response_time)}
                </p>
        </div>
      </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-amber-700">Pending</p>
                </div>
                <p className="text-lg font-bold text-amber-900">
                  {formatNumber(data.response_metrics.pending_responses)}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <p className="text-xs text-red-700">Overdue</p>
                </div>
                <p className="text-lg font-bold text-red-900">
                  {formatNumber(data.response_metrics.overdue_followups)}
                </p>
              </div>
        </div>
          </div>
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        className="glass-card p-6 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Activity Heatmap</h3>
            <p className="text-sm text-gray-600">
              Peak activity: <strong>{data.activity_heatmap.peak_day}</strong> at{' '}
              <strong>{data.activity_heatmap.peak_hour}:00</strong>
            </p>
          </div>
          <BarChart3 className="w-6 h-6 text-gray-400" />
        </div>
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 mb-3">Activity by Hour</p>
          <div className="grid grid-cols-12 gap-2">
            {Object.entries(data.activity_heatmap.by_hour)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([hour, count]) => {
                const intensity = maxHourCount > 0 ? (count / maxHourCount) : 0;
                return (
                  <div key={hour} className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: Number(hour) * 0.03 }}
                      className="relative group"
                    >
                      <div
                        className="h-20 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110"
                        style={{
                          backgroundColor: `rgba(30, 64, 175, ${intensity})`,
                        }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {count} activities
                      </div>
                    </motion.div>
                    <p className="text-xs text-gray-600 mt-1">{hour}:00</p>
                  </div>
                );
              })}
        </div>
      </div>
      
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Activity by Day</p>
          <div className="grid grid-cols-7 gap-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
              const count = data.activity_heatmap.by_day[day] || 0;
              const percentage = maxDayCount > 0 ? (count / maxDayCount) * 100 : 0;
              return (
                <div key={day} className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-2">{day}</p>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(percentage, 10)}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-lg min-h-[40px] flex items-end justify-center pb-2"
                  >
                    <span className="text-xs font-bold text-white">{count}</span>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="glass-card p-6 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">User Engagement Metrics</h3>
            <p className="text-sm text-gray-600">Session and behavior analytics</p>
          </div>
          <Activity className="w-6 h-6 text-gray-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatDuration(data.engagement.avg_session_duration)}
            </p>
            <p className="text-xs text-gray-600">Avg Session</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <Eye className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {data.engagement.avg_pages_per_session.toFixed(1)}
            </p>
            <p className="text-xs text-gray-600">Pages/Session</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <Target className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {data.engagement.bounce_rate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600">Bounce Rate</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <Users className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatNumber(data.engagement.repeat_visitors)}
            </p>
            <p className="text-xs text-gray-600">Repeat Visitors</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


