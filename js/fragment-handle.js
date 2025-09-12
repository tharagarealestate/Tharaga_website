// --- Salvage handler: if Supabase lands on main site with a hash fragment, route to canonical callback ---
(function(){
  try {
    if (location.origin !== 'https://tharaga.co.in') return;
    if (!location.hash) return;
    const rawHash = location.hash.replace(/^#/, '');
    if (!rawHash) return;
    const hp = new URLSearchParams(rawHash);
    const hasTokens = hp.get('access_token') && hp.get('refresh_token');
    const hasError = hp.get('error') || hp.get('error_code');
    if (!hasTokens && !hasError) return;

    const next = location.pathname + location.search;
    const dest = `${location.origin}/auth/callback.html?next=${encodeURIComponent(next)}${location.hash}`;
    location.replace(dest);
  } catch(_){}
})();