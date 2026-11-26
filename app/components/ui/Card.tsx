import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ children, hover = false, padding = 'md', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-zinc-900 border border-zinc-800 rounded-xl',
        'transition-colors duration-150',
        hover && 'hover:border-zinc-700',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-zinc-100', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-zinc-400', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center pt-4 mt-4 border-t border-zinc-800', className)} {...props}>
      {children}
    </div>
  )
}

/* Metric Card for dashboard KPIs */
interface MetricCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: ReactNode
}

export function MetricCard({ label, value, change, changeType = 'neutral', icon }: MetricCardProps) {
  return (
    <Card hover padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400 mb-1">{label}</p>
          <p className="text-2xl font-bold font-mono text-zinc-100 tracking-tight">{value}</p>
          {change && (
            <p className={cn(
              'text-xs font-medium mt-1',
              changeType === 'positive' && 'text-emerald-400',
              changeType === 'negative' && 'text-red-400',
              changeType === 'neutral' && 'text-zinc-500',
            )}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
