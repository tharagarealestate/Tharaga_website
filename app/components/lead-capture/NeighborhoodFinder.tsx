"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MapPin, School, Hospital, Shield, Download, Mail, Phone, Calendar, Home, ArrowRight } from 'lucide-react';
import { useBehavioralTracking } from '@/hooks/useBehavioralTracking';

interface NeighborhoodStep1Data {
  primary_priorities: string[];
  family_type: 'young_couple' | 'family_with_kids' | 'retired' | 'single';
  preferred_localities: string[];
  city: string;
}

interface NeighborhoodStep2Data {
  name: string;
  email: string;
}

interface NeighborhoodStep3Data {
  phone: string;
  kids_age?: string;
  work_location?: string;
  elderly_family?: boolean;
  temple_important?: boolean;
}

interface NeighborhoodStep4Data {
  visit_date: string;
  visit_time: 'morning' | 'afternoon' | 'evening';
  tour_type: 'virtual' | 'physical';
}

export function NeighborhoodFinder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNeighborhoodReport, setShowNeighborhoodReport] = useState(false);
  const [neighborhoodResults, setNeighborhoodResults] = useState<any>(null);

  const [step1Data, setStep1Data] = useState<NeighborhoodStep1Data>({
    primary_priorities: [],
    family_type: 'family_with_kids',
    preferred_localities: [],
    city: 'Chennai',
  });

  const [step2Data, setStep2Data] = useState<NeighborhoodStep2Data>({
    name: '',
    email: '',
  });

  const [step3Data, setStep3Data] = useState<NeighborhoodStep3Data>({
    phone: '',
    temple_important: false,
  });

  const [step4Data, setStep4Data] = useState<NeighborhoodStep4Data>({
    visit_date: '',
    visit_time: 'afternoon',
    tour_type: 'virtual',
  });

  const { sessionId, trackEvent } = useBehavioralTracking();

  const cities = ['Chennai', 'Coimbatore', 'Madurai'];
  const priorities = [
    { id: 'schools', label: 'Top Schools', icon: School, borderClass: 'border-blue-500', bgClass: 'bg-blue-500/10', textClass: 'text-blue-300' },
    { id: 'hospitals', label: 'Healthcare', icon: Hospital, borderClass: 'border-red-500', bgClass: 'bg-red-500/10', textClass: 'text-red-300' },
    { id: 'safety', label: 'Safety & Security', icon: Shield, borderClass: 'border-emerald-500', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-300' },
    { id: 'parks', label: 'Parks & Recreation', icon: MapPin, borderClass: 'border-green-500', bgClass: 'bg-green-500/10', textClass: 'text-green-300' },
    { id: 'shopping', label: 'Shopping & Dining', icon: MapPin, borderClass: 'border-purple-500', bgClass: 'bg-purple-500/10', textClass: 'text-purple-300' },
    { id: 'transport', label: 'Public Transport', icon: MapPin, borderClass: 'border-amber-500', bgClass: 'bg-amber-500/10', textClass: 'text-amber-300' },
  ];

  const localitiesByCity: Record<string, string[]> = {
    Chennai: ['OMR', 'ECR', 'Perungudi', 'Velachery', 'Porur', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Jayanagar'],
    Coimbatore: ['Saravanampatti', 'Peelamedu', 'RS Puram', 'Gandhipuram'],
    Madurai: ['K Pudur', 'SS Colony', 'Anna Nagar', 'Thirunagar'],
  };

  const togglePriority = (priorityId: string) => {
    setStep1Data(prev => ({
      ...prev,
      primary_priorities: prev.primary_priorities.includes(priorityId)
        ? prev.primary_priorities.filter(p => p !== priorityId)
        : prev.primary_priorities.length < 3
        ? [...prev.primary_priorities, priorityId]
        : prev.primary_priorities,
    }));
  };

  const toggleLocality = (locality: string) => {
    setStep1Data(prev => ({
      ...prev,
      preferred_localities: prev.preferred_localities.includes(locality)
        ? prev.preferred_localities.filter(l => l !== locality)
        : [...prev.preferred_localities, locality],
    }));
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step1Data.primary_priorities.length === 0) return;

    setLoading(true);

    try {
      const calcResponse = await fetch('/api/lead-capture/neighborhood-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step1Data),
      });

      const calcData = await calcResponse.json();
      if (!calcData.success) {
        throw new Error('Failed to analyze neighborhoods');
      }

      setNeighborhoodResults(calcData.results);

      const response = await fetch('/api/automation/lead-capture/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: 'neighborhood_finder',
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
          event_metadata: { tool: 'neighborhood_finder', step: 1 },
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
          form_type: 'neighborhood_finder',
          step_1_data: step1Data,
          step_2_data: step2Data,
          calculation_results: neighborhoodResults,
          current_step: 2,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setLeadId(data.lead_id);
        setShowNeighborhoodReport(true);
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'neighborhood_finder', step: 2 },
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
          form_type: 'neighborhood_finder',
          step_1_data: step1Data,
          step_2_data: step2Data,
          step_3_data: {
            ...step3Data,
            cultural_preferences: {
              temple_important: step3Data.temple_important,
            },
          },
          calculation_results: neighborhoodResults,
          current_step: 3,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentStep(4);
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'neighborhood_finder', step: 3 },
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
          form_type: 'neighborhood_finder',
          step_1_data: step1Data,
          step_2_data: step2Data,
          step_3_data: step3Data,
          step_4_data: step4Data,
          calculation_results: neighborhoodResults,
          current_step: 4,
          completed: true,
          session_id: sessionId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        trackEvent({
          event_type: 'calculator_use',
          event_metadata: { tool: 'neighborhood_finder', step: 4, completed: true },
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
        {/* STEP 1: Family Type & Priorities (No Email) */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-emerald-300/25"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-600/20">
                <MapPin className="w-8 h-8 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Neighborhood Finder
                </h3>
                <p className="text-slate-400 mt-1">
                  Discover the perfect area for your family in Tamil Nadu
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
                  Family Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'young_couple', label: 'Young Couple', emoji: '👫' },
                    { value: 'family_with_kids', label: 'Family with Kids', emoji: '👨‍👩‍👧‍👦' },
                    { value: 'retired', label: 'Retired/Senior', emoji: '👴' },
                    { value: 'single', label: 'Single Professional', emoji: '🧑‍💼' },
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
                      <p className={`text-sm font-medium ${
                        step1Data.family_type === type.value ? 'text-emerald-300' : 'text-slate-300'
                      }`}>
                        {type.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priorities */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  What matters most to you? (Select up to 3)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {priorities.map(priority => {
                    const Icon = priority.icon;
                    const isSelected = step1Data.primary_priorities.includes(priority.id);
                    return (
                      <button
                        key={priority.id}
                        type="button"
                        onClick={() => togglePriority(priority.id)}
                        disabled={!isSelected && step1Data.primary_priorities.length >= 3}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? `${priority.borderClass} ${priority.bgClass}`
                            : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${
                          isSelected ? priority.textClass : 'text-slate-400'
                        }`} />
                        <p className={`text-sm font-medium ${
                          isSelected ? priority.textClass : 'text-slate-300'
                        }`}>
                          {priority.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Selected: {step1Data.primary_priorities.length}/3
                </p>
              </div>

              {/* Preferred Localities */}
              {localitiesByCity[step1Data.city] && (
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-3 block">
                    Preferred Localities (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {localitiesByCity[step1Data.city].map(locality => (
                      <button
                        key={locality}
                        type="button"
                        onClick={() => toggleLocality(locality)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          step1Data.preferred_localities.includes(locality)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {locality}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || step1Data.primary_priorities.length === 0}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                Find My Perfect Neighborhood
              </button>

              <p className="text-xs text-slate-400 text-center">
                No email required • Instant neighborhood scores
              </p>
            </form>
          </motion.div>
        )}

        {/* STEP 2: Email for Neighborhood Report */}
        {currentStep === 2 && !showNeighborhoodReport && neighborhoodResults && (
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
                We Found Perfect Neighborhoods!
              </h3>
              <p className="text-lg text-slate-300">
                {neighborhoodResults.top_neighborhoods?.length || 0} neighborhoods match your priorities
              </p>
            </div>

            {/* Top Neighborhoods Preview */}
            {neighborhoodResults.top_neighborhoods && neighborhoodResults.top_neighborhoods.length > 0 && (
              <div className="mb-8 space-y-3">
                {neighborhoodResults.top_neighborhoods.slice(0, 2).map((neighborhood: any, index: number) => (
                  <div key={index} className="p-4 bg-slate-700/30 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-white">{neighborhood.name}</h4>
                      <span className="text-emerald-300 font-bold">
                        {neighborhood.match_score.toFixed(1)}/10
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">
                      {neighborhood.price_range}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {neighborhood.highlights?.slice(0, 2).map((highlight: string, idx: number) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded">
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Value Proposition */}
            <div className="mb-8 p-6 bg-slate-700/30 rounded-lg">
              <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                Get Your Complete Neighborhood Report (FREE)
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Detailed analysis of top 5 neighborhoods with ratings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>School ratings (CBSE, Matriculation, International)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Hospital proximity (Apollo, MIOT, Fortis, Government hospitals)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Safety ratings and crime statistics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Temple proximity and cultural amenities</span>
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
                  placeholder="Lakshmi Narayanan"
                  value={step2Data.name}
                  onChange={(e) => setStep2Data({ ...step2Data, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-emerald-300/50 focus:outline-none transition-colors"
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
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-emerald-300/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Get My Neighborhood Report
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 2 RESULTS: Show Neighborhood Report */}
        {currentStep === 2 && showNeighborhoodReport && neighborhoodResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-emerald-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Your Neighborhood Analysis is Ready!
              </h3>
              <p className="text-slate-300">
                Top neighborhoods matching your family's needs
              </p>
            </div>

            <div className="p-6 bg-gradient-to-r from-emerald-500/20 via-emerald-600/20 to-emerald-500/20 rounded-lg border border-emerald-300/25">
              <div className="text-center">
                <h4 className="text-xl font-bold text-white mb-4">
                  Want to Schedule a Neighborhood Tour?
                </h4>
                <p className="text-slate-300 mb-6">
                  Our specialists will guide you through the best neighborhoods for your family
                </p>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 flex items-center gap-2 mx-auto"
                >
                  Schedule Neighborhood Tour
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Phone + Family Profile */}
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
                Tell Us More About Your Family
              </h3>
              <p className="text-slate-300">
                This helps us recommend the perfect neighborhoods
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
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-emerald-300/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Kids Age (if family with kids) */}
              {step1Data.family_type === 'family_with_kids' && (
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-3 block">
                    Children's Age Group
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'pre_school', label: 'Pre-School', icon: '👶' },
                      { value: 'primary', label: 'Primary', icon: '👧' },
                      { value: 'high_school', label: 'High School', icon: '👦' },
                    ].map(age => (
                      <button
                        key={age.value}
                        type="button"
                        onClick={() => setStep3Data({ ...step3Data, kids_age: age.value })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          step3Data.kids_age === age.value
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                        }`}
                      >
                        <div className="text-3xl mb-2">{age.icon}</div>
                        <p className={`text-sm font-medium ${
                          step3Data.kids_age === age.value ? 'text-emerald-300' : 'text-slate-300'
                        }`}>
                          {age.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Temple Important */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Is Temple Proximity Important?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: true, label: 'Yes, Very Important', icon: '🛕' },
                    { value: false, label: 'Not Essential', icon: '🏠' },
                  ].map(option => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setStep3Data({ ...step3Data, temple_important: option.value })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        step3Data.temple_important === option.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-3xl mb-2">{option.icon}</div>
                      <p className={`text-sm font-medium ${
                        step3Data.temple_important === option.value ? 'text-emerald-300' : 'text-slate-300'
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
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Continue to Schedule Tour
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 4: Neighborhood Tour Scheduling */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-emerald-300/25"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Schedule Your Neighborhood Tour
              </h3>
              <p className="text-slate-300">
                Our specialists will guide you through the best areas
              </p>
            </div>

            <form onSubmit={handleStep4Submit} className="space-y-6">
              {/* Tour Type */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Tour Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'virtual', label: 'Virtual Tour', description: 'Video call walkthrough' },
                    { value: 'physical', label: 'Physical Tour', description: 'On-site visit' },
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setStep4Data({ ...step4Data, tour_type: type.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        step4Data.tour_type === type.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <p className={`font-medium mb-1 ${
                        step4Data.tour_type === type.value ? 'text-emerald-300' : 'text-white'
                      }`}>
                        {type.label}
                      </p>
                      <p className="text-xs text-slate-400">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visit Date */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Preferred Tour Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    value={step4Data.visit_date}
                    onChange={(e) => setStep4Data({ ...step4Data, visit_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-emerald-300/50 focus:outline-none transition-colors"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-lg rounded-lg transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Confirm Neighborhood Tour
              </button>

              <p className="text-xs text-slate-400 text-center">
                Instant confirmation via WhatsApp • Free neighborhood consultation
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
                  Success! Your neighborhood tour is scheduled
                </h4>
                <p className="text-slate-300">
                  Our specialist will contact you within 2 hours to confirm the tour. Check your email and WhatsApp for details.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

