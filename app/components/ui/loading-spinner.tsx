'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'gold' | 'sapphire';
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  variant = 'default' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses = {
    default: 'border-white/30 border-t-white',
    gold: 'border-gold-500/30 border-t-gold-400',
    sapphire: 'border-blue-500/30 border-t-blue-400',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <motion.div
        className={cn(
          'rounded-full border-2',
          sizeClasses[size],
          colorClasses[variant]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// Glass container loading overlay
export function GlassLoadingOverlay({ className }: { className?: string }) {
  return (
    <div className={cn(
      'absolute inset-0 flex items-center justify-center',
      'backdrop-blur-sm bg-white/5 rounded-3xl',
      className
    )}>
      <LoadingSpinner size="lg" variant="gold" />
    </div>
  );
}



