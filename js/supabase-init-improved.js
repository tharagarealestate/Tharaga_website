// js/supabase-init-improved.js
// Improved Supabase initialization using config file
// This version loads credentials from config.js instead of hardcoding them
//
// To use: Replace the content of supabase-init.js with this file
// or rename this file to supabase-init.js

import { SUPABASE_CONFIG } from './config.js';

;(function(){
  // Resilient Supabase bootstrap with diagnostics and CDN fallback
  const CONFIG = {
    url: SUPABASE_CONFIG.url,
    key: SUPABASE_CONFIG.anonKey
  };

  function diag(msg, extra){
    try {
      console.debug('[thg-auth:init]', msg, extra||'');
    } catch(_) {}
  }

  // Check if Supabase client already exists
  try {
    if (window.supabase && window.supabase.auth) {
      diag('existing client found');
      return;
    }
  } catch(_) {}

  // CDN sources for Supabase library
  const cdnCandidates = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm',
    'https://unpkg.com/@supabase/supabase-js@2?module'
  ];

  async function loadAndInit(){
    for (let i=0; i<cdnCandidates.length; i++){
      const src = cdnCandidates[i];
      try {
        diag('loading library', src);
        const mod = await import(/* @vite-ignore */ src);

        // Check if client was already initialized
        try {
          if (window.supabase && window.supabase.auth) {
            diag('client already present after load');
            return window.supabase;
          }
        } catch(_) {}

        // Create Supabase client
        const client = mod.createClient(CONFIG.url, CONFIG.key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });

        // Attach to window for global access
        try {
          window.supabase = client;
        } catch(_) {}

        diag('client initialized', {
          url: CONFIG.url,
          hasAuth: !!client?.auth
        });

        // Set up auth state change listener
        try {
          const { data: sub } = client.auth.onAuthStateChange((ev, session) => {
            diag('auth event', {
              ev,
              hasSession: !!session,
              user: session?.user?.email||null
            });

            // Emit custom event for app to listen to
            try {
              window.dispatchEvent(new CustomEvent('supabase-auth-change', {
                detail: { event: ev, session }
              }));
            } catch(_) {}
          });

          try {
            window.__thgInitSub = sub?.subscription || sub || null;
          } catch(_) {}
        } catch(_) {}

        return client;

      } catch (e) {
        diag('load/init failed', {
          src,
          error: String(e&&e.message||e)
        });
      }
    }

    diag('all cdn candidates failed');
    return null;
  }

  loadAndInit();
})();
