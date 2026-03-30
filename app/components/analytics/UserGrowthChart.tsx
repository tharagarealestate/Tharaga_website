'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';

interface PlatformMetrics {
  metric_date?: string;
  total_builders?: number;
  total_buyers?: number;
  new_builders?: number;
  new_buyers?: number;
}

export function UserGrowthChart({ metrics }: { metrics?: PlatformMetrics }) {
  // Sample data structure - in real app, fetch historical data
  const chartData = [
    { month: 'Jan', Builders: 10, Buyers: 50 },
    { month: 'Feb', Builders: 15, Buyers: 75 },
    { month: 'Mar', Builders: 20, Buyers: 100 },
    { month: 'Apr', Builders: 25, Buyers: 125 },
    { month: 'May', Builders: 30, Buyers: 150 },
    { month: 'Jun', Builders: (metrics?.total_builders || 35), Buyers: (metrics?.total_buyers || 175) },
  ];

      const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-4 border border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold mb-2 text-gray-100">{payload[0].payload.month}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-200" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
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
          <h3 className="text-xl font-bold text-gray-100 mb-1">User Growth</h3>
          <p className="text-sm text-gray-400">Builders and buyers over time</p>
        </div>
        <div className="flex items-center gap-2 text-emerald-600">
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm font-medium">Growing</span>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorBuilders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBuyers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="Builders" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorBuilders)" 
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="Buyers" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorBuyers)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800">
        <div>
          <div className="text-sm text-gray-400 mb-1">Total Builders</div>
          <div className="text-2xl font-bold text-blue-400">
            {metrics?.total_builders?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            +{metrics?.new_builders || 0} this month
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Total Buyers</div>
          <div className="text-2xl font-bold text-emerald-400">
            {metrics?.total_buyers?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            +{metrics?.new_buyers || 0} this month
          </div>
        </div>
      </div>
    </div>
  );
}

