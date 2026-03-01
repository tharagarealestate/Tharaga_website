'use client';

/**
 * THARAGA Builder Onboarding Wizard
 *
 * 5-step wizard that gets a builder to their first listing in 5 minutes.
 * This is the critical conversion path: signup → first value.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Shield, Home, Users, Sparkles, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Your Business', icon: Building2, description: 'Tell us about your company' },
  { id: 2, title: 'RERA Verification', icon: Shield, description: 'Verify your RERA registration' },
  { id: 3, title: 'First Property', icon: Home, description: 'Add your first listing' },
  { id: 4, title: 'Preview', icon: Users, description: 'See how buyers will find you' },
  { id: 5, title: 'Go Live', icon: Sparkles, description: 'Choose your plan and launch' },
];

interface FormData {
  // Step 1
  companyName: string;
  contactName: string;
  phone: string;
  gstin: string;
  // Step 2
  reraNumber: string;
  reraVerified: boolean;
  // Step 3
  propertyTitle: string;
  propertyType: string;
  location: string;
  price: string;
  bedrooms: string;
  areaSqft: string;
  description: string;
}

export default function OnboardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    contactName: '',
    phone: '',
    gstin: '',
    reraNumber: '',
    reraVerified: false,
    propertyTitle: '',
    propertyType: 'apartment',
    location: '',
    price: '',
    bedrooms: '2',
    areaSqft: '',
    description: '',
  });

  const router = useRouter();
  const supabase = createClientComponentClient();

  const updateField = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const verifyRERA = useCallback(async () => {
    if (!formData.reraNumber) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/rera/verify/${formData.reraNumber}`);
      if (response.ok) {
        updateField('reraVerified', true);
        toast.success('RERA number verified successfully!');
      } else {
        toast.error('Could not verify RERA number. You can continue and verify later.');
      }
    } catch {
      toast.info('Verification service unavailable. You can verify later.');
    }
    setLoading(false);
  }, [formData.reraNumber, updateField]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Create builder profile
      await supabase.from('builder_profiles').upsert({
        user_id: user.id,
        company_name: formData.companyName,
        contact_name: formData.contactName,
        phone: formData.phone,
        gstin: formData.gstin,
        rera_number: formData.reraNumber,
        rera_verified: formData.reraVerified,
        onboarding_complete: true,
      });

      // Create first property
      if (formData.propertyTitle) {
        await supabase.from('properties').insert({
          builder_id: user.id,
          title: formData.propertyTitle,
          property_type: formData.propertyType,
          location: formData.location,
          price: parseFloat(formData.price) || 0,
          bedrooms: parseInt(formData.bedrooms) || 2,
          area_sqft: parseFloat(formData.areaSqft) || 0,
          description: formData.description,
          status: 'active',
        });
      }

      toast.success('Welcome to Tharaga! Your profile is live.');
      router.push('/builder');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      console.error(error);
    }
    setLoading(false);
  }, [formData, supabase, router]);

  const inputClass = 'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-all';
  const labelClass = 'block text-sm font-medium text-slate-300 mb-2';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep > step.id
                      ? 'bg-emerald-500 text-white'
                      : currentStep === step.id
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-white/10 text-slate-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs mt-1 hidden md:block ${
                  currentStep >= step.id ? 'text-white' : 'text-slate-500'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Business Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Tell us about your business</h2>
                    <p className="text-slate-400 mt-1">This helps buyers trust your listings</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Company Name *</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="e.g., ABC Builders Pvt Ltd"
                        value={formData.companyName}
                        onChange={(e) => updateField('companyName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Your Name *</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="Contact person name"
                        value={formData.contactName}
                        onChange={(e) => updateField('contactName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Phone Number *</label>
                      <input
                        type="tel"
                        className={inputClass}
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>GSTIN (Optional)</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="22AAAAA0000A1Z5"
                        value={formData.gstin}
                        onChange={(e) => updateField('gstin', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: RERA Verification */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">RERA Verification</h2>
                    <p className="text-slate-400 mt-1">Verified builders get 3x more leads</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>RERA Registration Number</label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          className={`${inputClass} flex-1`}
                          placeholder="TN/01/Building/0123/2024"
                          value={formData.reraNumber}
                          onChange={(e) => updateField('reraNumber', e.target.value)}
                        />
                        <button
                          onClick={verifyRERA}
                          disabled={loading || !formData.reraNumber}
                          className="px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-900 font-medium rounded-lg transition-all flex items-center gap-2"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                          Verify
                        </button>
                      </div>
                    </div>
                    {formData.reraVerified && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-lg"
                      >
                        <Check className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">RERA number verified successfully!</span>
                      </motion.div>
                    )}
                    <p className="text-sm text-slate-500">
                      Don&apos;t have a RERA number? You can skip this step and add it later.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: First Property */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Add your first property</h2>
                    <p className="text-slate-400 mt-1">Start receiving leads within minutes</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Property Title *</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="e.g., Luxury 3BHK in OMR"
                        value={formData.propertyTitle}
                        onChange={(e) => updateField('propertyTitle', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Type</label>
                        <select
                          className={inputClass}
                          value={formData.propertyType}
                          onChange={(e) => updateField('propertyType', e.target.value)}
                        >
                          <option value="apartment">Apartment</option>
                          <option value="villa">Villa</option>
                          <option value="plot">Plot</option>
                          <option value="commercial">Commercial</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Bedrooms</label>
                        <select
                          className={inputClass}
                          value={formData.bedrooms}
                          onChange={(e) => updateField('bedrooms', e.target.value)}
                        >
                          {['1', '2', '3', '4', '5+'].map((b) => (
                            <option key={b} value={b}>{b} BHK</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Location *</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="e.g., OMR, Sholinganallur, Chennai"
                        value={formData.location}
                        onChange={(e) => updateField('location', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Price (₹)</label>
                        <input
                          type="number"
                          className={inputClass}
                          placeholder="e.g., 7500000"
                          value={formData.price}
                          onChange={(e) => updateField('price', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Area (sq.ft)</label>
                        <input
                          type="number"
                          className={inputClass}
                          placeholder="e.g., 1200"
                          value={formData.areaSqft}
                          onChange={(e) => updateField('areaSqft', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Preview */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Here&apos;s how it looks</h2>
                    <p className="text-slate-400 mt-1">This is what buyers will see</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                      <Home className="w-12 h-12 text-slate-500" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        {formData.reraVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-400/10 text-emerald-400 text-xs rounded-full">
                            <Shield className="w-3 h-3" /> RERA Verified
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{formData.companyName}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        {formData.propertyTitle || 'Your Property Title'}
                      </h3>
                      <p className="text-amber-400 font-bold text-xl mt-2">
                        ₹{formData.price ? (parseInt(formData.price) / 100000).toFixed(1) + 'L' : '—'}
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-sm text-slate-400">
                        <span>{formData.bedrooms} BHK</span>
                        <span>{formData.areaSqft || '—'} sqft</span>
                        <span>{formData.location || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-400/5 border border-amber-400/10 rounded-lg p-4">
                    <p className="text-sm text-amber-400">
                      💡 <strong>Pro tip:</strong> Add property photos after setup to get 5x more inquiries.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 5: Go Live */}
              {currentStep === 5 && (
                <div className="space-y-6 text-center">
                  <div>
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">You&apos;re all set!</h2>
                    <p className="text-slate-400 mt-1">Start receiving leads from verified buyers</p>
                  </div>
                  <div className="space-y-3 text-left">
                    {[
                      '✅ Business profile created',
                      formData.reraVerified ? '✅ RERA verified' : '⏳ RERA verification pending',
                      formData.propertyTitle ? '✅ First property listed' : '⏳ Add property later',
                      '🎁 14-day Growth trial activated',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <span className="text-sm text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep((s) => Math.min(5, s + 1))}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-all"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold rounded-lg transition-all shadow-lg shadow-amber-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Launch My Dashboard
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
