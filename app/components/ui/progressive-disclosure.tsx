'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface ProgressiveDisclosureProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
}

/**
 * Progressive Disclosure Component
 * Shows/hides content gradually to reduce cognitive load
 */
export function ProgressiveDisclosure({
  title,
  children,
  defaultOpen = false,
  className,
  variant = 'default',
}: ProgressiveDisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variants = {
    default: 'bg-slate-800/50 border border-slate-700/30 rounded-xl p-4',
    card: 'bg-slate-800/50 border border-slate-700/30 rounded-xl p-6',
    minimal: 'border-b border-slate-700/30 pb-4',
  };

  return (
    <div className={cn(variants[variant], className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex-1">{title}</div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

