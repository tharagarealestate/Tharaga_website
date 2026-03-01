"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Shield, Lock, Phone, Mail, Calendar } from 'lucide-react';
import { useBehavioralTracking } from '@/hooks/useBehavioralTracking';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message?: string;
  preferred_contact: 'phone' | 'email' | 'whatsapp';
  timeline?: string;
}

export function AdvancedContactForm({ 
  propertyId, 
  brochureUrl 
}: { 
  propertyId: string; 
  brochureUrl?: string;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
    preferred_contact: 'whatsapp',
    timeline: '',
  });

  const { sessionId, trackContactClick } = useBehavioralTracking();

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      return;
    }

    setCurrentStep(2);
    trackContactClick(propertyId, 'contact_builder_click');
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        property_id: propertyId,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || '',
        message: formData.message || `Interested in property ${propertyId}`,
        preferred_contact: formData.preferred_contact,
        timeline: formData.timeline,
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const j = await res.json();

      if (j?.ok || res.ok) {
        setSubmitted(true);
        trackContactClick(propertyId, 'schedule_visit_click');
        
        // Track behavioral signal
        if (j?.id) {
          await fetch('/api/automation/behavioral-tracking/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              buyer_id: j.id,
              session_id: sessionId,
              event_type: 'contact_builder_click',
              event_metadata: {
                preferred_contact: formData.preferred_contact,
                timeline: formData.timeline,
              },
              property_id: propertyId,
            }),
          });
        }
      } else {
        alert(j?.error || 'Failed to submit. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25 text-center"
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 flex items-center justify-center">
          <Check className="w-10 h-10 text-slate-900" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Thank you! We've received your inquiry
        </h3>
        <p className="text-slate-300 mb-6">
          Our team will contact you shortly via {formData.preferred_contact === 'whatsapp' ? 'WhatsApp' : formData.preferred_contact === 'phone' ? 'phone' : 'email'}.
        </p>
        {brochureUrl && (
          <a
            href={brochureUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block px-6 py-3 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 transition-all"
          >
            Download Brochure
          </a>
        )}
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Get Instant Information
            </h3>
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="submit"
                  className="py-3 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule Visit
                </button>
                <button
                  type="submit"
                  className="py-3 rounded-lg bg-slate-700/50 text-white font-medium hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Get Callback
                </button>
              </div>
              {brochureUrl && (
                <a
                  href={brochureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center py-3 rounded-lg border border-slate-600/50 text-slate-300 hover:border-amber-300/50 hover:text-amber-300 transition-all"
                >
                  Download Brochure
                </a>
              )}
            </form>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Almost there! Help us serve you better
            </h3>
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Preferred Contact Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['whatsapp', 'phone', 'email'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormData({ ...formData, preferred_contact: method })}
                      className={`py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        formData.preferred_contact === method
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {method === 'whatsapp' && <Phone className="w-4 h-4" />}
                      {method === 'phone' && <Phone className="w-4 h-4" />}
                      {method === 'email' && <Mail className="w-4 h-4" />}
                      <span className="capitalize text-xs">{method}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  When are you planning to buy?
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
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
              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Message (Optional)
                </label>
                <textarea
                  name="message"
                  placeholder="Any specific questions or requirements?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50 focus:outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 font-bold text-lg rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : (
                  <>
                    Submit Inquiry
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3" />
                <span>Private</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

