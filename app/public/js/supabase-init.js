;(function(){
  // Resilient Supabase bootstrap with diagnostics and CDN fallback
  const CONFIG = {
    url: 'https://wedevtjjmdvngyshqdro.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M'
  };

  function diag(msg, extra){ try { console.debug('[thg-auth:init]', msg, extra||''); } catch(_) {} }

  try { if (window.supabase && window.supabase.auth) { diag('existing client found'); return; } } catch(_) {}

  const cdnCandidates = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm',
    'https://unpkg.com/@supabase/supabase-js@2?module'
  ];

  async function loadAndInit(){
    for (let i=0;i<cdnCandidates.length;i++){
      const src = cdnCandidates[i];
      try {
        diag('loading library', src);
        const mod = await import(/* @vite-ignore */ src);
        try { if (window.supabase && window.supabase.auth) { diag('client already present after load'); return window.supabase; } } catch(_) {}
        const client = mod.createClient(CONFIG.url, CONFIG.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
        try { window.supabase = client; } catch(_) {}
        diag('client initialized', { url: CONFIG.url, hasAuth: !!client?.auth });
        try {
          const { data: sub } = client.auth.onAuthStateChange((ev, session) => {
            diag('auth event', { ev, hasSession: !!session, user: session?.user?.email||null });
          });
          try { window.__thgInitSub = sub?.subscription || sub || null; } catch(_) {}
        } catch(_) {}
        return client;
      } catch (e) {
        diag('load/init failed', { src, error: String(e&&e.message||e) });
      }
    }
    diag('all cdn candidates failed');
    return null;
  }

  loadAndInit();
})();

