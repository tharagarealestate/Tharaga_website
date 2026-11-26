'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date | string;
  onComplete?: () => void;
  className?: string;
  variant?: 'default' | 'urgent' | 'subtle';
  showDays?: boolean;
}

/**
 * Countdown Timer Component
 * Creates urgency with time-limited offers
 */
export function CountdownTimer({
  targetDate,
  onComplete,
  className,
  variant = 'default',
  showDays = true,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const targetTime = target.getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setIsComplete(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onComplete?.();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  if (isComplete) {
    return (
      <div className={cn('text-center p-4', className)}>
        <p className="text-red-400 font-semibold">Offer Expired</p>
      </div>
    );
  }

  const variantStyles = {
    default: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
    urgent: 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse',
    subtle: 'bg-slate-700/30 border-slate-600/50 text-slate-300',
  };

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <motion.div
      key={`${label}-${value}`}
      initial={{ scale: 1.2 }}
      animate={{ scale: 1 }}
      className="flex flex-col items-center"
    >
      <div className="bg-slate-800/50 rounded-lg px-3 py-2 min-w-[50px]">
        <span className="text-2xl font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-xs text-slate-400 mt-1">{label}</span>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'inline-flex items-center gap-3 px-4 py-3 rounded-xl',
        'border backdrop-blur-sm',
        variantStyles[variant],
        className
      )}
    >
      <Clock className="w-5 h-5" />
      <div className="flex items-center gap-2">
        {showDays && timeLeft.days > 0 && (
          <>
            <TimeUnit value={timeLeft.days} label="Days" />
            <span className="text-xl">:</span>
          </>
        )}
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <span className="text-xl">:</span>
        <TimeUnit value={timeLeft.minutes} label="Min" />
        <span className="text-xl">:</span>
        <TimeUnit value={timeLeft.seconds} label="Sec" />
      </div>
    </motion.div>
  );
}

