'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UsageData {
  date: string;
  active_properties: number;
  quota_limit: number | null;
}

export function UsageAnalytics() {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [period, setPeriod] = useState<'7days' | '30days' | '90days'>('30days');

  useEffect(() => {
    loadUsageData();
  }, [period]);

  const loadUsageData = async () => {
    try {
      const response = await fetch(`/api/pricing/usage-history?period=${period}`);
      const data = await response.json();
      if (data.success) {
        setUsageData(data.usage || []);
      }
    } catch (error) {
      console.error('Failed to load usage data:', error);
    }
  };

  const chartData = usageData.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    'Active Properties': d.active_properties,
    'Quota Limit': d.quota_limit || 0
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900">Usage Trends</h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('7days')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              period === '7days'
                ? 'bg-[#1e40af] text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setPeriod('30days')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              period === '30days'
                ? 'bg-[#1e40af] text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setPeriod('90days')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              period === '90days'
                ? 'bg-[#1e40af] text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {usageData.length > 0 ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Active Properties" 
                stroke="#1e40af" 
                strokeWidth={2}
                fill="#1e40af"
                fillOpacity={0.1}
              />
              <Line 
                type="monotone" 
                dataKey="Quota Limit" 
                stroke="#D4AF37" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-slate-500">
          No usage data available yet
        </div>
      )}
    </div>
  );
}

