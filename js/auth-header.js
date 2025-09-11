(function(){
  'use strict';
  if (window.__authHeaderInstalledV2) return; window.__authHeaderInstalledV2 = true;

  // Inject styles once
  (function injectStyles(){
    try {
      if (document.getElementById('auth-header-styles')) return;
      var css = document.createElement('style');
      css.id = 'auth-header-styles';
      css.textContent = 
        '.auth-account-wrap{position:absolute;top:14px;right:16px;display:flex;align-items:center;z-index:2147483000;}'+
        '@media (min-width:1024px){.auth-account-wrap{top:16px;right:24px;}}'+
        '.auth-account-wrap.is-fixed{position:fixed;top:14px;right:16px;}'+
        '.auth-account-btn{appearance:none;background:transparent;color:#111;border:1px solid rgba(0,0,0,.6);border-radius:9999px;padding:8px 14px;font-weight:600;cursor:pointer;line-height:1;white-space:nowrap;}'+
        '.auth-account-btn:hover{background:rgba(0,0,0,.06)}'+
        '.auth-account-menu{position:absolute;top:calc(100% + 10px);right:0;min-width:180px;background:#0b0b0b;color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:8px;box-shadow:0 12px 30px rgba(0,0,0,.4);display:none;z-index:2147483001;}'+
        '.auth-account-menu[aria-hidden="false"]{display:block}'+
        '.auth-account-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;text-decoration:none;color:#fff;cursor:pointer;}'+
        '.auth-account-item:hover{background:rgba(255,255,255,.08)}'+
        '.auth-account-initial{width:26px;height:26px;border-radius:999px;background:#fff;color:#111;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;}';
      (document.head || document.documentElement).appendChild(css);
    } catch(_) {}
  })();

  function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',fn);} else { fn(); } }

  function headerRoot(){
    return document.querySelector('header, [role="banner"], [data-section="header"], .site-header, .Header, nav') || null;
  }

  function hideLegacyAuthLinks(root){
    (root||document).querySelectorAll('a[href="#login"], a[href="#signup"], [data-auth-open]')
      .forEach(function(el){ el.style.display='none'; el.setAttribute('aria-hidden','true'); });
  }

  function ensureContainer(){
    var hdr = headerRoot();
    var wrap = document.querySelector('.auth-account-wrap');
    if (!wrap){
      wrap = document.createElement('div');
      wrap.className = 'auth-account-wrap';
      var parent = hdr || document.body;
      if (hdr) {
        var cs = getComputedStyle(hdr);
        if (cs.position === 'static') { hdr.style.position = 'relative'; }
        parent.appendChild(wrap);
      } else {
        wrap.classList.add('is-fixed');
        parent.appendChild(wrap);
      }
    }
    return wrap;
  }

  function ensureUI(){
    var wrap = ensureContainer();
    var btn = wrap.querySelector('.auth-account-btn');
    if (!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'auth-account-btn';
      btn.textContent = 'Login / Signup';
      wrap.appendChild(btn);
    }
    var menu = wrap.querySelector('.auth-account-menu');
    if (!menu){
      menu = document.createElement('div');
      menu.className = 'auth-account-menu';
      menu.setAttribute('aria-hidden','true');
      menu.innerHTML =
        '<div class="auth-account-item" data-action="profile"><span class="auth-account-initial">U</span><span>Profile</span></div>' +
        '<div class="auth-account-item" data-action="logout"><span>Logout</span></div>';
      wrap.appendChild(menu);
    }
    return {wrap:wrap, btn:btn, menu:menu};
  }

  function initialFromUser(user){
    var name = (user && user.user_metadata && user.user_metadata.full_name) || '';
    var email = (user && user.email) || '';
    var base = (name || email || '').trim();
    return base ? base[0].toUpperCase() : 'U';
  }

  function firstName(user){
    try {
      var full = (user && user.user_metadata && user.user_metadata.full_name) || '';
      if (full) return full.split(/\s+/)[0];
      var email = (user && user.email) || '';
      if (email) return email.split('@')[0].replace(/\b\w/g, function(c){ return c.toUpperCase(); });
    } catch(_) {}
    return 'There';
  }

  function render(ui, user){
    var label;
    if (user) {
      try {
        var full = (user && user.user_metadata && user.user_metadata.full_name) || '';
        var email = (user && user.email) || '';
        label = (full && full.trim()) || email || 'Account';
      } catch(_) {
        label = 'Account';
      }
    } else {
      label = 'Login / Signup';
    }
    ui.btn.textContent = label;
    var init = ui.menu.querySelector('.auth-account-initial');
    if (init) init.textContent = initialFromUser(user);
  }

  function toggleMenu(menu, show){ menu.setAttribute('aria-hidden', show ? 'false' : 'true'); }

  function bind(ui, state){
    ui.btn.addEventListener('click', function(e){
      e.preventDefault();
      if (!state.user) {
        window.authGate && window.authGate.openLoginModal && window.authGate.openLoginModal({ next: location.pathname + location.search });
        return;
      }
      var open = ui.menu.getAttribute('aria-hidden') === 'true';
      toggleMenu(ui.menu, open);
    });
    ui.menu.addEventListener('click', async function(e){
      var item = e.target.closest('.auth-account-item'); if (!item) return;
      var act = item.getAttribute('data-action');
      if (act === 'profile'){
        window.authGate && window.authGate.openLoginModal && window.authGate.openLoginModal({ next: location.pathname + location.search });
        toggleMenu(ui.menu,false);
      }
      if (act === 'logout'){
        try { await (window.supabase && window.supabase.auth && window.supabase.auth.signOut && window.supabase.auth.signOut()); } catch(_){ }
        try { localStorage.removeItem('__tharaga_magic_continue'); localStorage.removeItem('__tharaga_magic_confirmed'); } catch(_){}
        state.user = null; render(ui, state.user); toggleMenu(ui.menu,false);
      }
    });
    document.addEventListener('click', function(e){
      if (ui.menu.getAttribute('aria-hidden') === 'true') return;
      if (!ui.menu.contains(e.target) && e.target !== ui.btn && !ui.btn.contains(e.target)){
        toggleMenu(ui.menu,false);
      }
    });
    document.addEventListener('keydown', function(e){ if (e.key==='Escape') toggleMenu(ui.menu,false); });
  }

  async function getUser(){
    try {
      if (window.supabase && window.supabase.auth){
        var res = await window.supabase.auth.getUser();
        return (res && res.data && res.data.user) ? res.data.user : null;
      }
    } catch(_){ }
    try {
      var payload = JSON.parse(localStorage.getItem('__tharaga_magic_continue')||'null');
      if (payload && payload.user) return { email: payload.user.email || null, user_metadata:{} };
    } catch(_){ }
    if (window.__authGateLoggedIn) return { email:null, user_metadata:{} };
    return null;
  }

  function observeRerenders(){
    var mo = new MutationObserver(function(muts){
      for (var i=0;i<muts.length;i++){
        for (var j=0;j<muts[i].addedNodes.length;j++){
          var n = muts[i].addedNodes[j];
          if (n.nodeType !== 1) continue;
          hideLegacyAuthLinks(n);
          ensureContainer();
        }
      }
    });
    mo.observe(document.documentElement, { childList:true, subtree:true });
  }

  function ensureSupabaseClient(){
    if (window.supabase && window.supabase.auth) return Promise.resolve(window.supabase);
    return import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(function(mod){
      var SUPABASE_URL = 'https://wedevtjjmdvngyshqdro.supabase.co';
      var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M';
      var c = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      try { window.supabase = c; } catch(_) {}
      return c;
    }).catch(function(){ return null; });
  }

  ready(async function(){
    hideLegacyAuthLinks(document);
    var ui = ensureUI();
    await ensureSupabaseClient();
    var state = { user: await getUser() };
    render(ui, state.user);
    bind(ui, state);
    observeRerenders();

    if (window.supabase && window.supabase.auth){
      try {
        window.supabase.auth.onAuthStateChange(function(_ev, session){
          state.user = (session && session.user) || null;
          render(ui, state.user);
        });
      } catch(_){ }
    }
    window.addEventListener('storage', function(ev){
      if (ev.key === '__tharaga_magic_continue' && ev.newValue){
        try {
          var p = JSON.parse(ev.newValue);
          state.user = p && p.user ? { email:p.user.email||null, user_metadata:{} } : state.user || { email:null, user_metadata:{} };
          render(ui, state.user);
        } catch(_){ }
      }
    });
  });
})();

