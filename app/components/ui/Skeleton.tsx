import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('skeleton h-4 w-full', className)} />
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {[1, 2, 3, 4].map(j => (
            <Skeleton key={j} className="h-10 flex-1 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  )
}
