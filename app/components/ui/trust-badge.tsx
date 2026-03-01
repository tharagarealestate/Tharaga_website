'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Shield, CheckCircle2, Award, Verified } from 'lucide-react';

interface TrustBadgeProps {
  type?: 'rera' | 'verified' | 'certified' | 'award' | 'custom';
  label: string;
  icon?: ReactNode;
  verified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const badgeIcons = {
  rera: Shield,
  verified: CheckCircle2,
  certified: Award,
  award: Award,
  custom: Verified,
};

const badgeColors = {
  rera: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/50',
    text: 'text-emerald-300',
    icon: 'text-emerald-400',
  },
  verified: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    text: 'text-blue-300',
    icon: 'text-blue-400',
  },
  certified: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/50',
    text: 'text-amber-300',
    icon: 'text-amber-400',
  },
  award: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/50',
    text: 'text-purple-300',
    icon: 'text-purple-400',
  },
  custom: {
    bg: 'bg-slate-700/30',
    border: 'border-slate-600/50',
    text: 'text-slate-300',
    icon: 'text-slate-400',
  },
};

const badgeSizes = {
  sm: {
    container: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    container: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    container: 'px-4 py-2 text-base',
    icon: 'w-5 h-5',
  },
};

/**
 * Trust Badge Component
 * Shows verification and trust signals
 */
export function TrustBadge({
  type = 'verified',
  label,
  icon,
  verified = true,
  size = 'md',
  className,
  onClick,
}: TrustBadgeProps) {
  const IconComponent = badgeIcons[type];
  const colors = badgeColors[type];
  const sizes = badgeSizes[size];
  const BadgeIcon = icon || <IconComponent className={sizes.icon} />;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      className={cn(
        'inline-flex items-center gap-2 rounded-full',
        'border backdrop-blur-sm font-medium',
        colors.bg,
        colors.border,
        colors.text,
        sizes.container,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <span className={colors.icon}>
        {BadgeIcon}
      </span>
      <span>{label}</span>
      {verified && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-emerald-400"
        >
          <CheckCircle2 className={sizes.icon} />
        </motion.span>
      )}
    </motion.div>
  );
}

