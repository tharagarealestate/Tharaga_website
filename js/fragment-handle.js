// /js/fragment-handle.js
// Fail-safe: if the magic-link redirects to the main origin with #access_token,
// set the Supabase session here and write __tharaga_magic_continue so other tabs receive it.

(async function handleFragmentTokensOnParent() {
  try {
    const rawHash = (location.hash || '').replace(/^#/, '');
    if (!rawHash) return;
    const params = new URLSearchParams(rawHash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return;

    console.debug && console.debug('fragment-handle: detected #access_token on parent origin — attempting setSession');

    // Dynamically import the supabase client to avoid colliding with any global client
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

    const SUPABASE_URL = 'https://wedevtjjmdvngyshqdro.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M';

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) {
      console.error('fragment-handle: setSession failed on parent origin', error);
      return;
    }

    // Derive a pending 'next' target (if an auth-gate wrote it earlier)
    let pendingNext = null;
    try {
      pendingNext = JSON.parse(localStorage.getItem('post_auth_target') || 'null')?.href
                    || new URLSearchParams(location.search).get('next') || null;
    } catch (_) {
      pendingNext = new URLSearchParams(location.search).get('next') || null;
    }

    const payload = {
      ts: Date.now(),
      next: pendingNext,
      user: data?.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null
    };

    try {
      localStorage.setItem('__tharaga_magic_continue', JSON.stringify(payload));
      // keep confirmed flag as well (backwards compat)
      localStorage.setItem('__tharaga_magic_confirmed', JSON.stringify({ ts: Date.now() }));
      console.debug && console.debug('fragment-handle: wrote __tharaga_magic_continue', payload);
    } catch (e) {
      console.warn('fragment-handle: could not write localStorage key', e);
    }

    // Clean the URL (remove tokens)
    try {
      const cleaned = location.pathname + location.search;
      history.replaceState(null, '', cleaned);
    } catch (e) { /* ignore */ }

  } catch (e) {
    console.warn('fragment-handle: unexpected error', e);
  }
})();
