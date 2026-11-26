'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WalkthroughStep {
  step_number: number;
  title: string;
  content: string;
  target_selector: string;
  placement?: string;
  show_delay?: number;
}

interface Walkthrough {
  id: string;
  name: string;
  steps: WalkthroughStep[];
  walkthrough_type: string;
}

interface InteractiveWalkthroughProps {
  featureKey: string;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export default function InteractiveWalkthrough({
  featureKey,
  onComplete,
  onDismiss,
}: InteractiveWalkthroughProps) {
  const [walkthrough, setWalkthrough] = useState<Walkthrough | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    loadWalkthrough();
  }, [featureKey]);

  const loadWalkthrough = async () => {
    try {
      const response = await fetch(`/api/documentation/walkthroughs/${featureKey}`);
      if (response.ok) {
        const data = await response.json();
        if (data.walkthroughs && data.walkthroughs.length > 0) {
          const activeWalkthrough = data.walkthroughs.find((w: any) => w.is_active);
          if (activeWalkthrough) {
            setWalkthrough(activeWalkthrough);
            if (activeWalkthrough.user_progress) {
              if (activeWalkthrough.user_progress.is_completed) {
                return;
              }
              setCurrentStep(activeWalkthrough.user_progress.current_step || 0);
            }
            setIsActive(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading walkthrough:', error);
    }
  };

  const updateProgress = async (step: number, isCompleted: boolean = false) => {
    if (!walkthrough) return;

    try {
      await fetch('/api/documentation/walkthroughs/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walkthroughId: walkthrough.id,
          currentStep: step,
          completedSteps: walkthrough.steps.slice(0, step).map((s, i) => i),
          isCompleted,
        }),
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const nextStep = () => {
    if (!walkthrough) return;

    const next = currentStep + 1;
    if (next >= walkthrough.steps.length) {
      updateProgress(next - 1, true);
      setIsActive(false);
      onComplete?.();
    } else {
      setCurrentStep(next);
      updateProgress(next, false);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      updateProgress(currentStep - 1, false);
    }
  };

  const dismiss = () => {
    setIsActive(false);
    onDismiss?.();
  };

  if (!isActive || !walkthrough || !walkthrough.steps[currentStep]) {
    return null;
  }

  const step = walkthrough.steps[currentStep];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none"
        >
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-slate-800/95 backdrop-blur-xl rounded-xl glow-border p-6 max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-amber-300">
                    Step {currentStep + 1} of {walkthrough.steps.length}
                  </span>
                </div>
                <button
                  onClick={dismiss}
                  className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-slate-300 mb-6">{step.content}</p>
              
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={previousStep}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-1"
                >
                  {currentStep === walkthrough.steps.length - 1 ? 'Finish' : 'Next'}
                  {currentStep < walkthrough.steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="mt-4 h-1 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / walkthrough.steps.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-500"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
