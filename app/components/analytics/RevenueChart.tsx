'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

interface RevenueData {
  period_start: string;
  gross_revenue: number;
  net_revenue: number;
  new_subscriptions: number;
  churned_customers: number;
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  const chartData = data.map(d => ({
    month: new Date(d.period_start).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    'Gross Revenue': d.gross_revenue / 100, // Convert from paise to rupees
    'Net Revenue': d.net_revenue / 100,
    newSubscriptions: d.new_subscriptions,
    churned: d.churned_customers
  }));

  // Calculate stats
  const totalRevenue = data.reduce((sum, d) => sum + d.gross_revenue, 0) / 100;
  const latestRevenue = data[data.length - 1]?.gross_revenue || 0;
  const previousRevenue = data[data.length - 2]?.gross_revenue || 0;
  const growth = previousRevenue > 0 
    ? ((latestRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;

      const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-4 border border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold mb-2 text-gray-100">{payload[0].payload.month}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-200" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Revenue') ? formatCurrency(entry.value * 100) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-100 mb-1">Revenue Trends</h3>
          <p className="text-sm text-gray-400">Monthly recurring revenue overview</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-100">
            {formatCurrency(latestRevenue * 100)}
          </div>
          <div className={`text-sm font-medium flex items-center gap-1 ${growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <TrendingUp className="w-4 h-4" />
            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% MoM
          </div>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatCurrency(value * 100)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Gross Revenue" 
              stroke="#D4AF37" 
              strokeWidth={3}
              dot={{ fill: '#D4AF37', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="Net Revenue" 
              stroke="#1e40af" 
              strokeWidth={3}
              dot={{ fill: '#1e40af', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
        <div>
          <div className="text-sm text-gray-400 mb-1">Total Revenue (12M)</div>
          <div className="text-xl font-bold text-gray-100">
            {formatCurrency(totalRevenue * 100)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">New Subscriptions</div>
          <div className="text-xl font-bold text-emerald-400">
            +{data.reduce((sum, d) => sum + d.new_subscriptions, 0)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Churn Rate</div>
          <div className="text-xl font-bold text-red-400">
            {((data.reduce((sum, d) => sum + d.churned_customers, 0) / data.length) || 0).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}

