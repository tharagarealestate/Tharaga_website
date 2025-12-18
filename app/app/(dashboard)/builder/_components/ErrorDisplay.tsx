"use client"

import { AlertTriangle, RefreshCw, Lock, Database, WifiOff, FileQuestion } from 'lucide-react'
import { type ErrorType } from '@/lib/error-handler'
import { cn } from '@/lib/utils'

interface ErrorDisplayProps {
  errorType: ErrorType
  message: string
  technicalDetails?: string
  onRetry?: () => void
  retryable?: boolean
  className?: string
}

const glassPrimary = 'bg-white/[0.03] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]'

export function ErrorDisplay({ 
  errorType, 
  message, 
  technicalDetails,
  onRetry, 
  retryable = false,
  className 
}: ErrorDisplayProps) {
  const getErrorConfig = () => {
    switch (errorType) {
      case 'NO_DATA':
        return {
          icon: FileQuestion,
          iconColor: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          title: 'No Data Available',
          description: message || 'No records found. This is normal if you haven\'t created any yet.',
        }
      case 'AUTH_ERROR':
        return {
          icon: Lock,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          title: 'Access Denied',
          description: message || 'Please check your permissions or log in again.',
        }
      case 'NETWORK_ERROR':
        return {
          icon: WifiOff,
          iconColor: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30',
          title: 'Connection Error',
          description: message || 'Network error. Please check your connection and try again.',
        }
      case 'DATABASE_ERROR':
        return {
          icon: Database,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          title: 'Database Error',
          description: message || 'Database error occurred. Please contact support if this persists.',
        }
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          title: 'Error',
          description: message || 'An unexpected error occurred.',
        }
    }
  }

  const config = getErrorConfig()
  const Icon = config.icon

  return (
    <div className={cn(glassPrimary, 'p-6 text-center', className)}>
      <Icon className={cn('w-12 h-12 mx-auto mb-3', config.iconColor)} />
      <h3 className={cn('text-xl font-bold mb-2', config.iconColor)}>{config.title}</h3>
      <p className="text-gray-400 mb-4">{config.description}</p>
      
      {technicalDetails && (
        <details className="mt-4 text-left">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
            Technical Details
          </summary>
          <pre className="mt-2 p-2 bg-black/20 rounded text-xs text-gray-400 overflow-auto">
            {technicalDetails}
          </pre>
        </details>
      )}
      
      {retryable && onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-gold-500/20 border border-gold-500/40 text-gold-400 rounded-lg hover:bg-gold-500/30 transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  )
}
