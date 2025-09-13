(function(){
  'use strict';

  const HEADER_SCRIPT = '/login_signup_glassdrop/auth-header.js';
  const GATE_SCRIPT = '/login_signup_glassdrop/auth-gate.js';

  function ensureScript(src){
    return new Promise((resolve)=>{
      try {
        // already present?
        const existing = Array.from(document.scripts).some(s => (s.getAttribute('src')||'').includes(src));
        if (existing) return resolve(true);
        const s = document.createElement('script');
        s.src = src;
        s.defer = true;
        s.onload = ()=> resolve(true);
        s.onerror = ()=> resolve(false);
        document.head ? document.head.appendChild(s) : document.documentElement.appendChild(s);
      } catch(_) { resolve(false); }
    });
  }

  function injectHeader(){
    try {
      if (document.getElementById('tharaga-auth-header-host')) return;
      const host = document.createElement('div');
      host.id = 'tharaga-auth-header-host';
      host.style.position = 'fixed';
      host.style.top = '12px';
      host.style.right = '12px';
      host.style.zIndex = '2147483645';
      host.style.pointerEvents = 'none';
      const el = document.createElement('auth-header');
      el.style.pointerEvents = 'auto';
      host.appendChild(el);
      (document.body || document.documentElement).appendChild(host);
    } catch(_){}
  }

  function onReady(fn){
    if (document.readyState === 'complete' || document.readyState === 'interactive') return fn();
    document.addEventListener('DOMContentLoaded', fn, { once:true });
  }

  onReady(async function(){
    await ensureScript(GATE_SCRIPT);
    await ensureScript(HEADER_SCRIPT);
    injectHeader();
  });
})();

