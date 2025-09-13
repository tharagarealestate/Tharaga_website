(function(){
  try {
    if (window.supabase && window.supabase.auth) return;
  } catch(_) {}
  try {
    import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then((mod) => {
      try {
        if (window.supabase && window.supabase.auth) return;
      } catch(_) {}
      const SUPABASE_URL = 'https://wedevtjjmdvngyshqdro.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M';
      const client = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      try { window.supabase = client; } catch(_) {}
    }).catch(()=>{});
  } catch(_) {}
})();

