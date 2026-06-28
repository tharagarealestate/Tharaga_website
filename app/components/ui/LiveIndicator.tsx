'use client';

import { motion } from 'framer-motion';

interface LiveIndicatorProps {
  label?: string;
  count?: number;
  className?: string;
  variant?: 'dot' | 'badge' | 'full';
}

/**
 * Live/real-time indicator with pulsing green dot.
 * Makes data feel alive and constantly updated.
 */
export function LiveIndicator({
  label = 'Live',
  count,
  className = '',
  variant = 'dot',
}: LiveIndicatorProps) {
  if (variant === 'dot') {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
        {label && <span className="text-xs text-emerald-400 font-medium">{label}</span>}
      </span>
    );
  }

  if (variant === 'badge') {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
        <span className="text-xs text-emerald-400 font-medium">{label}</span>
        {count !== undefined && (
          <span className="text-xs text-emerald-300 font-bold">{count}</span>
        )}
      </motion.span>
    );
  }

  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg bg-emerald-400/5 border border-emerald-400/10 ${className}`}
    >
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
      </span>
      <div>
        <span className="text-sm text-emerald-400 font-medium">{label}</span>
        {count !== undefined && (
          <span className="text-sm text-emerald-300 font-bold ml-2">({count})</span>
        )}
      </div>
    </motion.div>
  );
}
