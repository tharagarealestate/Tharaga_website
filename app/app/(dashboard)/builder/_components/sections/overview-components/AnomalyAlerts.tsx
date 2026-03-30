"use client"

import { motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'

interface Anomaly {
  type: string
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  recommendation: string
}

interface AnomalyAlertsProps {
  anomalies: Anomaly[]
}

export function AnomalyAlerts({ anomalies }: AnomalyAlertsProps) {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-400/30',
          icon: AlertTriangle,
          iconColor: 'text-red-400',
          titleColor: 'text-red-300'
        }
      case 'medium':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-400/30',
          icon: AlertCircle,
          iconColor: 'text-amber-400',
          titleColor: 'text-amber-300'
        }
      default:
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-400/30',
          icon: Info,
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-300'
        }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {anomalies.map((anomaly, index) => {
        const styles = getSeverityStyles(anomaly.severity)
        const Icon = styles.icon

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${styles.bg} ${styles.border} border rounded-xl p-4 flex items-start gap-4`}
          >
            <Icon className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <h4 className={`text-sm font-semibold ${styles.titleColor} mb-1`}>
                {anomaly.title}
              </h4>
              <p className="text-sm text-slate-300 mb-2">{anomaly.description}</p>
              <div className="flex items-start gap-2">
                <span className="text-xs text-slate-400">💡</span>
                <p className="text-xs text-slate-400">{anomaly.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
