// /js/fragment-handle.js
// Fail-safe: if a magic-link lands at https://tharaga.co.in/#access_token=...
// set the session on this origin and write __tharaga_magic_continue so other tabs receive it.
(async function handleFragmentTokensOnParent() {
  try {
    const rawHash = (location.hash || '').replace(/^#/, '');
    if (!rawHash) return;
    const params = new URLSearchParams(rawHash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return;

    console.debug && console.debug('fragment-handle: tokens found in fragment — setting session');

    // dynamic import to avoid double client conflicts
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const SUPABASE_URL = 'https://wedevtjjmdvngyshqdro.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M'; // use your anon key
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) {
      console.error('fragment-handle:setSession failed:', error);
    } else {
      // derive next (try post_auth_target first)
      let pendingNext = null;
      try {
        pendingNext = JSON.parse(localStorage.getItem('post_auth_target') || 'null')?.href || new URLSearchParams(location.search).get('next') || null;
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
        localStorage.setItem('__tharaga_magic_confirmed', JSON.stringify({ ts: Date.now() }));
      } catch (e) { console.warn('fragment-handle: could not write magic continue', e); }

      // clean the URL (remove fragment tokens)
      try {
        const cleaned = location.pathname + location.search;
        history.replaceState(null, '', cleaned);
      } catch (_) {}
    }
  } catch (err) {
    console.warn('fragment-handle error', err);
  }
})();
