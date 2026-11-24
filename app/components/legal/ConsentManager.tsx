'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { UserConsent } from '@/types/legal';

export function ConsentManager() {
  const supabase = (() => {
    try {
      return getSupabase();
    } catch {
      return null;
    }
  })();
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    if (!supabase) {
      setSignedIn(false);
      setLoading(false);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSignedIn(false);
        setLoading(false);
        return;
      }
      setSignedIn(true);

      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', user.id)
        .order('consent_timestamp', { ascending: false });

      if (error) throw error;
      setConsents(data || []);
    } catch (error) {
      console.error('Failed to load consents:', error);
      setSignedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const updateConsent = async (consentType: UserConsent['consent_type'], given: boolean) => {
    if (!supabase) return;
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
          user_agent: navigator.userAgent
        }, {
          onConflict: 'user_id,consent_type'
        });

      if (error) throw error;
      await loadConsents();
    } catch (error) {
      console.error('Failed to update consent:', error);
      setMessage('We could not save that change. Please try again in a moment.');
    }
  };

  if (!loading && !signedIn) {
    return (
      <div className="bg-[#FBF8F2] border border-[#D6CAB5] p-6 sm:p-8">
        <h3 className="font-display text-xl tracking-[0.04em] text-[#15213A]">Your consent choices</h3>
        <p className="mt-4 font-serif text-[1.1rem] leading-relaxed text-[#2E3648]">
          Consent records are stored against your account. Sign in to view or withdraw them. Your cookie choices on this
          device can be changed at any time.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem('tharaga_cookie_consent');
              } catch {}
              window.location.reload();
            }}
            className="h-12 px-7 bg-[#15213A] font-sans text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[#F7F3EC] transition-colors duration-200 hover:bg-[#94643A]"
          >
            Change cookie choices
          </button>
          <a
            href="/?signin=1"
            className="inline-flex h-12 items-center justify-center px-7 border-[1.5px] border-[#15213A] font-sans text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[#15213A] transition-colors duration-200 hover:bg-[#15213A] hover:text-[#F7F3EC]"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#FBF8F2] border border-[#D6CAB5] p-6 sm:p-8">
        <div className="animate-pulse text-[#4A5163]">Loading consent preferences...</div>
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
    <div className="bg-[#FBF8F2] border border-[#D6CAB5] p-6 sm:p-8">
      <h3 className="font-display text-xl tracking-[0.04em] text-[#15213A] mb-4">Your Consent Preferences</h3>
      <p className="font-serif text-[1.1rem] text-[#2E3648] mb-6">
        Manage your consent preferences for data processing and communications.
      </p>

      <div className="space-y-4">
        {consentTypes.map(({ type, label, description }) => {
          const consent = consents.find(c => c.consent_type === type);
          const isGiven = consent?.consent_given ?? false;

          return (
            <div
              key={type}
              className="flex items-start justify-between gap-6 p-5 border border-[#D6CAB5] bg-[#F7F3EC]"
            >
              <div className="flex-1">
                <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#15213A] mb-1">{label}</h4>
                <p className="font-serif text-[1.02rem] text-[#4A5163]">{description}</p>
                {consent && (
                  <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-[#7D8292] mt-2">
                    Last updated: {new Date(consent.consent_timestamp).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateConsent(type, !isGiven)}
                  className={`h-11 shrink-0 px-5 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors duration-200 ${
                    isGiven
                      ? 'bg-[#15213A] text-[#F7F3EC] border border-[#15213A] hover:bg-[#94643A] hover:border-[#94643A]'
                      : 'bg-transparent text-[#15213A] border-[1.5px] border-[#15213A] hover:bg-[#15213A] hover:text-[#F7F3EC]'
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

      {message && (
        <p role="alert" className="mt-4 font-serif text-[1.02rem] text-[#9B2C2C]">{message}</p>
      )}
      <div className="mt-6 p-4 border-l-2 border-[#B0834A] bg-[#EFE8DC]">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#94643A] flex-shrink-0 mt-0.5" />
          <div className="font-serif text-[1.02rem] text-[#2E3648]">
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


























































































