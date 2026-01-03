'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Settings, X, Check } from 'lucide-react';
import { CookiePreferences } from '@/types/legal';
import { getSupabase } from '@/lib/supabase';

export function CookieConsentBanner() {
  const supabase = getSupabase();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('tharaga_cookie_consent');
    if (!consent) {
      // Show banner after 2 seconds
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
      } catch (e) {
        // Invalid saved data, show banner
        setTimeout(() => setShowBanner(true), 2000);
      }
    }
  }, []);

  const handleAcceptAll = async () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    
    await saveConsent(allAccepted);
    setShowBanner(false);
  };

  const handleRejectAll = async () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    
    await saveConsent(essentialOnly);
    setShowBanner(false);
  };

  const handleSavePreferences = async () => {
    await saveConsent(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const saveConsent = async (prefs: CookiePreferences) => {
    // Save to localStorage
    localStorage.setItem('tharaga_cookie_consent', JSON.stringify(prefs));
    localStorage.setItem('tharaga_cookie_consent_date', new Date().toISOString());

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('cookie_consents').insert({
        session_id: sessionId,
        user_id: user?.id || null,
        essential_cookies: prefs.essential,
        analytics_cookies: prefs.analytics,
        marketing_cookies: prefs.marketing,
        preference_cookies: prefs.preferences,
        ip_address: await fetch('https://api.ipify.org?format=json')
          .then(r => r.json())
          .then(d => d.ip)
          .catch(() => null),
        user_agent: navigator.userAgent
      });

      // Initialize analytics if accepted
      if (prefs.analytics && typeof window !== 'undefined') {
        // Initialize Google Analytics
        if ((window as any).gtag) {
          (window as any).gtag('consent', 'update', {
            'analytics_storage': 'granted'
          });
        }
      }

      // Initialize marketing if accepted
      if (prefs.marketing && typeof window !== 'undefined') {
        // Initialize Facebook Pixel, etc.
        if ((window as any).gtag) {
          (window as any).gtag('consent', 'update', {
            'ad_storage': 'granted'
          });
        }
      }
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
    }
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-7xl mx-auto">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
              {!showSettings ? (
                // Simple Banner
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-[#D4AF37]/10 rounded-xl">
                      <Cookie className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        We Value Your Privacy
                      </h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                        Essential cookies are required for core functionality. By clicking "Accept All", you consent 
                        to our use of cookies. Visit our{' '}
                        <a href="/privacy" className="text-[#D4AF37] hover:underline font-medium">
                          Privacy Policy
                        </a>{' '}
                        to learn more.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setShowSettings(true)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Customize
                    </button>
                    <button
                      onClick={handleRejectAll}
                      className="px-6 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-white font-medium rounded-lg transition-colors border border-slate-500/30"
                    >
                      Reject All
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white font-medium rounded-lg hover:shadow-lg transition-all"
                    >
                      Accept All
                    </button>
                  </div>
                </div>
              ) : (
                // Settings Panel
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Cookie Preferences</h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Essential */}
                    <div className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">Essential Cookies</h4>
                          <span className="px-2 py-0.5 bg-slate-500/20 text-xs font-medium rounded text-gray-300">Required</span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Necessary for authentication, security, and core functionality. Cannot be disabled.
                        </p>
                      </div>
                      <div className="ml-4">
                        <div className="w-12 h-6 bg-[#D4AF37] rounded-full flex items-center justify-end px-1">
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Analytics */}
                    <div className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">Analytics Cookies</h4>
                        <p className="text-sm text-gray-400">
                          Help us understand how you use Tharaga to improve your experience. Uses Google Analytics with anonymized IPs.
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            preferences.analytics ? 'bg-[#D4AF37]' : 'bg-slate-500/30'
                          } flex items-center ${preferences.analytics ? 'justify-end' : 'justify-start'} px-1`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </button>
                      </div>
                    </div>

                    {/* Marketing */}
                    <div className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">Marketing Cookies</h4>
                        <p className="text-sm text-gray-400">
                          Track your activity for personalized ads on Google, Facebook, and LinkedIn. Help us show you relevant property listings.
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            preferences.marketing ? 'bg-[#D4AF37]' : 'bg-slate-500/30'
                          } flex items-center ${preferences.marketing ? 'justify-end' : 'justify-start'} px-1`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </button>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">Preference Cookies</h4>
                        <p className="text-sm text-gray-400">
                          Remember your settings like language, theme, and filter preferences for a personalized experience.
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => setPreferences(p => ({ ...p, preferences: !p.preferences }))}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            preferences.preferences ? 'bg-[#D4AF37]' : 'bg-slate-500/30'
                          } flex items-center ${preferences.preferences ? 'justify-end' : 'justify-start'} px-1`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSavePreferences}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white font-medium rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



























































