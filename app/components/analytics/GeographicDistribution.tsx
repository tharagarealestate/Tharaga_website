'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MapPin } from 'lucide-react';

interface LocationData {
  city: string;
  count: number;
  percentage: number;
}

const COLORS = ['#D4AF37', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export function GeographicDistribution() {
  const [locationData, setLocationData] = useState<LocationData[]>([]);

  useEffect(() => {
    // Fetch geographic data from API
    fetch('/api/analytics/geographic')
      .then(res => res.json())
      .then(data => {
        setLocationData(data.locations || [
          { city: 'Chennai', count: 4500, percentage: 35 },
          { city: 'Bangalore', count: 3200, percentage: 25 },
          { city: 'Mumbai', count: 2100, percentage: 16 },
          { city: 'Delhi', count: 1800, percentage: 14 },
          { city: 'Hyderabad', count: 1200, percentage: 10 },
        ]);
      })
      .catch(() => {
        // Fallback data
        setLocationData([
          { city: 'Chennai', count: 4500, percentage: 35 },
          { city: 'Bangalore', count: 3200, percentage: 25 },
          { city: 'Mumbai', count: 2100, percentage: 16 },
          { city: 'Delhi', count: 1800, percentage: 14 },
          { city: 'Hyderabad', count: 1200, percentage: 10 },
        ]);
      });
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{data.city}</p>
          <p className="text-sm text-slate-700">
            Users: <strong>{data.count.toLocaleString()}</strong>
          </p>
          <p className="text-sm text-slate-600">
            Percentage: <strong>{data.percentage}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  const totalUsers = locationData.reduce((sum, loc) => sum + loc.count, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Geographic Distribution</h3>
          <p className="text-sm text-slate-600">User distribution across cities</p>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <MapPin className="w-5 h-5" />
          <span className="text-sm font-medium">{locationData.length} cities</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={locationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ city, percentage }) => `${city}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {locationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Cities List */}
        <div className="space-y-4">
          <div className="text-sm text-slate-600 mb-4">
            Total Users: <span className="font-bold text-slate-900">{totalUsers.toLocaleString()}</span>
          </div>
          {locationData.map((location, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div>
                  <div className="font-semibold text-slate-900">{location.city}</div>
                  <div className="text-sm text-slate-600">
                    {location.count.toLocaleString()} users
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900">
                  {location.percentage}%
                </div>
                <div className="text-xs text-slate-500">of total</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

