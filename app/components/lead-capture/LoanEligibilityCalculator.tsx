"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, CreditCard, Building2, Download, Mail, Phone, Calendar, FileText, TrendingDown, AlertTriangle, ArrowRight } from 'lucide-react';
import { useBehavioralTracking } from '@/hooks/useBehavioralTracking';

interface LoanStep1Data {
  employment_type: 'salaried' | 'self_employed' | 'business_owner';
  monthly_income: number;
  existing_loans_emi: number;
  property_price: number;
  preferred_tenure_years: number;
  cibil_score_range: string;
  city: string;
}

interface LoanStep2Data {
  name: string;
  email: string;
}

interface LoanStep3Data {
  phone: string;
  preferred_bank: string;
  documents_ready: boolean;
  urgency: 'immediate' | 'this_month' | 'within_3_months';
}

interface LoanStep4Data {
  preapproval_help: boolean;
  visit_date?: string;
  visit_time?: 'morning' | 'afternoon' | 'evening';
}

export function LoanEligibilityCalculator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoanReport, setShowLoanReport] = useState(false);
  const [eligibilityResults, setEligibilityResults] = useState<any>(null);

  const [step1Data, setStep1Data] = useState<LoanStep1Data>({
    employment_type: 'salaried',
    monthly_income: 75000,
    existing_loans_emi: 0,
    property_price: 8000000,
    preferred_tenure_years: 20,
    cibil_score_range: '750+',
    city: 'Chennai',
  });

  const [step2Data, setStep2Data] = useState<LoanStep2Data>({
    name: '',
    email: '',
  });

  const [step3Data, setStep3Data] = useState<LoanStep3Data>({
    phone: '',
    preferred_bank: '',
    documents_ready: false,
    urgency: 'within_3_months',
  });

  const [step4Data, setStep4Data] = useState<LoanStep4Data>({
    preapproval_help: false,
  });

  const { sessionId, trackEvent } = useBehavioralTracking();

  const cities = ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'];
  const banks = ['SBI', 'HDFC', 'ICICI', 'Indian Bank', 'Axis Bank', 'Canara Bank', 'Kotak Mahindra'];

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    else if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getApprovalColorClass = (probability: number) => {
    if (probability >= 70) return 'from-emerald-600 to-emerald-500';
    if (probability >= 50) return 'from-blue-600 to-blue-500';
    if (probability >= 30) return 'from-amber-600 to-amber-500';
    return 'from-red-600 to-red-500';
  };

  const getApprovalTextColorClass = (probability: number) => {
    if (probability >= 70) return 'text-emerald-300';
    if (probability >= 50) return 'text-blue-300';
    if (probability >= 30) return 'text-amber-300';
    return 'text-red-300';
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const calcResponse = await fetch('/api/lead-capture/loan-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step1Data),
      });

      const calcData = await calcResponse.json();
      if (!calcData.success) {
        throw new Error('Failed to calculate loan eligibility');
      }

      setEligibilityResults(calcData.results);

      const response = await fetch('/api/automation/lead-capture/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: 'home_loan_eligibility',
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
          event_metadata: { tool: 'home_loan_eligibility', step: 1 },
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
          form_type: 'home_loan_eligibility',
          step_1_data: step1Data,
          step_2_data: step2Data,
          calculation_results: eligibilityResults,
          current_step: 2,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setLeadId(data.lead_id);
        setShowLoanReport(true);
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'home_loan_eligibility', step: 2 },
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
          form_type: 'home_loan_eligibility',
          step_1_data: step1Data,
          step_2_data: step2Data,
          step_3_data: step3Data,
          calculation_results: eligibilityResults,
          current_step: 3,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentStep(4);
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'home_loan_eligibility', step: 3 },
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
          form_type: 'home_loan_eligibility',
          step_1_data: step1Data,
          step_2_data: step2Data,
          step_3_data: step3Data,
          step_4_data: step4Data,
          calculation_results: eligibilityResults,
          current_step: 4,
          completed: true,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'home_loan_eligibility', step: 4, completed: true },
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
        {/* STEP 1: Basic Income & Credit Assessment (No Email) */}
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
                <CreditCard className="w-8 h-8 text-blue-300" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Home Loan Eligibility Calculator
                </h3>
                <p className="text-slate-400 mt-1">
                  Check how much loan you can get from Tamil Nadu banks
                </p>
              </div>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-6">
              {/* City */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  City
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {cities.map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setStep1Data({ ...step1Data, city })}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        step1Data.city === city
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Employment Type */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Employment Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'salaried', label: 'Salaried', icon: '👔', description: 'IT, Corporate, Govt job' },
                    { value: 'self_employed', label: 'Self-Employed', icon: '💼', description: 'Doctor, CA, Consultant' },
                    { value: 'business_owner', label: 'Business Owner', icon: '🏪', description: 'Textile, Manufacturing' },
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setStep1Data({ ...step1Data, employment_type: type.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        step1Data.employment_type === type.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <p className={`font-medium mb-1 ${
                        step1Data.employment_type === type.value ? 'text-blue-300' : 'text-white'
                      }`}>
                        {type.label}
                      </p>
                      <p className="text-xs text-slate-400">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Income */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Monthly Income (Net Take-Home)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input
                    type="number"
                    value={step1Data.monthly_income}
                    onChange={(e) => setStep1Data({
                      ...step1Data,
                      monthly_income: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    step="5000"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-blue-300/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {[40000, 60000, 75000, 100000, 150000].map(income => (
                    <button
                      key={income}
                      type="button"
                      onClick={() => setStep1Data({ ...step1Data, monthly_income: income })}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                        step1Data.monthly_income === income
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      ₹{income >= 100000 ? `${income / 100000}L` : `${income / 1000}K`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Price */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Property Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input
                    type="number"
                    value={step1Data.property_price}
                    onChange={(e) => setStep1Data({
                      ...step1Data,
                      property_price: parseInt(e.target.value) || 0
                    })}
                    min="1000000"
                    step="100000"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-blue-300/50 focus:outline-none transition-colors"
                  />
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
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-blue-300/50 focus:outline-none transition-colors"
                  />
                </div>
                {step1Data.existing_loans_emi > 0 && (
                  <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Reduces eligibility - consider prepaying before applying
                  </p>
                )}
              </div>

              {/* Loan Tenure */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Preferred Loan Tenure
                  </label>
                  <span className="text-lg font-bold text-blue-300">
                    {step1Data.preferred_tenure_years} Years
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={step1Data.preferred_tenure_years}
                  onChange={(e) => setStep1Data({
                    ...step1Data,
                    preferred_tenure_years: parseInt(e.target.value)
                  })}
                  className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>5 years</span>
                  <span>15 years</span>
                  <span>30 years</span>
                </div>
              </div>

              {/* CIBIL Score Range */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  CIBIL Score Range (Approximate)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { range: '750+', label: 'Excellent (750+)', borderClass: 'border-emerald-500', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-300', rate: '8.4%' },
                    { range: '650-749', label: 'Good (650-749)', borderClass: 'border-blue-500', bgClass: 'bg-blue-500/10', textClass: 'text-blue-300', rate: '8.8%' },
                    { range: '550-649', label: 'Fair (550-649)', borderClass: 'border-amber-500', bgClass: 'bg-amber-500/10', textClass: 'text-amber-300', rate: '9.5%' },
                    { range: '300-549', label: 'Poor (<550)', borderClass: 'border-red-500', bgClass: 'bg-red-500/10', textClass: 'text-red-300', rate: '10.5%+' },
                  ].map(score => (
                    <button
                      key={score.range}
                      type="button"
                      onClick={() => setStep1Data({ ...step1Data, cibil_score_range: score.range })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        step1Data.cibil_score_range === score.range
                          ? `${score.borderClass} ${score.bgClass}`
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <p className={`font-medium mb-1 ${
                        step1Data.cibil_score_range === score.range ? score.textClass : 'text-white'
                      }`}>
                        {score.label}
                      </p>
                      <p className="text-xs text-slate-400">Interest: ~{score.rate}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Check My Loan Eligibility
                  </>
                )}
              </button>

              <p className="text-xs text-slate-400 text-center">
                No email required • No impact on credit score
              </p>
            </form>

            {/* Trust Indicators */}
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-300">8.4%</p>
                  <p className="text-xs text-slate-400 mt-1">Best TN rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-300">90%</p>
                  <p className="text-xs text-slate-400 mt-1">Max LTV</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-300">30Yrs</p>
                  <p className="text-xs text-slate-400 mt-1">Max tenure</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Email for Detailed Loan Report */}
        {currentStep === 2 && !showLoanReport && eligibilityResults && (
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
                className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r ${getApprovalColorClass(eligibilityResults.approval_probability)} flex items-center justify-center`}
              >
                <Building2 className="w-14 h-14 text-white" />
              </motion.div>
              <h3 className="text-3xl font-bold text-white mb-2">
                You're Eligible for {formatCurrency(eligibilityResults.eligible_loan_amount)}!
              </h3>
              <p className="text-lg text-slate-300">
                Approval Probability: <span className={`font-bold ${getApprovalTextColorClass(eligibilityResults.approval_probability)}`}>
                  {eligibilityResults.approval_probability}%
                </span>
              </p>
            </div>

            {/* Quick Summary */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-500/10 via-blue-600/10 to-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-1">Monthly EMI</p>
                  <p className="text-3xl font-bold text-blue-300">
                    {formatCurrency(eligibilityResults.eligible_emi)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    @ {eligibilityResults.interest_rate}% interest
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-1">Down Payment Needed</p>
                  <p className="text-3xl font-bold text-emerald-300">
                    {formatCurrency(eligibilityResults.required_down_payment)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {100 - parseFloat(eligibilityResults.ltv_percentage)}% of property price
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended Banks */}
            <div className="mb-8">
              <h4 className="text-lg font-bold text-white mb-3">
                Best Banks for Your Profile in Tamil Nadu
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {eligibilityResults.recommended_banks.slice(0, 4).map((bank: string, index: number) => (
                  <div key={bank} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{bank}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {index === 0 ? 'Best rate: 8.4%' :
                           index === 1 ? 'Quick approval' :
                           index === 2 ? 'High LTV' : 'Local presence'}
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Value Proposition - TN Specific */}
            <div className="mb-8 p-6 bg-slate-700/30 rounded-lg">
              <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-400" />
                Get Your Complete Loan Report (FREE)
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Detailed comparison: SBI vs HDFC vs Indian Bank vs ICICI</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>PMAY subsidy eligibility (save up to ₹2.67L in interest)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Document checklist for quick approval (15-20 days)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Tax benefits breakdown</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Pre-approval assistance (free service)</span>
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
                  placeholder="Karthik Selvam"
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
          </motion.div>
        )}

        {/* STEP 2 RESULTS: Show Loan Report */}
        {currentStep === 2 && showLoanReport && eligibilityResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-blue-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Your Loan Eligibility Report is Ready!
              </h3>
              <p className="text-slate-300">
                Based on your income and credit profile
              </p>
            </div>

            {/* Savings Calculator */}
            <div className="mb-6 p-6 bg-gradient-to-r from-emerald-500/10 via-emerald-600/10 to-emerald-500/10 rounded-lg border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-3">
                <TrendingDown className="w-6 h-6 text-emerald-400" />
                <h4 className="text-lg font-bold text-white">
                  Potential Interest Savings
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">0.5% rate reduction</p>
                  <p className="text-2xl font-bold text-emerald-300">
                    Save {formatCurrency(eligibilityResults.total_interest * 0.15)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">PMAY subsidy</p>
                  <p className="text-2xl font-bold text-blue-300">
                    Save ₹2.67L
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-blue-500/20 via-blue-600/20 to-blue-500/20 rounded-lg border border-blue-300/25">
              <div className="text-center">
                <h4 className="text-xl font-bold text-white mb-4">
                  Need Help with Loan Pre-Approval?
                </h4>
                <p className="text-slate-300 mb-6">
                  Our loan specialists will help you get pre-approved in 15-20 days
                </p>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-lg transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 flex items-center gap-2 mx-auto"
                >
                  Get Pre-Approval Assistance
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Phone + Documents Upload */}
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
                Let's Get Your Loan Pre-Approved
              </h3>
              <p className="text-slate-300">
                Our loan specialists will guide you through the process
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

              {/* Preferred Bank */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Preferred Bank
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {banks.map(bank => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setStep3Data({ ...step3Data, preferred_bank: bank })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        step3Data.preferred_bank === bank
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <p className={`font-medium ${
                        step3Data.preferred_bank === bank ? 'text-blue-300' : 'text-white'
                      }`}>
                        {bank}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Documents Ready */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Documents Status
                </label>
                <div className="space-y-3">
                  {[
                    { value: true, label: 'Documents Ready', description: 'I have all required documents' },
                    { value: false, label: 'Need Help Collecting', description: 'Help me gather required documents' },
                  ].map(option => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setStep3Data({ ...step3Data, documents_ready: option.value })}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        step3Data.documents_ready === option.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                          step3Data.documents_ready === option.value
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-slate-500'
                        }`}>
                          {step3Data.documents_ready === option.value && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium mb-1 ${
                            step3Data.documents_ready === option.value ? 'text-blue-300' : 'text-white'
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

              {/* Urgency */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  When do you need the loan?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'immediate', label: 'Immediately', icon: '⚡' },
                    { value: 'this_month', label: 'This Month', icon: '📅' },
                    { value: 'within_3_months', label: 'Within 3 Months', icon: '🗓️' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStep3Data({ ...step3Data, urgency: option.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        step3Data.urgency === option.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <p className={`text-sm font-medium ${
                        step3Data.urgency === option.value ? 'text-blue-300' : 'text-slate-300'
                      }`}>
                        {option.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Connect with Loan Specialist
              </button>

              <p className="text-xs text-slate-400 text-center">
                Response time: <span className="font-semibold text-blue-300">Under 2 hours</span> • Free consultation
              </p>
            </form>
          </motion.div>
        )}

        {/* STEP 4: Final Profile & Pre-Approval Assistance */}
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
              {/* Pre-approval Help */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  What assistance do you need?
                </label>
                <div className="space-y-3">
                  {[
                    { value: true, label: 'Yes, I need pre-approval help', description: 'Connect me with a loan specialist for free assistance' },
                    { value: false, label: 'No, I\'ll handle it myself', description: 'I have all information, just send me the report' },
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
                  {/* Visit Date */}
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
                <Building2 className="w-5 h-5" />
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
                  Success! Your loan eligibility report has been sent
                </h4>
                <p className="text-slate-300">
                  {step4Data.preapproval_help
                    ? 'A loan specialist will contact you within 2 hours to schedule your consultation.'
                    : 'Check your email for the complete loan eligibility report with bank comparisons and PMAY information.'}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

