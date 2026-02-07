"use client"

import { Line } from 'recharts'
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip } from 'recharts'

interface TrendSparklineProps {
  data: number[]
  color?: string
}

export function TrendSparkline({ data, color = '#F59E0B' }: TrendSparklineProps) {
  if (data.length === 0) return null

  const chartData = data.map((value, index) => ({
    index,
    value
  }))

  // Calculate trend
  const firstValue = data[0]
  const lastValue = data[data.length - 1]
  const trend = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'flat'
  const changePercent = firstValue !== 0
    ? ((lastValue - firstValue) / firstValue) * 100
    : 0

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <span
        className={`text-xs font-semibold ${
          trend === 'up'
            ? 'text-emerald-400'
            : trend === 'down'
            ? 'text-red-400'
            : 'text-slate-400'
        }`}
      >
        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {Math.abs(changePercent).toFixed(1)}%
      </span>
    </div>
  )
}
