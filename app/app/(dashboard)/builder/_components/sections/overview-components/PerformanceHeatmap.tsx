"use client"

import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'

interface PropertyPerformance {
  property_id: string
  views: number
  inquiries: number
}

interface PerformanceHeatmapProps {
  data: PropertyPerformance[]
}

export function PerformanceHeatmap({ data }: PerformanceHeatmapProps) {
  if (data.length === 0) return null

  // Calculate max values for normalization
  const maxViews = Math.max(...data.map(p => p.views), 1)
  const maxInquiries = Math.max(...data.map(p => p.inquiries), 1)

  // Calculate intensity (0-1) based on combined performance
  const getIntensity = (views: number, inquiries: number) => {
    const normalizedViews = views / maxViews
    const normalizedInquiries = inquiries / maxInquiries
    return (normalizedViews * 0.6 + normalizedInquiries * 0.4)
  }

  // Get color based on intensity
  const getColor = (intensity: number) => {
    if (intensity >= 0.8) return 'bg-emerald-500'
    if (intensity >= 0.6) return 'bg-emerald-400'
    if (intensity >= 0.4) return 'bg-amber-400'
    if (intensity >= 0.2) return 'bg-amber-500'
    return 'bg-red-500'
  }

  // Sort by performance
  const sortedData = [...data].sort((a, b) => {
    const intensityA = getIntensity(a.views, a.inquiries)
    const intensityB = getIntensity(b.views, b.inquiries)
    return intensityB - intensityA
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Property Performance Heatmap</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {sortedData.map((property, index) => {
          const intensity = getIntensity(property.views, property.inquiries)
          const conversionRate = property.views > 0
            ? ((property.inquiries / property.views) * 100).toFixed(1)
            : '0.0'

          return (
            <motion.div
              key={property.property_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <div
                className={`${getColor(intensity)} rounded-lg p-4 cursor-pointer hover:scale-105 transition-transform`}
                style={{ opacity: 0.7 + intensity * 0.3 }}
              >
                <div className="text-white text-xs font-semibold mb-2">
                  {property.property_id.slice(0, 8)}
                </div>
                <div className="text-white/90 text-xs space-y-1">
                  <div>👁️ {property.views}</div>
                  <div>💬 {property.inquiries}</div>
                  <div className="text-white/70">📊 {conversionRate}%</div>
                </div>
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-700 whitespace-nowrap">
                  <div className="font-semibold mb-1">Property {property.property_id.slice(0, 8)}</div>
                  <div>Views: {property.views}</div>
                  <div>Inquiries: {property.inquiries}</div>
                  <div>Conversion: {conversionRate}%</div>
                  <div className="mt-1 pt-1 border-t border-slate-700">
                    Performance: {(intensity * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Low</span>
          <div className="flex gap-1">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity) => (
              <div
                key={intensity}
                className={`w-4 h-4 rounded ${getColor(intensity)}`}
                style={{ opacity: 0.7 + intensity * 0.3 }}
              />
            ))}
          </div>
          <span>High</span>
        </div>
        <div className="text-slate-500">
          Intensity based on views and inquiries
        </div>
      </div>
    </motion.div>
  )
}
