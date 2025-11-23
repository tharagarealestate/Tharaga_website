'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import {
  Activity,
  Check,
  X,
  Clock,
  AlertCircle,
  TrendingUp,
  Play,
  Pause,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  Eye,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/SelectGroup';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { format } from 'date-fns';
import { toast } from 'sonner';

// =============================================
// TYPES
// =============================================
interface WorkflowExecution {
  id: string;
  workflow_template_id: string;
  lead_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  triggered_at: string;
  completed_at?: string;
  execution_time_ms?: number;
  error_message?: string;
  actions_completed: number;
  total_actions: number;
  workflow_template?: {
    name: string;
    trigger_type: string;
  };
  lead?: {
    name: string;
    email: string;
  };
}

interface WorkflowStats {
  total_executions: number;
  success_rate: number;
  avg_execution_time: number;
  active_workflows: number;
}

// =============================================
// STATS CARD COMPONENT
// =============================================
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: number;
  color: 'blue' | 'green' | 'amber' | 'purple';
}

function StatsCard({ title, value, subtitle, icon: Icon, trend, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    amber: 'from-amber-500 to-amber-600',
    purple: 'from-purple-500 to-purple-600'
  };
  
  return (
    <div className="group relative">
      <div className="relative h-full rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:shadow-2xl hover:-translate-y-2">
        {/* Shimmer Effect */}
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
        
        <div className="relative z-10 p-6 flex items-start justify-between">
          <div>
            <p className="text-white/60 text-sm font-medium mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-white text-3xl font-bold">{value}</h3>
              {trend !== undefined && (
                <span className={`text-sm font-semibold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </span>
              )}
            </div>
            <p className="text-white/50 text-xs mt-1">{subtitle}</p>
          </div>
          <div className={`bg-gradient-to-br ${colorClasses[color]} p-3 rounded-xl shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// EXECUTION ROW COMPONENT
// =============================================
interface ExecutionRowProps {
  execution: WorkflowExecution;
  onViewDetails: (id: string) => void;
}

function ExecutionRow({ execution, onViewDetails }: ExecutionRowProps) {
  const statusConfig = {
    pending: { color: 'bg-amber-500', label: 'Pending', icon: Clock },
    running: { color: 'bg-blue-500', label: 'Running', icon: Activity },
    completed: { color: 'bg-green-500', label: 'Completed', icon: Check },
    failed: { color: 'bg-red-500', label: 'Failed', icon: X },
    cancelled: { color: 'bg-gray-500', label: 'Cancelled', icon: X }
  };
  
  const status = statusConfig[execution.status];
  const StatusIcon = status.icon;
  const progress = execution.total_actions > 0 
    ? (execution.actions_completed / execution.total_actions) * 100 
    : 0;
  
  return (
    <div className="group relative">
      <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 p-4 hover:bg-white/15 hover:border-white/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          {/* Left Section - Workflow Info */}
          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            {/* Status Badge */}
            <div className={`${status.color} p-2 rounded-lg flex-shrink-0`}>
              <StatusIcon className="w-4 h-4 text-white" />
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="text-white font-semibold text-sm truncate">
                  {execution.workflow_template?.name || 'Unknown Workflow'}
                </h4>
                <Badge tone="default" className="bg-white/10 text-white border-white/20 text-xs flex-shrink-0">
                  {execution.workflow_template?.trigger_type || 'manual'}
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-white/60">
                <span className="flex items-center">
                  <span className="font-medium text-white/80 mr-1">Lead:</span>
                  <span className="truncate">{execution.lead?.name || 'Unknown'}</span>
                </span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                  {format(new Date(execution.triggered_at), 'MMM d, h:mm a')}
                </span>
                {execution.execution_time_ms && (
                  <span className="flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                    {execution.execution_time_ms}ms
                  </span>
                )}
              </div>
              
              {/* Progress Bar (for running workflows) */}
              {execution.status === 'running' && execution.total_actions > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                    <span>Progress</span>
                    <span>{execution.actions_completed} / {execution.total_actions} actions</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              )}
              
              {/* Error Message */}
              {execution.error_message && (
                <div className="mt-2 flex items-start space-x-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{execution.error_message}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Section - Status & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <Badge className={`${status.color} text-white border-none text-xs sm:text-sm`}>
              {status.label}
            </Badge>
            <Button
              onClick={() => onViewDetails(execution.id)}
              size="sm"
              variant="invisible"
              className="text-white/70 hover:text-white hover:bg-white/10 min-h-[44px] text-xs sm:text-sm"
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Details</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// MAIN MONITORING DASHBOARD
// =============================================
export default function WorkflowMonitoring() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [stats, setStats] = useState<WorkflowStats>({
    total_executions: 0,
    success_rate: 0,
    avg_execution_time: 0,
    active_workflows: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = getSupabase();
  
  // =============================================
  // LOAD EXECUTIONS
  // =============================================
  const loadExecutions = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('workflow_executions')
        .select(`
          *,
          workflow_template:workflow_templates(name, trigger_type),
          lead:leads(id, buyer_id)
        `)
        .order('triggered_at', { ascending: false })
        .limit(50);
      
      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Fetch lead names
      const executionsWithLeads = await Promise.all((data || []).map(async (exec) => {
        if (exec.lead?.buyer_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', exec.lead.buyer_id)
            .single();
          
          return {
            ...exec,
            lead: {
              name: profile?.full_name || 'Unknown',
              email: profile?.email || ''
            }
          };
        }
        return {
          ...exec,
          lead: { name: 'Unknown', email: '' }
        };
      }));
      
      setExecutions(executionsWithLeads as WorkflowExecution[]);
    } catch (error: any) {
      console.error('Failed to load executions:', error);
      toast.error('Failed to load executions');
    } finally {
      setIsLoading(false);
    }
  };
  
  // =============================================
  // LOAD STATS
  // =============================================
  const loadStats = async () => {
    try {
      // Total executions
      const { count: total } = await supabase
        .from('workflow_executions')
        .select('*', { count: 'exact', head: true });
      
      // Success count
      const { count: success } = await supabase
        .from('workflow_executions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      
      // Average execution time
      const { data: avgData } = await supabase
        .from('workflow_executions')
        .select('execution_time_ms')
        .eq('status', 'completed')
        .not('execution_time_ms', 'is', null);
      
      const avgTime = avgData && avgData.length > 0
        ? avgData.reduce((sum: number, e: any) => sum + (e.execution_time_ms || 0), 0) / avgData.length
        : 0;
      
      // Active workflows
      const { data: { user } } = await supabase.auth.getUser();
      const { count: active } = user ? await supabase
        .from('workflow_templates')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('builder_id', user.id) : { count: 0 };
      
      setStats({
        total_executions: total || 0,
        success_rate: total ? ((success || 0) / total) * 100 : 0,
        avg_execution_time: Math.round(avgTime),
        active_workflows: active || 0
      });
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };
  
  // =============================================
  // REAL-TIME SUBSCRIPTION
  // =============================================
  useEffect(() => {
    loadExecutions();
    loadStats();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('workflow_executions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_executions'
        },
        (payload: any) => {
          console.log('Real-time update:', payload);
          if (payload.eventType === 'INSERT') {
            loadExecutions();
          } else if (payload.eventType === 'UPDATE') {
            loadExecutions();
          }
          loadStats();
        }
      )
      .subscribe();
    
    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);
  
  // =============================================
  // VIEW DETAILS
  // =============================================
  const viewDetails = (id: string) => {
    // Navigate to details page or open modal
    console.log('View details for:', id);
    // TODO: Implement details view
  };
  
  // =============================================
  // RENDER
  // =============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden p-6">
      {/* Animated Background Elements */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow' />
        <div 
          className='absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow' 
          style={{ animationDelay: '1s' }} 
        />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Workflow Monitoring
              </h1>
              <p className="text-white/60">
                Real-time execution tracking and performance metrics
              </p>
            </div>
            <Button
              onClick={() => {
                loadExecutions();
                loadStats();
              }}
              variant="secondary"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatsCard
              title="Total Executions"
              value={stats.total_executions}
              subtitle="All time"
              icon={Activity}
              color="blue"
            />
            <StatsCard
              title="Success Rate"
              value={`${stats.success_rate.toFixed(1)}%`}
              subtitle="Completed successfully"
              icon={Check}
              trend={12}
              color="green"
            />
            <StatsCard
              title="Avg. Execution Time"
              value={`${stats.avg_execution_time}ms`}
              subtitle="Average completion time"
              icon={Clock}
              color="amber"
            />
            <StatsCard
              title="Active Workflows"
              value={stats.active_workflows}
              subtitle="Currently enabled"
              icon={Play}
              color="purple"
            />
          </div>
          
          {/* Filters */}
          <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="flex-1 w-full sm:max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workflows or leads..."
                  className="bg-white/5 border-white/20 text-white pl-10 text-sm sm:text-base min-h-[44px]"
                />
              </div>
              
              {/* Status Filter */}
              <div className="flex items-center space-x-3">
                <Filter className="w-4 h-4 text-white/60 flex-shrink-0" />
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-40 bg-white/5 border-white/20 text-white text-sm sm:text-base min-h-[44px]">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Executions List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4" />
              <p className="text-white/60">Loading executions...</p>
            </div>
          ) : executions.length === 0 ? (
            <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-12 text-center">
              <div className="bg-gold-500/20 border border-gold-500/30 rounded-full p-6 mx-auto w-fit mb-6">
                <BarChart3 className="w-12 h-12 text-gold-500" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                No Executions Found
              </h3>
              <p className="text-white/60 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Workflows will appear here once they start executing.'}
              </p>
            </div>
          ) : (
            executions
              .filter(exec => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                  exec.workflow_template?.name?.toLowerCase().includes(query) ||
                  exec.lead?.name?.toLowerCase().includes(query)
                );
              })
              .map(execution => (
                <ExecutionRow
                  key={execution.id}
                  execution={execution}
                  onViewDetails={viewDetails}
                />
              ))
          )}
        </div>
      </div>
    </div>
  );
}

