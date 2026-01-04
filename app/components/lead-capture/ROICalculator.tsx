"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Calculator, TrendingUp, Download, Mail, Phone, Calendar, Home, ArrowRight, Shield, Lock } from 'lucide-react';
import { useBehavioralTracking } from '@/hooks/useBehavioralTracking';

interface ROIStep1Data {
  property_price: number;
  down_payment_percentage: number;
  expected_rental_income: number;
}

interface ROIStep2Data {
  name: string;
  email: string;
}

interface ROIStep3Data {
  phone: string;
  timeline: string;
  investment_purpose: 'rental_income' | 'capital_appreciation' | 'both';
}

interface ROIStep4Data {
  visit_date: string;
  visit_time: 'morning' | 'afternoon' | 'evening';
  family_members: number;
  financing_status: 'need_loan' | 'have_preapproval' | 'cash_buyer';
}

interface ROIResults {
  property_price: number;
  down_payment_amount: number;
  loan_amount: number;
  monthly_emi: number;
  rental_yield_percentage: number;
  annual_rental_income: number;
  years_5?: any;
  years_10?: any;
  years_15?: any;
}

export function ROICalculator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFullResults, setShowFullResults] = useState(false);
  const [roiResults, setRoiResults] = useState<ROIResults | null>(null);
  const [fullRoiResults, setFullRoiResults] = useState<any>(null);

  const [step1Data, setStep1Data] = useState<ROIStep1Data>({
    property_price: 15000000,
    down_payment_percentage: 20,
    expected_rental_income: 35000,
  });

  const [step2Data, setStep2Data] = useState<ROIStep2Data>({
    name: '',
    email: '',
  });

  const [step3Data, setStep3Data] = useState<ROIStep3Data>({
    phone: '',
    timeline: '6_months',
    investment_purpose: 'both',
  });

  const [step4Data, setStep4Data] = useState<ROIStep4Data>({
    visit_date: '',
    visit_time: 'afternoon',
    family_members: 2,
    financing_status: 'need_loan',
  });

  const { sessionId, trackEvent } = useBehavioralTracking();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate initial ROI
      const calcResponse = await fetch('/api/lead-capture/calculate-roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_price: step1Data.property_price,
          down_payment_percentage: step1Data.down_payment_percentage,
          expected_rental_income: step1Data.expected_rental_income,
          calculate_years: [5, 10, 15],
        }),
      });

      const calcData = await calcResponse.json();
      if (!calcData.success) {
        throw new Error('Failed to calculate ROI');
      }

      const initialResults = {
        property_price: step1Data.property_price,
        down_payment_amount: calcData.results.down_payment_amount,
        loan_amount: calcData.results.loan_amount,
        monthly_emi: calcData.results.monthly_emi,
        rental_yield_percentage: calcData.results.rental_yield_percentage,
        annual_rental_income: calcData.results.annual_rental_income,
      };

      setRoiResults(initialResults);
      setFullRoiResults(calcData.results);

      // Submit to database
      const response = await fetch('/api/automation/lead-capture/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: 'roi_calculator',
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
          event_metadata: { tool: 'roi_calculator', step: 1 },
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
          form_type: 'roi_calculator',
          step_1_data: step1Data,
          step_2_data: step2Data,
          calculation_results: fullRoiResults,
          current_step: 2,
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLeadId(data.lead_id);
        setShowFullResults(true);
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'roi_calculator', step: 2 },
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
          form_type: 'roi_calculator',
          step_1_data: step1Data,
          step_2_data: step2Data,
          step_3_data: step3Data,
          calculation_results: fullRoiResults,
          current_step: 3,
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStep(4);
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'roi_calculator', step: 3 },
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
          form_type: 'roi_calculator',
          step_1_data: step1Data,
          step_2_data: step2Data,
          step_3_data: step3Data,
          step_4_data: step4Data,
          calculation_results: fullRoiResults,
          current_step: 4,
          completed: true,
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'roi_calculator', step: 4, completed: true },
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
        {/* STEP 1: Micro-Commitment (No Email Required) */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 flex-shrink-0">
                <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-amber-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Property Investment ROI Calculator
                </h3>
                <p className="text-sm sm:text-base text-slate-400 mt-1">
                  Calculate rental yield, appreciation, and total returns in seconds
                </p>
              </div>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-4 sm:space-y-6">
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
                    onChange={(e) => setStep1Data({ ...step1Data, property_price: parseInt(e.target.value) || 0 })}
                    min="1000000"
                    max="1000000000"
                    step="100000"
                    required
                    className="w-full pl-10 pr-4 py-3 text-base rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {[5000000, 10000000, 15000000, 25000000, 50000000].map(price => (
                    <button
                      key={price}
                      type="button"
                      onClick={() => setStep1Data({ ...step1Data, property_price: price })}
                      className={`px-3 py-2 min-h-[36px] rounded text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                        step1Data.property_price === price
                          ? 'bg-amber-500 text-slate-900'
                          : 'bg-slate-700/50 text-slate-300 active:bg-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {price >= 10000000 ? `₹${price / 10000000}Cr` : `₹${price / 100000}L`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Down Payment */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Down Payment
                  </label>
                  <span className="text-base sm:text-lg font-bold text-amber-300">
                    {step1Data.down_payment_percentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={step1Data.down_payment_percentage}
                  onChange={(e) => setStep1Data({ ...step1Data, down_payment_percentage: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Down Payment: <span className="font-semibold text-white">
                    {formatCurrency(step1Data.property_price * step1Data.down_payment_percentage / 100)}
                  </span>
                </p>
              </div>

              {/* Expected Rental Income */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Expected Monthly Rent
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input
                    type="number"
                    value={step1Data.expected_rental_income}
                    onChange={(e) => setStep1Data({ ...step1Data, expected_rental_income: parseInt(e.target.value) || 0 })}
                    min="5000"
                    max="1000000"
                    step="1000"
                    required
                    className="w-full pl-10 pr-4 py-3 text-base rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 min-h-[52px] bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:from-amber-400 active:to-amber-300 text-slate-900 font-bold text-base sm:text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Calculate My ROI
                  </>
                )}
              </button>

              <p className="text-xs text-slate-400 text-center">
                No email required • Get instant results
              </p>
            </form>

            {/* Trust Indicators */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-700/50">
              <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-amber-300">8.2%</p>
                  <p className="text-xs text-slate-400 mt-1">Avg. Rental Yield</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-300">12%</p>
                  <p className="text-xs text-slate-400 mt-1">Annual Appreciation</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-blue-300">15K+</p>
                  <p className="text-xs text-slate-400 mt-1">Calculations Done</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Value Exchange (Email for Full Report) */}
        {currentStep === 2 && !showFullResults && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25"
          >
            <div className="text-center mb-6 sm:mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </motion.div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Excellent Investment Potential!
              </h3>
              <p className="text-base sm:text-lg text-slate-300">
                Your property could generate strong returns
              </p>
            </div>

            {/* Teaser Results */}
            {roiResults && (
              <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-400 mb-1">Rental Yield</p>
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-300">
                      {roiResults.rental_yield_percentage.toFixed(2)}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatCurrency(roiResults.annual_rental_income)}/year
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-400 mb-1">Loan Amount</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-300">
                      {formatCurrency(roiResults.loan_amount)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      at ~8.5% interest
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Value Proposition */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-slate-700/30 rounded-lg">
              <h4 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Download className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
                Get Your Complete ROI Report (FREE)
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>5, 10, and 15-year appreciation forecasts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Tax benefit calculations (Section 80C, 24B)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>EMI breakdown and cash flow analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Comparative market analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Downloadable PDF report</span>
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
                  placeholder="Rajesh Kumar"
                  value={step2Data.name}
                  onChange={(e) => setStep2Data({ ...step2Data, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 text-base rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none transition-colors"
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
                    className="w-full pl-12 pr-4 py-3 text-base rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 min-h-[52px] bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:from-amber-400 active:to-amber-300 text-slate-900 font-bold text-base sm:text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
              >
                <Download className="w-5 h-5" />
                Get My Free ROI Report
              </button>
            </form>

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                </div>
                <span>No spam, ever</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-blue-400" />
                </div>
                <span>Instant delivery</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2 RESULTS: Show Full ROI Results */}
        {currentStep === 2 && showFullResults && fullRoiResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Your ROI Analysis is Ready!
              </h3>
              <p className="text-slate-300">
                Based on market trends and historical data
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {fullRoiResults.years_10 && (
                <>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">10-Year Total ROI</p>
                    <p className="text-2xl font-bold text-emerald-300">
                      {fullRoiResults.years_10.total_roi_percentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Net Profit (10 years)</p>
                    <p className="text-2xl font-bold text-blue-300">
                      {formatCurrency(fullRoiResults.years_10.net_profit)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* CTA to Step 3 */}
            <div className="p-6 bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20 rounded-lg border border-amber-300/25">
              <div className="text-center">
                <h4 className="text-xl font-bold text-white mb-2">
                  Want Properties Matching These Returns?
                </h4>
                <p className="text-slate-300 mb-4">
                  Our investment specialists have curated portfolios with similar or better ROI
                </p>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-bold rounded-lg transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 flex items-center gap-2 mx-auto"
                >
                  Connect with Investment Specialist
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Qualification (Phone + Investment Timeline) */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Let's Connect You with the Right Properties
              </h3>
              <p className="text-slate-300">
                Our investment specialists will share curated opportunities matching your ROI goals
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
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  We'll send property recommendations via WhatsApp
                </p>
              </div>

              {/* Investment Timeline */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  When are you looking to invest?
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
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <p className={`text-sm font-medium ${
                        step3Data.timeline === option.value ? 'text-amber-300' : 'text-slate-300'
                      }`}>
                        {option.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Investment Purpose */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Primary Investment Goal
                </label>
                <div className="space-y-3">
                  {[
                    {
                      value: 'rental_income',
                      label: 'Steady Rental Income',
                      description: 'Focus on high-yield properties (8%+ rental yield)'
                    },
                    {
                      value: 'capital_appreciation',
                      label: 'Long-term Appreciation',
                      description: 'Focus on emerging areas with growth potential'
                    },
                    {
                      value: 'both',
                      label: 'Balanced (Income + Growth)',
                      description: 'Best of both worlds'
                    },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStep3Data({ ...step3Data, investment_purpose: option.value as any })}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        step3Data.investment_purpose === option.value
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                          step3Data.investment_purpose === option.value
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-slate-500'
                        }`}>
                          {step3Data.investment_purpose === option.value && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium mb-1 ${
                            step3Data.investment_purpose === option.value ? 'text-amber-300' : 'text-white'
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
                className="w-full py-4 px-6 min-h-[52px] bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:from-amber-400 active:to-amber-300 text-slate-900 font-bold text-base sm:text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
              >
                <Calendar className="w-5 h-5" />
                Connect Me with Investment Specialist
              </button>

              <p className="text-xs text-slate-400 text-center">
                Response time: <span className="font-semibold text-amber-300">Under 2 hours</span> • No spam calls
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
            className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25"
          >
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Schedule Your Property Visit
              </h3>
              <p className="text-sm sm:text-base text-slate-300">
                Our property consultant will guide you through matching properties
              </p>
            </div>

            <form onSubmit={handleStep4Submit} className="space-y-4 sm:space-y-6">
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
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none transition-colors"
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
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">{slot.icon}</div>
                      <p className={`font-medium ${
                        step4Data.visit_time === slot.value ? 'text-amber-300' : 'text-white'
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
                  <span className="text-2xl font-bold text-amber-300">
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
                  className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Financing Status */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Loan Status
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'need_loan', label: 'Need Home Loan', description: 'We\'ll help with loan pre-approval' },
                    { value: 'have_preapproval', label: 'Have Pre-Approval', description: 'Already got loan sanctioned' },
                    { value: 'cash_buyer', label: 'Cash Buyer', description: 'No loan needed' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStep4Data({ ...step4Data, financing_status: option.value as any })}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        step4Data.financing_status === option.value
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                          step4Data.financing_status === option.value
                            ? 'border-amber-500 bg-amber-500'
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
                            step4Data.financing_status === option.value ? 'text-amber-300' : 'text-white'
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
                className="w-full py-4 px-6 min-h-[52px] bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:from-amber-400 active:to-amber-300 text-slate-900 font-bold text-base sm:text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
              >
                <Calendar className="w-5 h-5" />
                Confirm Visit Schedule
              </button>

              <p className="text-xs text-slate-400 text-center">
                Instant confirmation via WhatsApp • Free property consultation
              </p>
            </form>

            {/* Success Message after submission */}
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

