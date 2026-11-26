'use client';

import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface PremiumButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'gold' | 'sapphire' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  shimmer?: boolean;
}

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    shimmer = false,
    children,
    disabled,
    ...props
  }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-r from-[#D4AF37] to-[#0F52BA] text-white hover:from-[#E8D48A] hover:to-[#3D7DD8] shadow-lg shadow-[#0F52BA]/25',
      secondary: 'bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20',
      gold: 'bg-gradient-to-r from-[#D4AF37] to-[#E8D48A] text-gray-900 hover:from-[#E8D48A] hover:to-[#D4AF37] shadow-lg shadow-[#D4AF37]/25',
      sapphire: 'bg-gradient-to-r from-[#0F52BA] to-[#3D7DD8] text-white hover:from-[#3D7DD8] hover:to-[#0F52BA] shadow-lg shadow-[#0F52BA]/25',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
      outline: 'bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white',
      danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2 text-base rounded-xl',
      lg: 'px-6 py-3 text-lg rounded-xl',
      xl: 'px-8 py-4 text-xl rounded-2xl',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center font-semibold transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          shimmer && 'overflow-hidden',
          className
        )}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        disabled={disabled || loading}
        {...props}
      >
        {shimmer && (
          <motion.div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ translateX: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}
        
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        
        <span className="relative z-10">{children}</span>
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </motion.button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';











