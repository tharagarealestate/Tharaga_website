import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MetricsGrid } from '@/components/analytics/MetricsGrid';
import { RevenueChart } from '@/components/analytics/RevenueChart';
import { UserGrowthChart } from '@/components/analytics/UserGrowthChart';
import { ConversionFunnelChart } from '@/components/analytics/ConversionFunnelChart';
import { GeographicDistribution } from '@/components/analytics/GeographicDistribution';
import { ExportReports } from '@/components/analytics/ExportReports';

export default async function PlatformAnalytics() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check if user is admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();

  if (!roleData) {
    redirect('/unauthorized');
  }

  // Fetch latest platform metrics
  const { data: latestMetrics } = await supabase
    .from('platform_metrics')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(1)
    .single();

  // Fetch revenue metrics (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  
  const { data: revenueMetrics } = await supabase
    .from('revenue_metrics')
    .select('*')
    .eq('period_type', 'monthly')
    .gte('period_start', twelveMonthsAgo.toISOString().split('T')[0])
    .order('period_start', { ascending: true });

  // Calculate MRR
  const { data: mrrData } = await supabase.rpc('calculate_mrr');
  const mrr = mrrData || 0;

  // Calculate churn
  const { data: churnData } = await supabase.rpc('calculate_churn_rate', { 
    p_period_days: 30 
  });
  const churnRate = churnData || 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">
          Platform Analytics
        </h1>
        <p className="text-gray-400">
          Comprehensive insights into your platform performance
        </p>
      </div>

      {/* Key Metrics Grid */}
      <MetricsGrid
        totalBuilders={latestMetrics?.total_builders || 0}
        totalBuyers={latestMetrics?.total_buyers || 0}
        totalProperties={latestMetrics?.total_properties || 0}
        totalLeads={latestMetrics?.total_leads || 0}
        mrr={mrr}
        churnRate={churnRate}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <RevenueChart data={revenueMetrics || []} />
        <UserGrowthChart metrics={latestMetrics || {}} />
      </div>

      {/* Full Width Charts */}
      <div className="mt-8 space-y-8">
        <ConversionFunnelChart />
        <GeographicDistribution />
      </div>

      {/* Export Reports */}
      <div className="mt-8">
        <ExportReports />
      </div>
    </div>
  );
}

