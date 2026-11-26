'use client';

import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'light' | 'medium' | 'dark' | 'gold' | 'sapphire';
  hover?: boolean;
  glow?: boolean;
  border?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'light', hover = true, glow = false, border = true, children, ...props }, ref) => {
    const variants = {
      light: 'bg-white/25 backdrop-blur-xl',
      medium: 'bg-white/15 backdrop-blur-xl',
      dark: 'bg-white/8 backdrop-blur-xl',
      gold: 'bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 backdrop-blur-xl',
      sapphire: 'bg-gradient-to-br from-[#0F52BA]/20 to-[#0F52BA]/5 backdrop-blur-xl',
    };

    const borders = {
      light: 'border border-white/18',
      medium: 'border border-white/12',
      dark: 'border border-white/8',
      gold: 'border border-[#D4AF37]/30',
      sapphire: 'border border-[#0F52BA]/30',
    };

    const glows = {
      light: 'shadow-lg shadow-white/10',
      medium: 'shadow-lg shadow-white/5',
      dark: 'shadow-lg shadow-black/20',
      gold: 'shadow-lg shadow-[#D4AF37]/20',
      sapphire: 'shadow-lg shadow-[#0F52BA]/20',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-2xl p-6',
          variants[variant],
          border && borders[variant],
          glow && glows[variant],
          hover && 'transition-all duration-300 hover:shadow-xl',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

