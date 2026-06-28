'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'circle' | 'badge';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Skeleton Loader Component
 * Provides elegant loading states with shimmer animation
 */
export function Skeleton({ 
  className, 
  variant = 'default',
  width,
  height,
  animate = true
}: SkeletonProps) {
  const baseClasses = 'bg-slate-700/30 rounded';
  
  const variantClasses = {
    default: 'rounded-md',
    card: 'rounded-xl',
    text: 'rounded h-4',
    circle: 'rounded-full',
    badge: 'rounded-full h-6',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <motion.div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      animate={animate ? {
        opacity: [0.5, 1, 0.5],
      } : undefined}
      transition={animate ? {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      } : undefined}
    />
  );
}

/**
 * Skeleton Card - For property cards, feature cards, etc.
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-slate-800/50 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden', className)}>
      {/* Image skeleton */}
      <Skeleton variant="card" className="w-full h-48 mb-4" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
        <div className="flex gap-2 mt-4">
          <Skeleton variant="badge" className="w-16" />
          <Skeleton variant="badge" className="w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton Stats Card
 */
export function SkeletonStatsCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-slate-800/50 backdrop-blur-xl border border-slate-700/30 rounded-xl p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circle" className="w-8 h-8" />
        <Skeleton variant="circle" className="w-4 h-4" />
      </div>
      <Skeleton variant="text" className="w-1/3 h-8 mb-2" />
      <Skeleton variant="text" className="w-1/2 h-4" />
    </div>
  );
}

/**
 * Skeleton List Item
 */
export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4 border-b border-slate-700/30', className)}>
      <Skeleton variant="circle" className="w-12 h-12 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
      <Skeleton variant="badge" className="w-20" />
    </div>
  );
}

/**
 * Skeleton Grid - For property grids, feature grids
 */
export function SkeletonGrid({ 
  count = 3, 
  columns = 3,
  className 
}: { 
  count?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div 
      className={cn('grid gap-4', className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

