'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, Users, Search, Eye, MessageSquare, CheckCircle } from 'lucide-react';

interface FunnelData {
  step: string;
  count: number;
  dropoff: number;
  icon: any;
}

export function ConversionFunnelChart() {
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);

  useEffect(() => {
    const fetchFunnelData = () => {
      fetch('/api/analytics/funnel')
        .then(res => res.json())
        .then(data => {
          if (data.funnel && data.funnel.length > 0) {
            const mapped = data.funnel.map((item: any, idx: number) => ({
              ...item,
              icon: [Users, Search, Eye, MessageSquare, CheckCircle][idx] || Users
            }));
            setFunnelData(mapped);
          } else {
            // No data yet - return empty structure
            setFunnelData([
              { step: 'Page Visit', count: 0, dropoff: 0, icon: Users },
              { step: 'Search', count: 0, dropoff: 0, icon: Search },
              { step: 'View Property', count: 0, dropoff: 0, icon: Eye },
              { step: 'Inquiry', count: 0, dropoff: 0, icon: MessageSquare },
              { step: 'Conversion', count: 0, dropoff: 0, icon: CheckCircle },
            ]);
          }
        })
        .catch(() => {
          // On error, show empty structure
          setFunnelData([
            { step: 'Page Visit', count: 0, dropoff: 0, icon: Users },
            { step: 'Search', count: 0, dropoff: 0, icon: Search },
            { step: 'View Property', count: 0, dropoff: 0, icon: Eye },
            { step: 'Inquiry', count: 0, dropoff: 0, icon: MessageSquare },
            { step: 'Conversion', count: 0, dropoff: 0, icon: CheckCircle },
          ]);
        });
    };

    fetchFunnelData();
    // Real-time refresh every 30 seconds
    const interval = setInterval(fetchFunnelData, 30000);
    return () => clearInterval(interval);
  }, []);

  const colors = ['#D4AF37', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{data.step}</p>
          <p className="text-sm text-slate-700">
            Users: <strong>{data.count.toLocaleString()}</strong>
          </p>
          {data.dropoff > 0 && (
            <p className="text-sm text-red-600 mt-1">
              Drop-off: <strong>{data.dropoff}%</strong>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const overallConversion = funnelData.length > 0
    ? ((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100).toFixed(2)
    : '0';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Conversion Funnel</h3>
          <p className="text-sm text-slate-600">Buyer journey from visit to conversion</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-600 mb-1">Overall Conversion</div>
          <div className="text-2xl font-bold text-emerald-600">
            {overallConversion}%
          </div>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" stroke="#64748b" />
            <YAxis 
              dataKey="step" 
              type="category" 
              stroke="#64748b"
              width={90}
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel Steps Breakdown */}
      <div className="grid grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-200">
        {funnelData.map((step, index) => {
          const Icon = step.icon || Users;
          const prevCount = index > 0 ? funnelData[index - 1].count : step.count;
          const conversion = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : '0';
          
          return (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index === funnelData.length - 1 
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-lg font-bold text-slate-900">
                {step.count.toLocaleString()}
              </div>
              <div className="text-xs text-slate-600 mb-1">{step.step}</div>
              {index > 0 && (
                <div className={`text-xs font-medium ${
                  parseFloat(conversion) < 50 ? 'text-red-600' : 'text-emerald-600'
                }`}>
                  {conversion}% conv.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

