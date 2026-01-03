'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface OnboardingTask {
  task: string;
  title: string;
  description: string;
  completed: boolean;
  completed_at: string | null;
  action_url: string;
  estimated_time: string;
}

interface OnboardingChecklistData {
  checklist_items: OnboardingTask[];
  overall_progress: number;
  current_step: number;
  total_steps: number;
  is_onboarding_complete: boolean;
}

export default function OnboardingChecklist() {
  const [checklist, setChecklist] = useState<OnboardingChecklistData | null>(null);
  const [progress, setProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecklist();
  }, []);

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/onboarding/checklist');
      if (!response.ok) {
        throw new Error('Failed to fetch checklist');
      }
      const data = await response.json();
      setChecklist(data);
      setProgress(data.overall_progress || 0);
    } catch (error) {
      console.error('Error fetching checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (task: string) => {
    try {
      const response = await fetch('/api/onboarding/complete-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task })
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data.overall_progress || 0);
        fetchChecklist(); // Refresh
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  if (loading) {
    return (
      <div className="mb-6 bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 rounded-xl border border-amber-500/20 p-6">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!checklist || progress === 100) {
    return null; // Hide when onboarding complete
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 rounded-xl border border-amber-500/20 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/20">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-white">
                Getting Started with Tharaga
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Complete these steps to unlock full platform potential
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-300">{progress}%</p>
              <p className="text-xs text-slate-400">Complete</p>
            </div>
            <ChevronRight
              className={`w-5 h-5 text-slate-400 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </div>
        </button>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-800/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-amber-600 to-amber-500"
          />
        </div>

        {/* Checklist Items */}
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="p-6 space-y-3"
          >
            {checklist.checklist_items.map((item, index) => (
              <motion.div
                key={item.task}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  item.completed
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-700/30 border-slate-600/50 hover:border-amber-500/30'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => !item.completed && markComplete(item.task)}
                  disabled={item.completed}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    item.completed
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-500 hover:border-amber-500'
                  }`}
                >
                  {item.completed && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1">
                  <h4 className={`font-semibold ${
                    item.completed ? 'text-slate-400 line-through' : 'text-white'
                  }`}>
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-400 mt-1">
                    {item.description} • {item.estimated_time}
                  </p>
                </div>

                {/* Action Button */}
                {!item.completed && (
                  <Link
                    href={item.action_url}
                    className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors text-sm font-medium"
                  >
                    Start
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}


