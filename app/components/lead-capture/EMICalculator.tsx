"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Calculator, Home, Download, Mail, Phone, Calendar, TrendingDown, ArrowRight } from 'lucide-react';
import { useBehavioralTracking } from '@/hooks/useBehavioralTracking';

interface EMIStep1Data {
  property_price: number;
  down_payment_percentage: number;
  loan_tenure_years: number;
  interest_rate: number;
}

interface EMIStep2Data {
  name: string;
  email: string;
}

interface EMIStep3Data {
  phone: string;
  loan_status: 'need_loan' | 'have_preapproval' | 'applied_waiting';
}

interface EMIStep4Data {
  preapproval_help: boolean;
  visit_date?: string;
  visit_time?: 'morning' | 'afternoon' | 'evening';
}

export function EMICalculator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEMIReport, setShowEMIReport] = useState(false);
  const [emiResults, setEmiResults] = useState<any>(null);

  const [step1Data, setStep1Data] = useState<EMIStep1Data>({
    property_price: 8000000,
    down_payment_percentage: 20,
    loan_tenure_years: 20,
    interest_rate: 8.5,
  });

  const [step2Data, setStep2Data] = useState<EMIStep2Data>({
    name: '',
    email: '',
  });

  const [step3Data, setStep3Data] = useState<EMIStep3Data>({
    phone: '',
    loan_status: 'need_loan',
  });

  const [step4Data, setStep4Data] = useState<EMIStep4Data>({
    preapproval_help: false,
  });

  const { sessionId, trackEvent } = useBehavioralTracking();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate EMI in real-time
  useEffect(() => {
    const calculateEMI = () => {
      const loanAmount = step1Data.property_price * (1 - step1Data.down_payment_percentage / 100);
      const monthlyRate = step1Data.interest_rate / 12 / 100;
      const numPayments = step1Data.loan_tenure_years * 12;

      if (numPayments > 0 && monthlyRate > 0) {
        const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        const totalPayment = emi * numPayments;
        const totalInterest = totalPayment - loanAmount;

        setEmiResults({
          loan_amount: Math.round(loanAmount),
          monthly_emi: Math.round(emi),
          total_interest: Math.round(totalInterest),
          total_payment: Math.round(totalPayment),
        });
      }
    };

    calculateEMI();
  }, [step1Data]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Enhanced: Add income and credit data for advanced AI (if available)
      const calcResponse = await fetch('/api/lead-capture/calculate-emi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...step1Data,
          use_advanced_ai: true, // Enable advanced AI
          monthly_income: 100000, // Can be made dynamic from user input
          existing_loans_emi: 0, // Can be made dynamic
          cibil_score: 750, // Can be made dynamic
          employment_type: 'salaried', // Can be made dynamic
        }),
      });

      const calcData = await calcResponse.json();
      if (!calcData.success) {
        throw new Error('Failed to calculate EMI');
      }

      setEmiResults(calcData.results);

      const response = await fetch('/api/automation/lead-capture/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: 'emi_calculator',
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
          event_metadata: { tool: 'emi_calculator', step: 1 },
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
          form_type: 'emi_calculator',
          step_1_data: step1Data,
          step_2_data: step2Data,
          calculation_results: emiResults,
          current_step: 2,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setLeadId(data.lead_id);
        setShowEMIReport(true);
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'emi_calculator', step: 2 },
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
          form_type: 'emi_calculator',
          step_1_data: step1Data,
          step_2_data: step2Data,
          step_3_data: step3Data,
          calculation_results: emiResults,
          current_step: 3,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentStep(4);
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'emi_calculator', step: 3 },
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
          form_type: 'emi_calculator',
          step_1_data: step1Data,
          step_2_data: step2Data,
          step_3_data: step3Data,
          step_4_data: step4Data,
          calculation_results: emiResults,
          current_step: 4,
          completed: true,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'emi_calculator', step: 4, completed: true },
        });
      }
    } catch (error) {
      console.error('Error submitting step 4:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {/* STEP 1: EMI Calculation (No Email) */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-blue-300/25"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-600/20">
                <Calculator className="w-8 h-8 text-blue-300" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Home Loan EMI Calculator
                </h3>
                <p className="text-slate-400 mt-1">
                  Calculate your monthly payments instantly
                </p>
              </div>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-8">
              {/* Property Price */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-300">
                    Property Price
                  </label>
                  <span className="text-2xl font-bold text-blue-300">
                    {formatCurrency(step1Data.property_price)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000000"
                  max="100000000"
                  step="100000"
                  value={step1Data.property_price}
                  onChange={(e) => setStep1Data({
                    ...step1Data,
                    property_price: parseInt(e.target.value)
                  })}
                  className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>₹10L</span>
                  <span>₹50L</span>
                  <span>₹10Cr</span>
                </div>
              </div>

              {/* Down Payment */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-300">
                    Down Payment
                  </label>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-emerald-300">
                      {step1Data.down_payment_percentage}%
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatCurrency(step1Data.property_price * step1Data.down_payment_percentage / 100)}
                    </p>
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  value={step1Data.down_payment_percentage}
                  onChange={(e) => setStep1Data({
                    ...step1Data,
                    down_payment_percentage: parseInt(e.target.value)
                  })}
                  className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>10%</span>
                  <span>40%</span>
                  <span>80%</span>
                </div>
              </div>

              {/* Loan Tenure */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-300">
                    Loan Tenure
                  </label>
                  <span className="text-2xl font-bold text-purple-300">
                    {step1Data.loan_tenure_years} Years
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={step1Data.loan_tenure_years}
                  onChange={(e) => setStep1Data({
                    ...step1Data,
                    loan_tenure_years: parseInt(e.target.value)
                  })}
                  className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>5 years</span>
                  <span>15 years</span>
                  <span>30 years</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-300">
                    Interest Rate
                  </label>
                  <span className="text-2xl font-bold text-amber-300">
                    {step1Data.interest_rate}% p.a.
                  </span>
                </div>
                <input
                  type="range"
                  min="6.5"
                  max="12"
                  step="0.1"
                  value={step1Data.interest_rate}
                  onChange={(e) => setStep1Data({
                    ...step1Data,
                    interest_rate: parseFloat(e.target.value)
                  })}
                  className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>6.5%</span>
                  <span>9%</span>
                  <span>12%</span>
                </div>
              </div>

              {/* EMI Result Display */}
              {emiResults && (
                <div className="p-6 bg-gradient-to-r from-blue-500/10 via-blue-600/10 to-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="text-center mb-6">
                    <p className="text-sm text-slate-400 mb-2">Your Monthly EMI</p>
                    <p className="text-5xl font-bold text-blue-300">
                      {formatCurrency(emiResults.monthly_emi)}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-blue-500/20">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">Loan Amount</p>
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(emiResults.loan_amount)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">Total Interest</p>
                      <p className="text-lg font-bold text-amber-300">
                        {formatCurrency(emiResults.total_interest)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">Total Payment</p>
                      <p className="text-lg font-bold text-emerald-300">
                        {formatCurrency(emiResults.total_payment)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !emiResults}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Home className="w-5 h-5" />
                    Check My Loan Eligibility
                  </>
                )}
              </button>

              <p className="text-xs text-slate-400 text-center">
                No email required • Free eligibility check
              </p>
            </form>
          </motion.div>
        )}

        {/* STEP 2: Email for Detailed Loan Report */}
        {currentStep === 2 && !showEMIReport && emiResults && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-blue-300/25"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>
              <h3 className="text-3xl font-bold text-white mb-2">
                Your EMI is {formatCurrency(emiResults.monthly_emi)}/month
              </h3>
              <p className="text-lg text-slate-300">
                Get your complete loan eligibility report
              </p>
            </div>

            {/* Value Proposition */}
            <div className="mb-8 p-6 bg-slate-700/30 rounded-lg">
              <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-400" />
                Free Loan Eligibility Report Includes:
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Compare 15+ lenders (HDFC, SBI, ICICI, Axis, Indian Bank, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Tax benefit calculations (Section 24 + 80C)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Prepayment strategy to save {formatCurrency(emiResults.total_interest * 0.3)} in interest</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Required documents checklist</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Estimated processing time and fees</span>
                </li>
              </ul>
            </div>

            {/* Email Form */}
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="Priya Sharma"
                  value={step2Data.name}
                  onChange={(e) => setStep2Data({ ...step2Data, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-blue-300/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={step2Data.email}
                    onChange={(e) => setStep2Data({ ...step2Data, email: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-blue-300/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Get My Loan Eligibility Report
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>No impact on credit score</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <span>Instant delivery</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2 RESULTS: Show EMI Report */}
        {currentStep === 2 && showEMIReport && emiResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-blue-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Your EMI Breakdown is Ready!
              </h3>
              <p className="text-slate-300">
                Complete loan analysis with interest savings strategies
              </p>
            </div>

            <div className="p-6 bg-gradient-to-r from-blue-500/20 via-blue-600/20 to-blue-500/20 rounded-lg border border-blue-300/25">
              <div className="text-center">
                <h4 className="text-xl font-bold text-white mb-4">
                  Want Help Reducing Your EMI?
                </h4>
                <p className="text-slate-300 mb-6">
                  Our loan specialists can help you save up to {formatCurrency(emiResults.total_interest * 0.3)} in interest
                </p>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-lg transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 flex items-center gap-2 mx-auto"
                >
                  Get EMI Reduction Strategies
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Phone + Loan Status */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-blue-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Let's Optimize Your Loan
              </h3>
              <p className="text-slate-300">
                Our specialists will help you get the best rate and reduce EMI
              </p>
            </div>

            <form onSubmit={handleStep3Submit} className="space-y-6">
              {/* Phone Number */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  WhatsApp Number
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
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-blue-300/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Loan Status */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Current Loan Status
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'need_loan', label: 'Need Home Loan', description: 'Starting fresh, need pre-approval' },
                    { value: 'have_preapproval', label: 'Have Pre-Approval', description: 'Already got loan sanctioned, looking for properties' },
                    { value: 'applied_waiting', label: 'Applied, Waiting', description: 'Loan application submitted, waiting for approval' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStep3Data({ ...step3Data, loan_status: option.value as any })}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        step3Data.loan_status === option.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                          step3Data.loan_status === option.value
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-slate-500'
                        }`}>
                          {step3Data.loan_status === option.value && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium mb-1 ${
                            step3Data.loan_status === option.value ? 'text-blue-300' : 'text-white'
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
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <TrendingDown className="w-5 h-5" />
                Get EMI Optimization Help
              </button>

              <p className="text-xs text-slate-400 text-center">
                Response time: <span className="font-semibold text-blue-300">Under 2 hours</span> • Free consultation
              </p>
            </form>
          </motion.div>
        )}

        {/* STEP 4: Pre-approval Assistance */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-blue-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Pre-Approval Assistance
              </h3>
              <p className="text-slate-300">
                Our loan specialists will help you get pre-approved quickly
              </p>
            </div>

            <form onSubmit={handleStep4Submit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  What assistance do you need?
                </label>
                <div className="space-y-3">
                  {[
                    { value: true, label: 'Yes, I need pre-approval help', description: 'Connect me with a loan specialist' },
                    { value: false, label: 'No, I\'m good', description: 'I have all information I need' },
                  ].map(option => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setStep4Data({ ...step4Data, preapproval_help: option.value })}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        step4Data.preapproval_help === option.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                          step4Data.preapproval_help === option.value
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-slate-500'
                        }`}>
                          {step4Data.preapproval_help === option.value && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium mb-1 ${
                            step4Data.preapproval_help === option.value ? 'text-blue-300' : 'text-white'
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

              {step4Data.preapproval_help && (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Preferred Consultation Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="date"
                        value={step4Data.visit_date || ''}
                        onChange={(e) => setStep4Data({ ...step4Data, visit_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-blue-300/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

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
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                          }`}
                        >
                          <div className="text-2xl mb-2">{slot.icon}</div>
                          <p className={`font-medium ${
                            step4Data.visit_time === slot.value ? 'text-blue-300' : 'text-white'
                          }`}>
                            {slot.label}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{slot.time}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                {step4Data.preapproval_help ? 'Schedule Consultation' : 'Complete'}
              </button>
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
                  Success! Your EMI report has been sent
                </h4>
                <p className="text-slate-300">
                  {step4Data.preapproval_help
                    ? 'A loan specialist will contact you within 2 hours to schedule your consultation.'
                    : 'Check your email for the complete EMI breakdown and loan eligibility report.'}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}













