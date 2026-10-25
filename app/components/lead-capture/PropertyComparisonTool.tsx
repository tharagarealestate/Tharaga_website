"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Shield, Lock, Sparkles } from 'lucide-react';
import { useBehavioralTracking } from '@/hooks/useBehavioralTracking';

interface Step1Data {
  bhk_type: '1BHK' | '2BHK' | '3BHK' | '4BHK+';
  budget_range: string;
  location_preference: string[];
}

interface Step2Data {
  name: string;
  email: string;
}

interface Step3Data {
  phone: string;
  exact_budget: string;
  timeline: string;
}

export function PropertyComparisonTool() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const [step1Data, setStep1Data] = useState<Step1Data>({
    bhk_type: '2BHK',
    budget_range: '50L-75L',
    location_preference: [],
  });

  const [step2Data, setStep2Data] = useState<Step2Data>({
    name: '',
    email: '',
  });

  const [step3Data, setStep3Data] = useState<Step3Data>({
    phone: '',
    exact_budget: '',
    timeline: '',
  });

  const { sessionId, trackCalculatorUse } = useBehavioralTracking();

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/automation/lead-capture/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: 'property_comparison_tool',
          step_1_data: step1Data,
          current_step: 1,
          session_id: sessionId,
          landing_page_url: typeof window !== 'undefined' ? window.location.href : '',
          referrer_url: typeof window !== 'undefined' ? document.referrer : '',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmissionId(data.submission_id);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('form_submission_id', data.submission_id);
        }
        setCurrentStep(2);
        trackCalculatorUse('roi_analysis', undefined, { tool: 'property_comparison', step: 1 });
      }
    } catch (error) {
      console.error('Error submitting step 1:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/automation/lead-capture/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          form_type: 'property_comparison_tool',
          step_1_data: step1Data,
          step_2_data: step2Data,
          current_step: 2,
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLeadId(data.lead_id);
        setShowResults(true);
        trackCalculatorUse('roi_analysis', undefined, { tool: 'property_comparison', step: 2 });
      }
    } catch (error) {
      console.error('Error submitting step 2:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/automation/lead-capture/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          lead_id: leadId,
          form_type: 'property_comparison_tool',
          step_1_data: step1Data,
          step_2_data: step2Data,
          step_3_data: step3Data,
          current_step: 3,
          completed: true,
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStep(4);
        trackCalculatorUse('roi_analysis', undefined, { tool: 'property_comparison', step: 3, completed: true });
      }
    } catch (error) {
      console.error('Error submitting step 3:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Compare Properties Instantly
            </h3>
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Looking for
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {(['1BHK', '2BHK', '3BHK', '4BHK+'] as const).map(bhk => (
                    <button
                      key={bhk}
                      type="button"
                      onClick={() => setStep1Data({ ...step1Data, bhk_type: bhk })}
                      className={`py-3 rounded-lg font-medium transition-all ${
                        step1Data.bhk_type === bhk
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {bhk}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Budget Range
                </label>
                <select
                  value={step1Data.budget_range}
                  onChange={(e) => setStep1Data({ ...step1Data, budget_range: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none"
                >
                  <option value="30L-50L">₹30 Lakhs - ₹50 Lakhs</option>
                  <option value="50L-75L">₹50 Lakhs - ₹75 Lakhs</option>
                  <option value="75L-1Cr">₹75 Lakhs - ₹1 Crore</option>
                  <option value="1Cr-2Cr">₹1 Crore - ₹2 Crores</option>
                  <option value="2Cr+">₹2 Crores+</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 font-bold text-lg rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'See Matching Properties →'}
              </button>

              <p className="text-xs text-slate-400 text-center">
                No email required • Instant results
              </p>
            </form>
          </motion.div>
        )}

        {currentStep === 2 && !showResults && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25"
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 flex items-center justify-center">
                <Check className="w-10 h-10 text-slate-900" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Great! We found 12 matching properties
              </h3>
              <p className="text-slate-300">
                Get your personalized comparison report via email
              </p>
            </div>

            <form onSubmit={handleStep2Submit} className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                value={step2Data.name}
                onChange={(e) => setStep2Data({ ...step2Data, name: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={step2Data.email}
                onChange={(e) => setStep2Data({ ...step2Data, email: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 font-bold text-lg rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Get My Personalized Report'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>No spam, ever</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>100% secure</span>
              </div>
            </div>
          </motion.div>
        )}

        {showResults && currentStep === 2 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Almost there! Let's find your perfect property
              </h3>
              <p className="text-slate-300">
                Our AI will match you with the best builder within 2 hours
              </p>
            </div>

            <form onSubmit={handleStep3Submit} className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={step3Data.phone}
                  onChange={(e) => setStep3Data({ ...step3Data, phone: e.target.value })}
                  required
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Get instant updates on matching properties via WhatsApp
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Exact Budget
                </label>
                <input
                  type="text"
                  placeholder="e.g., ₹65 Lakhs"
                  value={step3Data.exact_budget}
                  onChange={(e) => setStep3Data({ ...step3Data, exact_budget: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  When are you planning to buy?
                </label>
                <select
                  value={step3Data.timeline}
                  onChange={(e) => setStep3Data({ ...step3Data, timeline: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none"
                >
                  <option value="">Select timeline</option>
                  <option value="immediate">Immediately (within 1 month)</option>
                  <option value="1-3months">1-3 months</option>
                  <option value="3-6months">3-6 months</option>
                  <option value="6-12months">6-12 months</option>
                  <option value="researching">Just researching</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 font-bold text-lg rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (
                  <>
                    Connect Me with Verified Builders
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-4 rounded-lg bg-amber-500/20 border border-amber-400/30">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-100 mb-1">
                    Why we need your phone number?
                  </p>
                  <p className="text-xs text-amber-200/80">
                    Builders will contact you directly (no middlemen). Our AI ensures only serious, verified builders reach out. Average response time: under 2 hours.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 4 && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 flex items-center justify-center">
              <Check className="w-10 h-10 text-slate-900" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Success! We've received your information
            </h3>
            <p className="text-slate-300 mb-6">
              Our team will connect you with verified builders within 2 hours. Check your email and WhatsApp for updates.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

