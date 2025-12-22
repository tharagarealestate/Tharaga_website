'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MetricsGrid } from '@/components/analytics/MetricsGrid';
import { RevenueChart } from '@/components/analytics/RevenueChart';
import { UserGrowthChart } from '@/components/analytics/UserGrowthChart';
import { ConversionFunnelChart } from '@/components/analytics/ConversionFunnelChart';
import { GeographicDistribution } from '@/components/analytics/GeographicDistribution';
import { ExportReports } from '@/components/analytics/ExportReports';

interface PlatformMetrics {
  total_builders: number;
  total_buyers: number;
  total_properties: number;
  total_leads: number;
  new_builders: number;
  new_buyers: number;
  [key: string]: any;
}

interface RevenueData {
  period_start: string;
  gross_revenue: number;
  new_subscriptions: number;
  churned_customers: number;
  [key: string]: any;
}

export default function PlatformAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [latestMetrics, setLatestMetrics] = useState<PlatformMetrics | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueData[]>([]);
  const [mrr, setMrr] = useState<number>(0);
  const [churnRate, setChurnRate] = useState<number>(0);

  const fetchData = async () => {
    try {
      const supabase = getSupabase();
      
      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        router.push('/unauthorized');
        return;
      }

      // Fetch latest platform metrics
      const { data: metrics } = await supabase
        .from('platform_metrics')
        .select('*')
        .order('metric_date', { ascending: false })
        .limit(1)
        .single();

      setLatestMetrics(metrics || {
        total_builders: 0,
        total_buyers: 0,
        total_properties: 0,
        total_leads: 0,
        new_builders: 0,
        new_buyers: 0,
      });

      // Fetch revenue metrics (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      const { data: revenue } = await supabase
        .from('revenue_metrics')
        .select('*')
        .eq('period_type', 'monthly')
        .gte('period_start', twelveMonthsAgo.toISOString().split('T')[0])
        .order('period_start', { ascending: true });

      setRevenueMetrics(revenue || []);

      // Calculate MRR
      const { data: mrrData } = await supabase.rpc('calculate_mrr');
      setMrr(mrrData || 0);

      // Calculate churn
      const { data: churnData } = await supabase.rpc('calculate_churn_rate', { 
        p_period_days: 30 
      });
      setChurnRate(churnData || 0);

    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up real-time subscriptions
    const supabase = getSupabase();
    
    // Subscribe to platform_metrics changes
    const metricsChannel = supabase
      .channel('platform_metrics_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'platform_metrics'
      }, () => {
        fetchData();
      })
      .subscribe();

    // Subscribe to revenue_metrics changes
    const revenueChannel = supabase
      .channel('revenue_metrics_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'revenue_metrics'
      }, () => {
        fetchData();
      })
      .subscribe();

    // Subscribe to user_events for real-time updates
    const eventsChannel = supabase
      .channel('user_events_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_events'
      }, () => {
        // Refresh after a short delay to allow aggregation
        setTimeout(fetchData, 2000);
      })
      .subscribe();

    // Also poll every 30 seconds as backup
    const pollInterval = setInterval(fetchData, 30000);

    return () => {
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(revenueChannel);
      supabase.removeChannel(eventsChannel);
      clearInterval(pollInterval);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-100">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 mb-2">
          Platform Analytics
        </h1>
        <p className="text-slate-400">
          Comprehensive insights into your platform performance
        </p>
      </div>

      <MetricsGrid
        totalBuilders={latestMetrics?.total_builders || 0}
        totalBuyers={latestMetrics?.total_buyers || 0}
        totalProperties={latestMetrics?.total_properties || 0}
        totalLeads={latestMetrics?.total_leads || 0}
        mrr={mrr}
        churnRate={churnRate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <RevenueChart data={revenueMetrics} />
        <UserGrowthChart metrics={latestMetrics} />
      </div>

      <div className="mt-8 space-y-8">
        <ConversionFunnelChart />
        <GeographicDistribution />
        <ExportReports />
      </div>
    </div>
  );
}
