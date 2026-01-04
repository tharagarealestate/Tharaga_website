"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, TrendingUp, Home, Download, Mail, Phone, Calendar, FileCheck, ArrowRight } from 'lucide-react';
import { useBehavioralTracking } from '@/hooks/useBehavioralTracking';

interface ValuationStep1Data {
  property_type: 'apartment' | 'villa' | 'plot' | 'penthouse';
  bhk_config: string;
  total_area_sqft: number;
  locality: string;
  city: string;
  property_age_years: number;
  furnishing: 'unfurnished' | 'semi_furnished' | 'fully_furnished';
}

interface ValuationStep2Data {
  name: string;
  email: string;
}

interface ValuationStep3Data {
  phone: string;
  ownership_type: 'self' | 'joint' | 'inherited';
  verification_needed: boolean;
}

interface ValuationStep4Data {
  inspection_date: string;
  inspection_time: 'morning' | 'afternoon' | 'evening';
  inspection_type: 'virtual' | 'physical';
}

export function PropertyValuation() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showValuationReport, setShowValuationReport] = useState(false);
  const [valuationResults, setValuationResults] = useState<any>(null);

  const [step1Data, setStep1Data] = useState<ValuationStep1Data>({
    property_type: 'apartment',
    bhk_config: '2BHK',
    total_area_sqft: 1200,
    locality: 'OMR',
    city: 'Chennai',
    property_age_years: 5,
    furnishing: 'semi_furnished',
  });

  const [step2Data, setStep2Data] = useState<ValuationStep2Data>({
    name: '',
    email: '',
  });

  const [step3Data, setStep3Data] = useState<ValuationStep3Data>({
    phone: '',
    ownership_type: 'self',
    verification_needed: false,
  });

  const [step4Data, setStep4Data] = useState<ValuationStep4Data>({
    inspection_date: '',
    inspection_time: 'afternoon',
    inspection_type: 'virtual',
  });

  const { sessionId, trackEvent } = useBehavioralTracking();

  const cities = ['Chennai', 'Coimbatore', 'Madurai'];
  const localitiesByCity: Record<string, string[]> = {
    Chennai: ['OMR', 'ECR', 'Perungudi', 'Velachery', 'Porur', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Jayanagar'],
    Coimbatore: ['Saravanampatti', 'Peelamedu', 'RS Puram', 'Gandhipuram'],
    Madurai: ['K Pudur', 'SS Colony', 'Anna Nagar', 'Thirunagar'],
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
      const calcResponse = await fetch('/api/lead-capture/property-valuation/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step1Data),
      });

      const calcData = await calcResponse.json();
      if (!calcData.success) {
        throw new Error('Failed to estimate property value');
      }

      setValuationResults(calcData.results);

      const response = await fetch('/api/automation/lead-capture/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: 'property_valuation',
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
          event_metadata: { tool: 'property_valuation', step: 1 },
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
          form_type: 'property_valuation',
          step_1_data: step1Data,
          step_2_data: step2Data,
          calculation_results: valuationResults,
          current_step: 2,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setLeadId(data.lead_id);
        setShowValuationReport(true);
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'property_valuation', step: 2 },
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
          form_type: 'property_valuation',
          step_1_data: step1Data,
          step_2_data: step2Data,
          step_3_data: step3Data,
          calculation_results: valuationResults,
          current_step: 3,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentStep(4);
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'property_valuation', step: 3 },
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
          form_type: 'property_valuation',
          step_1_data: step1Data,
          step_2_data: step2Data,
          step_3_data: step3Data,
          step_4_data: step4Data,
          calculation_results: valuationResults,
          current_step: 4,
          completed: true,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'property_valuation', step: 4, completed: true },
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
        {/* STEP 1: Property Details Input (No Email) */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-purple-300/25"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-purple-600/20">
                <TrendingUp className="w-8 h-8 text-purple-300" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Property Valuation Tool
                </h3>
                <p className="text-slate-400 mt-1">
                  AI-powered property price estimation based on market data
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
                      onClick={() => setStep1Data({ ...step1Data, city, locality: localitiesByCity[city]?.[0] || '' })}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        step1Data.city === city
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Property Type
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: 'apartment', label: 'Apartment', icon: '🏢' },
                    { value: 'villa', label: 'Villa', icon: '🏡' },
                    { value: 'plot', label: 'Plot', icon: '📐' },
                    { value: 'penthouse', label: 'Penthouse', icon: '🏗️' },
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setStep1Data({ ...step1Data, property_type: type.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        step1Data.property_type === type.value
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <p className={`text-sm font-medium ${
                        step1Data.property_type === type.value ? 'text-purple-300' : 'text-slate-300'
                      }`}>
                        {type.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* BHK Configuration */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  BHK Configuration
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {['1BHK', '2BHK', '3BHK', '4BHK+'].map(bhk => (
                    <button
                      key={bhk}
                      type="button"
                      onClick={() => setStep1Data({ ...step1Data, bhk_config: bhk })}
                      className={`py-3 rounded-lg font-medium transition-all ${
                        step1Data.bhk_config === bhk
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {bhk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Locality */}
              {localitiesByCity[step1Data.city] && (
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-3 block">
                    Locality
                  </label>
                  <select
                    value={step1Data.locality}
                    onChange={(e) => setStep1Data({ ...step1Data, locality: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-purple-300/50 focus:outline-none transition-colors"
                  >
                    {localitiesByCity[step1Data.city].map(locality => (
                      <option key={locality} value={locality}>{locality}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Total Area */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Total Area (sq.ft)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={step1Data.total_area_sqft}
                    onChange={(e) => setStep1Data({
                      ...step1Data,
                      total_area_sqft: parseInt(e.target.value) || 0
                    })}
                    min="300"
                    max="10000"
                    step="50"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-purple-300/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Property Age */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">
                    Property Age
                  </label>
                  <span className="text-lg font-bold text-purple-300">
                    {step1Data.property_age_years} {step1Data.property_age_years === 0 ? 'Years (New)' : step1Data.property_age_years === 1 ? 'Year' : 'Years'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={step1Data.property_age_years}
                  onChange={(e) => setStep1Data({
                    ...step1Data,
                    property_age_years: parseInt(e.target.value)
                  })}
                  className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>New</span>
                  <span>15 years</span>
                  <span>30 years</span>
                </div>
              </div>

              {/* Furnishing */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Furnishing Status
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'unfurnished', label: 'Unfurnished' },
                    { value: 'semi_furnished', label: 'Semi-Furnished' },
                    { value: 'fully_furnished', label: 'Fully Furnished' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStep1Data({ ...step1Data, furnishing: option.value as any })}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        step1Data.furnishing === option.value
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing Market Data...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Get AI Valuation
                  </>
                )}
              </button>

              <p className="text-xs text-slate-400 text-center">
                No email required • Free instant estimate
              </p>
            </form>

            {/* Trust Indicators */}
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-300">10K+</p>
                  <p className="text-xs text-slate-400 mt-1">Sales Analyzed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-300">95%</p>
                  <p className="text-xs text-slate-400 mt-1">Accuracy Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-300">Real-time</p>
                  <p className="text-xs text-slate-400 mt-1">Market Data</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Email for Valuation Report */}
        {currentStep === 2 && !showValuationReport && valuationResults && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-purple-300/25"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center"
              >
                <TrendingUp className="w-12 h-12 text-white" />
              </motion.div>
              <h3 className="text-3xl font-bold text-white mb-2">
                Estimated Value: {formatCurrency(valuationResults.estimated_value)}
              </h3>
              <p className="text-lg text-slate-300">
                Confidence Level: {valuationResults.confidence_level}%
              </p>
              <p className="text-sm text-slate-400 mt-2">
                Price Range: {formatCurrency(valuationResults.price_range.low)} - {formatCurrency(valuationResults.price_range.high)}
              </p>
            </div>

            {/* Value Proposition */}
            <div className="mb-8 p-6 bg-slate-700/30 rounded-lg">
              <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-purple-400" />
                Get Your Complete Valuation Report (FREE)
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Detailed market analysis with comparable properties</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>RERA verification status and guideline value comparison</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Market trend analysis (last 6 months, year-over-year)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Price adjustments breakdown (depreciation, furnishing, metro proximity)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Downloadable PDF report for documentation</span>
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
                  placeholder="Suresh Kumar"
                  value={step2Data.name}
                  onChange={(e) => setStep2Data({ ...step2Data, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-purple-300/50 focus:outline-none transition-colors"
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
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-purple-300/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Get My Valuation Report
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 2 RESULTS: Show Valuation Report */}
        {currentStep === 2 && showValuationReport && valuationResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-purple-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Your Property Valuation Report is Ready!
              </h3>
              <p className="text-slate-300">
                Based on recent market data and comparable sales
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Estimated Value</p>
                <p className="text-2xl font-bold text-purple-300">
                  {formatCurrency(valuationResults.estimated_value)}
                </p>
              </div>
              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Price per sq.ft</p>
                <p className="text-2xl font-bold text-blue-300">
                  ₹{valuationResults.price_per_sqft.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-purple-500/20 via-purple-600/20 to-purple-500/20 rounded-lg border border-purple-300/25">
              <div className="text-center">
                <h4 className="text-xl font-bold text-white mb-4">
                  Need Professional Property Inspection?
                </h4>
                <p className="text-slate-300 mb-6">
                  Our certified valuers can provide detailed inspection and RERA verification
                </p>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-lg transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 flex items-center gap-2 mx-auto"
                >
                  Schedule Property Inspection
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Phone + Ownership Type */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-purple-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Property Ownership Details
              </h3>
              <p className="text-slate-300">
                This helps us prepare the valuation documentation
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
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-purple-300/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Ownership Type */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Ownership Type
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'self', label: 'Self-Owned', description: 'I am the owner' },
                    { value: 'joint', label: 'Joint Ownership', description: 'Multiple owners' },
                    { value: 'inherited', label: 'Inherited Property', description: 'Received through inheritance' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStep3Data({ ...step3Data, ownership_type: option.value as any })}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        step3Data.ownership_type === option.value
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                          step3Data.ownership_type === option.value
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-slate-500'
                        }`}>
                          {step3Data.ownership_type === option.value && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium mb-1 ${
                            step3Data.ownership_type === option.value ? 'text-purple-300' : 'text-white'
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

              {/* Verification Needed */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Do you need RERA verification?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: true, label: 'Yes, I need verification', description: 'For sale/loan documentation' },
                    { value: false, label: 'No, just valuation', description: 'Only need price estimate' },
                  ].map(option => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setStep3Data({ ...step3Data, verification_needed: option.value })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        step3Data.verification_needed === option.value
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <p className={`font-medium mb-1 ${
                        step3Data.verification_needed === option.value ? 'text-purple-300' : 'text-white'
                      }`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-slate-400">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FileCheck className="w-5 h-5" />
                Continue to Schedule Inspection
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 4: Property Inspection Scheduling */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-purple-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Schedule Property Inspection
              </h3>
              <p className="text-slate-300">
                Our certified valuers will provide detailed inspection
              </p>
            </div>

            <form onSubmit={handleStep4Submit} className="space-y-6">
              {/* Inspection Type */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Inspection Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'virtual', label: 'Virtual Inspection', description: 'Video call walkthrough' },
                    { value: 'physical', label: 'Physical Inspection', description: 'On-site visit by valuer' },
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setStep4Data({ ...step4Data, inspection_type: type.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        step4Data.inspection_type === type.value
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <p className={`font-medium mb-1 ${
                        step4Data.inspection_type === type.value ? 'text-purple-300' : 'text-white'
                      }`}>
                        {type.label}
                      </p>
                      <p className="text-xs text-slate-400">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspection Date */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Preferred Inspection Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    value={step4Data.inspection_date}
                    onChange={(e) => setStep4Data({ ...step4Data, inspection_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-purple-300/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Inspection Time */}
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
                      onClick={() => setStep4Data({ ...step4Data, inspection_time: slot.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        step4Data.inspection_time === slot.value
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">{slot.icon}</div>
                      <p className={`font-medium ${
                        step4Data.inspection_time === slot.value ? 'text-purple-300' : 'text-white'
                      }`}>
                        {slot.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{slot.time}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Confirm Inspection Schedule
              </button>

              <p className="text-xs text-slate-400 text-center">
                Instant confirmation via WhatsApp • Professional valuation service
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
                  Success! Your property inspection is scheduled
                </h4>
                <p className="text-slate-300">
                  Our certified valuer will contact you within 2 hours to confirm the inspection. Check your email and WhatsApp for details.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



