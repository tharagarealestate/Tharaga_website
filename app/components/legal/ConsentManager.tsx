'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { UserConsent } from '@/types/legal';

export function ConsentManager() {
  const supabase = getSupabase();
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', user.id)
        .order('consent_timestamp', { ascending: false });

      if (error) throw error;
      setConsents(data || []);
    } catch (error) {
      console.error('Failed to load consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConsent = async (consentType: UserConsent['consent_type'], given: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_consents')
        .upsert({
          user_id: user.id,
          consent_type: consentType,
          consent_given: given,
          consent_timestamp: new Date().toISOString(),
          withdrawn_at: given ? null : new Date().toISOString(),
          ip_address: await fetch('https://api.ipify.org?format=json')
            .then(r => r.json())
            .then(d => d.ip)
            .catch(() => null),
          user_agent: navigator.userAgent
        }, {
          onConflict: 'user_id,consent_type'
        });

      if (error) throw error;
      await loadConsents();
    } catch (error) {
      console.error('Failed to update consent:', error);
      alert('Failed to update consent. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <div className="animate-pulse text-white">Loading consent preferences...</div>
      </div>
    );
  }

  const consentTypes: { type: UserConsent['consent_type']; label: string; description: string }[] = [
    {
      type: 'privacy_policy',
      label: 'Privacy Policy',
      description: 'I agree to the Privacy Policy'
    },
    {
      type: 'terms_of_service',
      label: 'Terms of Service',
      description: 'I agree to the Terms of Service'
    },
    {
      type: 'marketing',
      label: 'Marketing Communications',
      description: 'I consent to receive marketing emails and updates'
    },
    {
      type: 'data_processing',
      label: 'Data Processing',
      description: 'I consent to data processing for service improvement'
    }
  ];

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Your Consent Preferences</h3>
      <p className="text-gray-300 text-sm mb-6">
        Manage your consent preferences for data processing and communications.
      </p>

      <div className="space-y-4">
        {consentTypes.map(({ type, label, description }) => {
          const consent = consents.find(c => c.consent_type === type);
          const isGiven = consent?.consent_given ?? false;

          return (
            <div
              key={type}
              className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">{label}</h4>
                <p className="text-sm text-gray-400">{description}</p>
                {consent && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last updated: {new Date(consent.consent_timestamp).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateConsent(type, !isGiven)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isGiven
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-slate-500/20 text-slate-300 border border-slate-500/30 hover:bg-slate-500/30'
                  }`}
                >
                  {isGiven ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Granted
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Not Granted
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200">
            <p className="font-semibold mb-1">Note:</p>
            <p>
              You can withdraw your consent at any time. However, some consents are required for
              core functionality and cannot be withdrawn without affecting service availability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}























































































