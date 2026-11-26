// Handle Supabase auth params after email confirmation or OAuth redirects
;(function(){
  'use strict';

  // If the URL hash accidentally contains a full URL (e.g., "#https://…"),
  // or is a stray "#" left by redirects, strip it to keep URLs clean.
  try {
    var rawHash = (location.hash || '').trim();
    // Clean up cases like "#https://..." and the malformed "#https:/..."
    if (/^#https?:\/+/.test(rawHash)) {
      var cleaned = location.href.replace(location.hash, '');
      history.replaceState(null, '', cleaned);
      return; // Nothing else to do
    }
    // Also clean lone "#" or "#/" fragments that sometimes remain after auth
    if (rawHash === '#' || rawHash === '#/' || rawHash === '#%2F') {
      var urlNoHash = location.href.replace(/#.*$/, '');
      history.replaceState(null, '', urlNoHash);
      return;
    }
  } catch(_) {}

  // Do NOT early-return based on hash alone; Supabase PKCE returns ?code in the query string

  // Config (keep in sync with other files)
  var SUPABASE_URL = 'https://wedevtjjmdvngyshqdro.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M';

  function parseHashParams(){
    try { return new URLSearchParams((location.hash || '').replace(/^#/, '')); } catch(_) { return new URLSearchParams(); }
  }

  function parseSearchParams(){
    try { return new URLSearchParams(location.search); } catch(_) { return new URLSearchParams(); }
  }

  function cleanUrl(appendQuery){
    try {
      var url = new URL(location.href);
      // Remove sensitive params from both hash and query
      url.hash = '';
      var toDrop = [
        'code','state','access_token','refresh_token','token_type','expires_in',
        'provider','error','error_code','error_description','redirected_from'
      ];
      toDrop.forEach(function(k){ try { url.searchParams.delete(k); } catch(_){} });
      if (appendQuery && typeof appendQuery === 'object') {
        Object.keys(appendQuery).forEach(function(k){ if (appendQuery[k] != null) url.searchParams.set(k, String(appendQuery[k])); });
      }
      history.replaceState(null, '', url.toString());
    } catch(_) {}
  }

  function signalSuccess(user){
    try {
      var payload = { type: 'THARAGA_AUTH_SUCCESS', user: user || null, ts: Date.now() };
      // BroadcastChannel
      try { var bc = ('BroadcastChannel' in window) ? new BroadcastChannel('tharaga-auth') : null; bc && bc.postMessage(payload); } catch(_){ }
      // postMessage same-origin listeners
      try { window.postMessage(payload, window.location.origin); } catch(_){ }
      // storage signal
      try { localStorage.setItem('__tharaga_magic_confirmed', JSON.stringify({ ts: Date.now() })); } catch(_){ }
    } catch(_) {}
  }
  // Re-broadcast so late listeners catch success (header attaching after load)
  function rebroadcastAuthSuccess(user){
    try { signalSuccess(user); } catch(_){ }
    try { setTimeout(function(){ signalSuccess(user); }, 150); } catch(_){ }
    try { setTimeout(function(){ signalSuccess(user); }, 800); } catch(_){ }
  }

  async function ensureSupabase(){
    if (window.supabase && window.supabase.auth) return window.supabase;
    try {
      var mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      var c = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      try { window.supabase = c; } catch(_){ }
      return c;
    } catch(_) { return null; }
  }

  (async function handle(){
    var hp = parseHashParams();
    var sp = parseSearchParams();

    // Error path: surface minimal info and clean URL
    var err = sp.get('error') || sp.get('error_code') || hp.get('error') || hp.get('error_code') || null;
    if (err) {
      cleanUrl({ post_auth: '1', error: err });
      return;
    }

    var accessToken = hp.get('access_token') || sp.get('access_token');
    var refreshToken = hp.get('refresh_token') || sp.get('refresh_token');
    var code = sp.get('code') || hp.get('code');

    if (!accessToken && !code) return; // not a Supabase auth redirect we handle

    var client = await ensureSupabase();
    if (!client || !client.auth) { cleanUrl({ post_auth: '1' }); return; }

    try {
      var user = null;
      if (accessToken && refreshToken) {
        var setRes = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        user = (setRes && setRes.data && setRes.data.user) ? setRes.data.user : null;
      } else if (code) {
        var exRes = await client.auth.exchangeCodeForSession(code);
        user = (exRes && exRes.data && exRes.data.user) ? exRes.data.user : null;
      }

      // Clean the URL to remove tokens/fragments
      cleanUrl({ post_auth: '1' });

      // Notify listeners (header, modals) and re-broadcast for late binders
      rebroadcastAuthSuccess(user ? { id: user.id || null, email: user.email || null } : null);
    } catch(_) {
      cleanUrl({ post_auth: '1' });
    }
  })();
})();
