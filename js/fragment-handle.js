// /js/fragment-handle.js
// Fail-safe: when a magic-link lands at the main origin as a #fragment
// this script will pick up the tokens, call supabase.auth.setSession(...)
// and then write the same __tharaga_magic_continue + __tharaga_magic_confirmed
// localStorage keys your auth-gate listens for.

(async function handleFragmentTokensOnParent() {
  try {
    // Prevent double-run
    if (window.__tharaga_fragment_handled) return;
    window.__tharaga_fragment_handled = true;

    const rawHash = (location.hash || '').replace(/^#/, '');
    if (!rawHash) return;
    const params = new URLSearchParams(rawHash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return;

    console.debug && console.debug('fragment-handle: tokens found — attempting setSession');

    // Prefer an existing global supabase client (if present on the page)
    let supa = window.supabase || null;

    if (!supa) {
      // dynamic import (safe) if no global client present yet
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

      const SUPABASE_URL = 'https://wedevtjjmdvngyshqdro.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M';
      supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      // do NOT override window.supabase to avoid clobbering other scripts
    }

    // Try to set the session
    const { data, error } = await supa.auth.setSession({ access_token, refresh_token });
    if (error) {
      console.error('fragment-handle: setSession failed', error);
      return;
    }

    // derive pending next from post_auth_target OR query param
    let pendingNext = null;
    try {
      pendingNext = JSON.parse(localStorage.getItem('post_auth_target') || 'null')?.href
                    || new URLSearchParams(location.search).get('next')
                    || null;
    } catch (_) {
      pendingNext = new URLSearchParams(location.search).get('next') || null;
    }

    const payload = {
      ts: Date.now(),
      next: pendingNext,
      user: data?.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null
    };

    try {
      // Write same keys your auth-gate expects
      localStorage.setItem('__tharaga_magic_continue', JSON.stringify(payload));
      localStorage.setItem('__tharaga_magic_confirmed', JSON.stringify({ ts: Date.now() }));
      console.debug && console.debug('fragment-handle: wrote __tharaga_magic_continue', payload);
    } catch (e) {
      console.warn('fragment-handle: could not write magic continue/confirmed', e);
    }

    // Remove tokens from URL so they're not visible/accidentally reused
    try {
      const cleaned = location.pathname + location.search;
      history.replaceState(null, '', cleaned);
    } catch (e) { /* ignore */ }

  } catch (err) {
    console.warn('fragment-handle: unexpected error', err);
  }
})();
