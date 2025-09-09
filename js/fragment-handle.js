// --- Salvage handler: run immediately on main site to recover Supabase hash redirects ---
(function(){
  try {
    // Only run on the main site, not on the auth subdomain
    if (location.origin !== 'https://tharaga.co.in') return;

    const rawHash = (location.hash || '').replace(/^#/, '');
    if (!rawHash) return;

    const qp = new URLSearchParams(rawHash);
    const accessToken = qp.get('access_token');
    const refreshToken = qp.get('refresh_token');
    const hasError = qp.get('error') || qp.get('error_code');

    // If Supabase dropped tokens on the main site, move this tab to the auth domain
    if (accessToken && refreshToken) {
      const backNext = location.pathname + location.search;
      const state = new URLSearchParams(location.search).get('state') || (function(){ try { return JSON.parse(localStorage.getItem('__tharaga_auth_state')||'null')?.state||null; } catch(_) { return null; } })();
      const authUrl =
        `https://auth.tharaga.co.in/login_signup_glassdrop/?post_auth=1` +
        `&parent_origin=${encodeURIComponent(location.origin)}` +
        `&next=${encodeURIComponent(backNext)}` +
        (state ? `&state=${encodeURIComponent(state)}` : '') +
        `#${rawHash}`;

      // Replace so back button doesn't land on the broken hash page
      location.replace(`https://auth.tharaga.co.in/login_signup_glassdrop/?post_auth=1&parent_origin=...&next=...&state=...#${rawHash}`) 
    }

    // If we landed with an error hash (e.g., otp_expired), clear hash and open the login modal
    if (hasError) {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
      const openGate = () => window.authGate?.openLoginModal?.({ next: location.pathname + location.search });
      if (window.authGate?.openLoginModal) {
        openGate();
      } else {
        // If auth-gate loads later, open once available
        window.addEventListener('load', () => {
          try { openGate(); } catch (_) {}
        }, { once: true });
      }
    }
  } catch (_) {}
})();

// /js/fragment-handle.js  (REPLACE file with this)
(async function handleFragmentTokensOnParent() {
  try {
    const rawHash = (location.hash || '').replace(/^#/, '');
    if (!rawHash) return;
    const params = new URLSearchParams(rawHash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return;

    console.debug && console.debug('fragment-handle: tokens found in fragment — setting session');

    // dynamic import of supabase client
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const SUPABASE_URL = 'https://wedevtjjmdvngyshqdro.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) {
      console.error('fragment-handle:setSession failed:', error);
      return;
    }

    try {
      const payload = {
        ts: Date.now(),
        next: null, // will be overwritten below
        user: data?.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null
      };

      if (window.opener && typeof window.opener.postMessage === 'function') {
        window.opener.postMessage({
          type: 'tharaga_token_transfer',
          access_token,
          refresh_token,
          next: null, // will be overwritten below
          user: payload.user
        }, '*'); // tighten origin in prod
      }
    } catch (e) {
      console.warn('fragment-handle: could not postMessage to opener', e);
    }

    // try to derive pendingNext (best-effort)
    let pendingNext = null;
    try {
      pendingNext = JSON.parse(localStorage.getItem('post_auth_target') || 'null')?.href
                    || new URLSearchParams(location.search).get('next') || null;
    } catch (_) {
      pendingNext = new URLSearchParams(location.search).get('next') || null;
    }

    const user = data?.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null;
    const payload = { ts: Date.now(), next: pendingNext, user };

    // IMPORTANT: write BOTH keys so listeners that watch either will see it
    try {
      localStorage.setItem('__tharaga_magic_continue', JSON.stringify(payload));
      localStorage.setItem('__tharaga_magic_confirmed', JSON.stringify(payload));
      localStorage.setItem('__tharaga_magic_confirmed_timestamp', String(Date.now()));
    } catch (e) {
      console.warn('Could not write magic confirmed/continue keys', e);
    }

    // Notify same-origin opener/parent (if the opener is on same origin, this helps)
    try {
      if (window.opener && window.opener !== window) {
        window.opener.postMessage({ type: 'signed_in', payload }, '*'); // in prod replace '*' with exact origin
      }
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'signed_in', payload }, '*'); // likewise restrict to exact origin
      }
    } catch (e) {
      console.warn('fragment-handle: postMessage to opener/parent failed', e);
    }

    // Cross-origin handoff (optional but useful):
    // If there was no opener (e.g. friend clicked), try opening your auth host and POST tokens to it.
    // NOTE: this requires your auth page (login_signup_glassdrop) to implement a message handler that accepts {type:'tharaga_token_transfer', access_token, refresh_token, next}
    if (!window.opener && (!window.parent || window.parent === window)) {
      try {
        const targetOrigin = 'https://auth.tharaga.co.in'; // <= RESTRICT to exact origin
        const relayUrl = targetOrigin + '/?from=fragment_relay'; // any path on auth domain that loads the message handler
        const relayWin = window.open(relayUrl, '_blank', 'noopener,noreferrer');

        if (relayWin) {
          const msg = { type: 'tharaga_token_transfer', access_token, refresh_token, next: pendingNext, user };
          let attempts = 0;
          const t = setInterval(() => {
            attempts++;
            try { relayWin.postMessage(msg, targetOrigin); } catch (e) {}
            if (attempts > 12) clearInterval(t);
          }, 300);
        }
      } catch (e) {
        console.warn('fragment-handle: cross-origin relay failed', e);
      }
    }

    // clean the URL fragment (remove tokens)
    try {
      const cleaned = location.pathname + location.search;
      history.replaceState(null, '', cleaned);
    } catch (_) {}

  } catch (err) {
    console.warn('fragment-handle error', err);
  }
})();