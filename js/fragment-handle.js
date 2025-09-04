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
    const SUPABASE_ANON_KEY = 'REPLACE_WITH_YOUR_ANON_KEY'; // keep same anon key as other pages
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) {
      console.error('fragment-handle:setSession failed:', error);
      return;
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
