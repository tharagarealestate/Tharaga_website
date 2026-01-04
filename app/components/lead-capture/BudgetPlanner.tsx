"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, PiggyBank, TrendingUp, Download, Mail, Phone, Calendar, Home, AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { useBehavioralTracking } from '@/hooks/useBehavioralTracking';

interface BudgetStep1Data {
  primary_income_monthly: number;
  secondary_income_monthly: number;
  other_income_monthly: number;
  family_type: 'single' | 'couple' | 'joint_family';
  monthly_expenses: number;
  existing_loans_emi: number;
  savings_available: number;
  city: string;
}

interface BudgetStep2Data {
  name: string;
  email: string;
}

interface BudgetStep3Data {
  phone: string;
  timeline: string;
  preferred_areas: string[];
  property_preferences: string[];
}

interface BudgetStep4Data {
  visit_date: string;
  visit_time: 'morning' | 'afternoon' | 'evening';
  family_members: number;
  financing_status: 'need_loan' | 'have_preapproval' | 'cash_buyer';
}

export function BudgetPlanner() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBudgetReport, setShowBudgetReport] = useState(false);
  const [budgetResults, setBudgetResults] = useState<any>(null);

  const [step1Data, setStep1Data] = useState<BudgetStep1Data>({
    primary_income_monthly: 80000,
    secondary_income_monthly: 0,
    other_income_monthly: 0,
    family_type: 'couple',
    monthly_expenses: 35000,
    existing_loans_emi: 0,
    savings_available: 500000,
    city: 'Chennai',
  });

  const [step2Data, setStep2Data] = useState<BudgetStep2Data>({
    name: '',
    email: '',
  });

  const [step3Data, setStep3Data] = useState<BudgetStep3Data>({
    phone: '',
    timeline: '6_months',
    preferred_areas: [],
    property_preferences: [],
  });

  const [step4Data, setStep4Data] = useState<BudgetStep4Data>({
    visit_date: '',
    visit_time: 'afternoon',
    family_members: 2,
    financing_status: 'need_loan',
  });

  const { sessionId, trackEvent } = useBehavioralTracking();

  const cities = ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Tirunelveli'];
  const areasByCity: Record<string, string[]> = {
    Chennai: ['OMR', 'ECR', 'Perungudi', 'Velachery', 'Porur', 'Anna Nagar', 'T Nagar', 'Adyar'],
    Coimbatore: ['Saravanampatti', 'Peelamedu', 'RS Puram', 'Gandhipuram', 'Kalapatti'],
    Madurai: ['K Pudur', 'SS Colony', 'Anna Nagar', 'Thirunagar', 'Vilangudi'],
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    else if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const calcResponse = await fetch('/api/lead-capture/calculate-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step1Data),
      });

      const calcData = await calcResponse.json();
      if (!calcData.success) {
        throw new Error('Failed to calculate budget');
      }

      setBudgetResults(calcData.results);

      const response = await fetch('/api/automation/lead-capture/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: 'budget_planner',
          form_variant: 'tamil_nadu_v1',
          step_1_data: step1Data,
          calculation_results: calcData.results,
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
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'budget_planner', step: 1 },
        });
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
          form_type: 'budget_planner',
          step_1_data: step1Data,
          step_2_data: step2Data,
          calculation_results: budgetResults,
          current_step: 2,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setLeadId(data.lead_id);
        setShowBudgetReport(true);
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'budget_planner', step: 2 },
        });
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
          form_type: 'budget_planner',
          step_1_data: step1Data,
          step_2_data: step2Data,
          step_3_data: {
            ...step3Data,
            preferred_city: step1Data.city,
            cultural_preferences: step3Data.property_preferences,
          },
          calculation_results: budgetResults,
          current_step: 3,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentStep(4);
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'budget_planner', step: 3 },
        });
      }
    } catch (error) {
      console.error('Error submitting step 3:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/automation/lead-capture/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          lead_id: leadId,
          form_type: 'budget_planner',
          step_1_data: step1Data,
          step_2_data: step2Data,
          step_3_data: step3Data,
          step_4_data: step4Data,
          calculation_results: budgetResults,
          current_step: 4,
          completed: true,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'budget_planner', step: 4, completed: true },
        });
      }
    } catch (error) {
      console.error('Error submitting step 4:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
      <AnimatePresence mode="wait">
        {/* STEP 1: Income & Expense Assessment (No Email Required) */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-emerald-300/25"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 flex-shrink-0">
                <PiggyBank className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Budget Planner
                </h3>
                <p className="text-sm sm:text-base text-slate-400 mt-1">
                  Find out exactly how much home you can afford in Tamil Nadu
                </p>
              </div>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-4 sm:space-y-6">
              {/* City Selection */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Which city are you buying in?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {cities.map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setStep1Data({ ...step1Data, city })}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        step1Data.city === city
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Family Type */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Family Structure
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'single', label: 'Single', emoji: '🧑', description: 'Individual buyer' },
                    { value: 'couple', label: 'Couple', emoji: '👫', description: 'Dual income' },
                    { value: 'joint_family', label: 'Joint Family', emoji: '👨‍👩‍👧‍👦', description: 'Multiple earners' },
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setStep1Data({ ...step1Data, family_type: type.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        step1Data.family_type === type.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.emoji}</div>
                      <p className={`text-sm font-medium mb-1 ${
                        step1Data.family_type === type.value ? 'text-emerald-300' : 'text-white'
                      }`}>
                        {type.label}
                      </p>
                      <p className="text-xs text-slate-400">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Income */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Primary Income (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input
                    type="number"
                    value={step1Data.primary_income_monthly}
                    onChange={(e) => setStep1Data({
                      ...step1Data,
                      primary_income_monthly: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    step="5000"
                    required
                    className="w-full pl-10 pr-4 py-3 text-base rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-emerald-300/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {[40000, 60000, 80000, 100000, 150000].map(income => (
                    <button
                      key={income}
                      type="button"
                      onClick={() => setStep1Data({ ...step1Data, primary_income_monthly: income })}
                      className={`px-3 py-2 min-h-[36px] rounded text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                        step1Data.primary_income_monthly === income
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700/50 text-slate-300 active:bg-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      ₹{income >= 100000 ? `${income / 100000}L` : `${income / 1000}K`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Income */}
              {step1Data.family_type !== 'single' && (
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Spouse/Co-borrower Income (Monthly)
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      value={step1Data.secondary_income_monthly}
                      onChange={(e) => setStep1Data({
                        ...step1Data,
                        secondary_income_monthly: parseInt(e.target.value) || 0
                      })}
                      min="0"
                      step="5000"
                      className="w-full pl-12 pr-4 py-3 text-base rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-emerald-300/50 focus:outline-none transition-colors"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Including spouse/parent/sibling income increases loan eligibility by 60-80%
                  </p>
                </div>
              )}

              {/* Monthly Expenses */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Monthly Expenses
                  </label>
                  <span className="text-base sm:text-lg font-bold text-amber-300">
                    {formatCurrency(step1Data.monthly_expenses)}
                  </span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="100000"
                  step="5000"
                  value={step1Data.monthly_expenses}
                  onChange={(e) => setStep1Data({
                    ...step1Data,
                    monthly_expenses: parseInt(e.target.value)
                  })}
                  className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>₹10K</span>
                  <span>₹50K</span>
                  <span>₹1L</span>
                </div>
              </div>

              {/* Existing Loans EMI */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Existing Loan EMIs (Car, Personal, Credit Card)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input
                    type="number"
                    value={step1Data.existing_loans_emi}
                    onChange={(e) => setStep1Data({
                      ...step1Data,
                      existing_loans_emi: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    step="1000"
                    className="w-full pl-10 pr-4 py-3 text-base rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-emerald-300/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Savings Available */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Savings Available for Down Payment
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input
                    type="number"
                    value={step1Data.savings_available}
                    onChange={(e) => setStep1Data({
                      ...step1Data,
                      savings_available: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    step="50000"
                    required
                    className="w-full pl-10 pr-4 py-3 text-base rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-emerald-300/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {[200000, 500000, 1000000, 1500000, 2000000].map(savings => (
                    <button
                      key={savings}
                      type="button"
                      onClick={() => setStep1Data({ ...step1Data, savings_available: savings })}
                      className={`px-3 py-2 min-h-[36px] rounded text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                        step1Data.savings_available === savings
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700/50 text-slate-300 active:bg-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      ₹{savings / 100000}L
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <PiggyBank className="w-5 h-5" />
                    Calculate My Home Budget
                  </>
                )}
              </button>

              <p className="text-xs text-slate-400 text-center">
                No email required • Instant affordability assessment
              </p>
            </form>

            {/* Trust Indicators */}
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-300">78%</p>
                  <p className="text-xs text-slate-400 mt-1">TN buyers need loans</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-300">50%</p>
                  <p className="text-xs text-slate-400 mt-1">FOIR limit (TN banks)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-300">20%</p>
                  <p className="text-xs text-slate-400 mt-1">Min. down payment</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Detailed Budget Report (Email for PDF) */}
        {currentStep === 2 && !showBudgetReport && budgetResults && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-emerald-300/25"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>
              <h3 className="text-3xl font-bold text-white mb-2">
                You Can Afford {formatCurrency(budgetResults.total_budget)}!
              </h3>
              <p className="text-lg text-slate-300">
                Perfect for a {budgetResults.recommended_bhk} ({budgetResults.affordable_area_sqft} sq.ft)
              </p>
            </div>

            {/* Quick Summary */}
            <div className="mb-8 p-6 bg-gradient-to-r from-emerald-500/10 via-emerald-600/10 to-emerald-500/10 rounded-lg border border-emerald-500/20">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-1">Maximum EMI</p>
                  <p className="text-3xl font-bold text-emerald-300">
                    {formatCurrency(budgetResults.max_emi)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    per month for 20 years
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-1">Total Home Budget</p>
                  <p className="text-3xl font-bold text-blue-300">
                    {formatCurrency(budgetResults.total_budget)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    including down payment
                  </p>
                </div>
              </div>
            </div>

            {/* Health Check */}
            <div className="mb-8 space-y-3">
              <div className={`p-4 rounded-lg border-2 ${
                budgetResults.is_healthy_foir ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-amber-500/50 bg-amber-500/10'
              }`}>
                <div className="flex items-center gap-3">
                  {budgetResults.is_healthy_foir ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${budgetResults.is_healthy_foir ? 'text-emerald-300' : 'text-amber-300'}`}>
                      FOIR: {budgetResults.foir_percentage}%
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {budgetResults.is_healthy_foir
                        ? 'Excellent! Your loan obligation is healthy'
                        : 'Consider increasing down payment or reducing loan tenure'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Value Proposition - TN Specific */}
            <div className="mb-8 p-6 bg-slate-700/30 rounded-lg">
              <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Download className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                Get Your Complete Budget Report (FREE)
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Best home loan schemes in Tamil Nadu (SBI, Indian Bank, HDFC)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>TN government subsidies: PMAY, TNSCB schemes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Tax benefits calculator (Section 80C, 24B, 80EE)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Gold loan options for down payment (Muthoot, Manappuram rates)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Properties matching your budget in {step1Data.city}</span>
                </li>
              </ul>
            </div>

            {/* Email Form */}
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Your Name (தங்கள் பெயர்)
                </label>
                <input
                  type="text"
                  placeholder="Ramesh Kumar"
                  value={step2Data.name}
                  onChange={(e) => setStep2Data({ ...step2Data, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-emerald-300/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Email Address (மின்னஞ்சல்)
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={step2Data.email}
                    onChange={(e) => setStep2Data({ ...step2Data, email: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 text-base rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-emerald-300/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Get My Budget Report (PDF)
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 2 RESULTS: Show Budget Report */}
        {currentStep === 2 && showBudgetReport && budgetResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-emerald-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Your Budget Analysis is Ready!
              </h3>
              <p className="text-slate-300">
                Based on your income and expenses in {step1Data.city}
              </p>
            </div>

            <div className="p-6 bg-gradient-to-r from-emerald-500/20 via-emerald-600/20 to-emerald-500/20 rounded-lg border border-emerald-300/25">
              <div className="text-center">
                <h4 className="text-xl font-bold text-white mb-4">
                  Want Properties Matching Your {formatCurrency(budgetResults.total_budget)} Budget?
                </h4>
                <p className="text-slate-300 mb-6">
                  Our specialists have curated properties in {step1Data.city} within your budget
                </p>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 flex items-center gap-2 mx-auto"
                >
                  Show Me Matching Properties
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Property Matching (Phone + Timeline) */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-emerald-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Let's Find Your Dream Home in {step1Data.city}
              </h3>
              <p className="text-slate-300">
                We'll connect you with properties matching your {budgetResults ? formatCurrency(budgetResults.total_budget) : 'budget'}
              </p>
            </div>

            <form onSubmit={handleStep3Submit} className="space-y-6">
              {/* Phone Number */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  WhatsApp Number (வாட்ஸ்அப் எண்)
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={step3Data.phone}
                    onChange={(e) => setStep3Data({ ...step3Data, phone: e.target.value })}
                    pattern="[+]?[0-9]{10,13}"
                    required
                    className="w-full pl-12 pr-4 py-3 text-base rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-emerald-300/50 focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Response time: <span className="font-semibold text-emerald-300">Under 2 hours</span> via WhatsApp
                </p>
              </div>

              {/* Timeline */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  When are you planning to buy?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'immediate', label: 'Immediately', icon: '⚡' },
                    { value: '3_months', label: 'Within 3 months', icon: '📅' },
                    { value: '6_months', label: 'Within 6 months', icon: '🗓️' },
                    { value: '12_months', label: 'Within a year', icon: '📆' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStep3Data({ ...step3Data, timeline: option.value })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        step3Data.timeline === option.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <p className={`text-sm font-medium ${
                        step3Data.timeline === option.value ? 'text-emerald-300' : 'text-slate-300'
                      }`}>
                        {option.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Areas */}
              {areasByCity[step1Data.city] && (
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-3 block">
                    Preferred Areas (விருப்பமான பகுதிகள்)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {areasByCity[step1Data.city].map(area => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => {
                          const areas = step3Data.preferred_areas.includes(area)
                            ? step3Data.preferred_areas.filter(a => a !== area)
                            : [...step3Data.preferred_areas, area];
                          setStep3Data({ ...step3Data, preferred_areas: areas });
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          step3Data.preferred_areas.includes(area)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Show Me Matching Properties
              </button>

              <p className="text-xs text-slate-400 text-center">
                We'll send property options via WhatsApp • No spam calls
              </p>
            </form>
          </motion.div>
        )}

        {/* STEP 4: Final Profile & Property Visit Scheduling */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-emerald-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Schedule Your Property Visit
              </h3>
              <p className="text-slate-300">
                Our property consultant will guide you through matching properties
              </p>
            </div>

            <form onSubmit={handleStep4Submit} className="space-y-6">
              {/* Visit Date */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Preferred Visit Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    value={step4Data.visit_date}
                    onChange={(e) => setStep4Data({ ...step4Data, visit_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full pl-12 pr-4 py-3 text-base rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-emerald-300/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Visit Time */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Preferred Time Slot
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'morning', label: 'Morning', time: '10 AM - 12 PM', icon: '🌅' },
                    { value: 'afternoon', label: 'Afternoon', time: '2 PM - 5 PM', icon: '☀️' },
                    { value: 'evening', label: 'Evening', time: '5 PM - 7 PM', icon: '🌆' },
                  ].map(slot => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setStep4Data({ ...step4Data, visit_time: slot.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        step4Data.visit_time === slot.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">{slot.icon}</div>
                      <p className={`font-medium ${
                        step4Data.visit_time === slot.value ? 'text-emerald-300' : 'text-white'
                      }`}>
                        {slot.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{slot.time}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Family Members */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Number of Family Members Visiting
                  </label>
                  <span className="text-2xl font-bold text-emerald-300">
                    {step4Data.family_members}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={step4Data.family_members}
                  onChange={(e) => setStep4Data({ ...step4Data, family_members: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Financing Status */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Loan Status
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'need_loan', label: 'Need Home Loan', description: 'We\'ll help with loan pre-approval (SBI, HDFC, Indian Bank)' },
                    { value: 'have_preapproval', label: 'Have Pre-Approval', description: 'Already got loan sanctioned from bank' },
                    { value: 'cash_buyer', label: 'Cash Buyer', description: 'No loan needed, paying full amount' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStep4Data({ ...step4Data, financing_status: option.value as any })}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        step4Data.financing_status === option.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                          step4Data.financing_status === option.value
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-slate-500'
                        }`}>
                          {step4Data.financing_status === option.value && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium mb-1 ${
                            step4Data.financing_status === option.value ? 'text-emerald-300' : 'text-white'
                          }`}>
                            {option.label}
                          </p>
                          <p className="text-sm text-slate-400">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Confirm Visit Schedule
              </button>

              <p className="text-xs text-slate-400 text-center">
                Instant confirmation via WhatsApp • Free property consultation
              </p>
            </form>

            {/* Success Message */}
            {!loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-gradient-to-r from-emerald-500/20 via-emerald-600/20 to-emerald-500/20 rounded-lg border border-emerald-300/25 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">
                  Success! We've received your information
                </h4>
                <p className="text-slate-300">
                  Our team will connect you with verified builders within 2 hours. Check your email and WhatsApp for updates.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

