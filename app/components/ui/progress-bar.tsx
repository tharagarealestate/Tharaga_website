'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface ProgressBarProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

/**
 * Progress Bar Component
 * Shows progress through multi-step forms/processes
 */
export function ProgressBar({ steps, currentStep, className }: ProgressBarProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {/* Step Circle */}
                <div className="flex flex-col items-center relative z-10">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                      backgroundColor: isCompleted
                        ? '#10b981'
                        : isCurrent
                        ? '#d4af37'
                        : '#475569',
                    }}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      'border-2 transition-colors',
                      isCompleted
                        ? 'border-emerald-500 bg-emerald-500'
                        : isCurrent
                        ? 'border-gold-400 bg-gold-400'
                        : 'border-slate-600 bg-slate-700'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {index + 1}
                      </span>
                    )}
                  </motion.div>
                  {/* Step Label */}
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        isCurrent ? 'text-gold-400' : 'text-slate-400'
                      )}
                    >
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="text-xs text-slate-500 mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 -mt-5 relative">
                    <div className="absolute inset-0 bg-slate-700 rounded" />
                    <motion.div
                      initial={false}
                      animate={{
                        width: isCompleted ? '100%' : '0%',
                      }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 bg-emerald-500 rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

