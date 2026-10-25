'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { PremiumButton } from './premium-button';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'gold' | 'outline' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  children?: ReactNode;
}

/**
 * Empty State Component
 * Provides helpful guidance when no data exists
 */
export function EmptyState({
  icon: Icon,
  iconColor = 'text-blue-400',
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center',
        'bg-blue-500/10 border border-blue-500/30 rounded-2xl',
        'p-8 sm:p-12 text-center max-w-md mx-auto',
        'backdrop-blur-xl',
        className
      )}
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'w-16 h-16 rounded-full bg-blue-500/20',
            'flex items-center justify-center mb-6'
          )}
        >
          <Icon className={cn('w-8 h-8', iconColor)} />
        </motion.div>
      )}

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl sm:text-2xl font-semibold text-white mb-3"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-slate-300/80 mb-6 leading-relaxed"
      >
        {description}
      </motion.p>

      {children && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          {children}
        </motion.div>
      )}

      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          {action && (
            action.href ? (
              <PremiumButton
                variant={action.variant || 'gold'}
                size="md"
                asChild
              >
                <Link href={action.href}>
                  {action.label}
                </Link>
              </PremiumButton>
            ) : (
              <PremiumButton
                variant={action.variant || 'gold'}
                size="md"
                onClick={action.onClick}
              >
                {action.label}
              </PremiumButton>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <PremiumButton
                variant="outline"
                size="md"
                asChild
              >
                <Link href={secondaryAction.href}>
                  {secondaryAction.label}
                </Link>
              </PremiumButton>
            ) : (
              <PremiumButton
                variant="outline"
                size="md"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </PremiumButton>
            )
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

