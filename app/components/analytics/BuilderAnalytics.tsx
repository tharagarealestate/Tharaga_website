'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Building, TrendingUp, Users, Target, Mail } from 'lucide-react';

interface BuilderAnalyticsData {
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgResponseTime: number;
  topProperties: Array<{ id: string; title: string; lead_count: number }>;
  leadSources: Record<string, number>;
}

const COLORS = ['#1e40af', '#D4AF37', '#10b981', '#f59e0b', '#8b5cf6'];

export function BuilderAnalytics({ builderId }: { builderId: string }) {
  const [analytics, setAnalytics] = useState<BuilderAnalyticsData>({
    totalLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    avgResponseTime: 0,
    topProperties: [],
    leadSources: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!builderId) return;
    loadAnalytics();
  }, [builderId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/builder/${builderId}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lead Sources Pie Chart Data
  const sourceChartData = Object.entries(analytics.leadSources).map(([name, value]) => ({
    name,
    value
  }));

  // Top Properties Bar Chart Data
  const propertiesChartData = analytics.topProperties.map(p => ({
    name: p.title?.substring(0, 25) + (p.title?.length > 25 ? '...' : ''),
    leads: p.lead_count
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-600" />
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {analytics.totalLeads}
          </div>
          <div className="text-sm text-slate-600">Total Leads</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
              Qualified
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {analytics.qualifiedLeads}
          </div>
          <div className="text-sm text-slate-600">Qualified Leads</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Building className="w-8 h-8 text-purple-600" />
            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
              {analytics.conversionRate.toFixed(1)}%
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {analytics.convertedLeads}
          </div>
          <div className="text-sm text-slate-600">Conversions</div>
        </div>

        <div className="bg-gradient-to-br from-[#D4AF37] to-[#1e40af] rounded-xl shadow-sm p-6 text-white">
          <div className="text-sm mb-2 opacity-90">Avg Response Time</div>
          <div className="text-3xl font-bold">
            {analytics.avgResponseTime}m
          </div>
          <div className="text-xs mt-2 opacity-75">Industry avg: 45m</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        {sourceChartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Lead Sources</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Properties */}
        {propertiesChartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Top Performing Properties</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertiesChartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="leads" fill="#D4AF37" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

