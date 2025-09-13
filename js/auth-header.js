(function(){
  'use strict';
  if (window.__authHeaderInstalledV3) return; window.__authHeaderInstalledV3 = true;

  // Optional link overrides for navigation
  window.AUTH_NAV = window.AUTH_NAV || { profile: '/profile', dashboard: '/dashboard' };

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
        '.auth-account-btn{appearance:none;background:transparent;color:#fff;border:1px solid rgba(255,255,255,.9);border-radius:9999px;padding:8px 14px;font-weight:600;cursor:pointer;line-height:1;white-space:nowrap;display:inline-flex;align-items:center;gap:8px;transition:background .15s ease,border-color .15s ease,color .15s ease,box-shadow .15s ease;}'+
        '.auth-account-btn:hover{background:rgba(255,255,255,.08)}'+
        '.auth-account-btn .auth-btn-initial{width:22px;height:22px;border-radius:9999px;background:#fff;color:#111;display:none;align-items:center;justify-content:center;font-weight:700;font-size:11px;}'+
        '.auth-account-btn.is-authenticated .auth-btn-initial{display:inline-flex;}'+
        '.auth-account-btn.is-authenticated::after{content:"";display:inline-block;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid rgba(255,255,255,.9);transition:transform .15s ease;transform-origin:center;}'+
        '.auth-account-btn[aria-expanded="true"].is-authenticated::after{transform:rotate(180deg);}'+
        '.auth-account-btn .auth-btn-spinner{width:14px;height:14px;border-radius:9999px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;display:none;animation:authspin .8s linear infinite;}'+
        '.auth-account-btn.is-loading .auth-btn-spinner{display:inline-block;}'+
        '@keyframes authspin{to{transform:rotate(360deg);}}'+
        '.auth-account-menu{position:absolute;top:calc(100% + 10px);right:0;min-width:240px;background:#0b0b0b;color:#fff;border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:8px;box-shadow:0 12px 34px rgba(0,0,0,.45);visibility:hidden;opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .18s ease,transform .18s ease,visibility 0s linear .18s;z-index:2147483001;}'+
        '.auth-account-menu[aria-hidden="false"]{visibility:visible;opacity:1;transform:translateY(0);pointer-events:auto;transition:opacity .18s ease,transform .18s ease,visibility 0s linear 0s;}'+
        '.auth-account-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;text-decoration:none;color:#fff;cursor:pointer;}'+
        '.auth-account-item:hover{background:rgba(255,255,255,.08)}'+
        '.auth-account-item[tabindex]{outline:none}'+
        '.auth-account-item.is-header{cursor:default;font-weight:700;opacity:.95;}'+
        '.auth-account-item.is-header:hover{background:transparent}'+
        '.auth-account-sep{height:1px;background:rgba(255,255,255,.12);margin:6px 8px;border-radius:1px;}'+
        '.auth-account-initial{width:26px;height:26px;border-radius:9999px;background:#fff;color:#111;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;}'+
        '.auth-account-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;}';
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
      btn.setAttribute('aria-haspopup','menu');
      btn.setAttribute('aria-expanded','false');
      btn.textContent = 'Sign in';
      var avatar = document.createElement('span');
      avatar.className = 'auth-btn-initial';
      avatar.textContent = 'U';
      var spinner = document.createElement('span');
      spinner.className = 'auth-btn-spinner';
      btn.prepend(avatar);
      btn.appendChild(spinner);
      wrap.appendChild(btn);
    }
    var menu = wrap.querySelector('.auth-account-menu');
    if (!menu){
      menu = document.createElement('div');
      menu.className = 'auth-account-menu';
      menu.id = 'auth-account-menu';
      menu.setAttribute('role','menu');
      menu.setAttribute('aria-hidden','true');
      menu.innerHTML =
        '<div class="auth-account-item is-header" aria-disabled="true">'+
          '<span class="auth-account-initial">U</span>'+
          '<span class="auth-account-name">User</span>'+
        '</div>'+
        '<div class="auth-account-sep"></div>'+
        '<div class="auth-account-item" role="menuitem" tabindex="0" data-action="profile"><span>Profile</span></div>'+
        '<div class="auth-account-item" role="menuitem" tabindex="0" data-action="dashboard"><span>Dashboard</span></div>'+
        '<div class="auth-account-item" role="menuitem" tabindex="0" data-action="logout"><span>Logout</span></div>';
      wrap.appendChild(menu);
    }
    btn.setAttribute('aria-controls','auth-account-menu');
    return {wrap:wrap, btn:btn, menu:menu};
  }

  function getBestName(user, profile){
    var pName = (profile && (profile.full_name || profile.username || profile.name)) || '';
    var meta = (user && user.user_metadata) || {};
    var mName = (meta.full_name || meta.name || meta.username || '').trim();
    var email = (user && user.email) || '';
    return (pName || mName || email || 'My Account').trim();
  }

  function getInitial(str){
    var base = (str || '').trim();
    return base ? base[0].toUpperCase() : 'U';
  }

  function openMenu(ui){
    ui.menu.setAttribute('aria-hidden','false');
    ui.btn.setAttribute('aria-expanded','true');
    var first = ui.menu.querySelector('[role="menuitem"]');
    if (first) setTimeout(function(){ first.focus(); }, 0);
  }
  function closeMenu(ui){
    ui.menu.setAttribute('aria-hidden','true');
    ui.btn.setAttribute('aria-expanded','false');
  }
  function toggleMenu(ui){
    var isHidden = ui.menu.getAttribute('aria-hidden') === 'true';
    if (isHidden) openMenu(ui); else closeMenu(ui);
  }

  function render(ui, state){
    var user = state.user;
    var isLoggedIn = !!user;
    var avatar = ui.btn.querySelector('.auth-btn-initial');
    if (isLoggedIn){
      var display = getBestName(user, state.profile);
      ui.btn.classList.add('is-authenticated');
      ui.btn.textContent = display;
      if (avatar){ avatar.textContent = getInitial(display); ui.btn.prepend(avatar); }
      var initEl = ui.menu.querySelector('.auth-account-initial'); if (initEl) initEl.textContent = getInitial(display);
      var nameEl = ui.menu.querySelector('.auth-account-name'); if (nameEl) nameEl.textContent = display;
    } else {
      ui.btn.classList.remove('is-authenticated');
      closeMenu(ui);
      ui.btn.textContent = 'Sign in';
      if (avatar){ avatar.textContent = 'U'; ui.btn.prepend(avatar); }
    }
    if (state.loadingProfile){ ui.btn.classList.add('is-loading'); } else { ui.btn.classList.remove('is-loading'); }
  }

  function bind(ui, state){
    ui.btn.addEventListener('click', function(e){
      e.preventDefault();
      if (state.user){
        toggleMenu(ui);
      } else {
        if (window.authGate && window.authGate.openLoginModal) {
          window.authGate.openLoginModal({ next: location.pathname + location.search });
        }
      }
    });
    ui.btn.addEventListener('keydown', function(e){
      if ((e.key === 'ArrowDown' || e.key === 'Enter') && state.user){ e.preventDefault(); openMenu(ui); }
    });
    ui.menu.addEventListener('click', async function(e){
      var item = e.target.closest('.auth-account-item[role="menuitem"]'); if (!item) return;
      var act = item.getAttribute('data-action');
      if (act === 'profile'){ closeMenu(ui); try { location.href = (window.AUTH_NAV && window.AUTH_NAV.profile) || '/profile'; } catch(_){} return; }
      if (act === 'dashboard'){ closeMenu(ui); try { location.href = (window.AUTH_NAV && window.AUTH_NAV.dashboard) || '/dashboard'; } catch(_){} return; }
      if (act === 'settings'){ closeMenu(ui); try { location.href = (window.AUTH_NAV && window.AUTH_NAV.settings) || '/settings'; } catch(_){} return; }
      if (act === 'billing'){ closeMenu(ui); try { location.href = (window.AUTH_NAV && window.AUTH_NAV.billing) || '/billing'; } catch(_){} return; }
      if (act === 'logout'){
        try { await (window.supabase && window.supabase.auth && window.supabase.auth.signOut && window.supabase.auth.signOut()); } catch(_){ }
        try { localStorage.removeItem('__tharaga_magic_continue'); localStorage.removeItem('__tharaga_magic_confirmed'); } catch(_){ }
        state.user = null; state.profile = null; state.loadingProfile = false; render(ui, state); closeMenu(ui);
      }
    });
    ui.menu.addEventListener('keydown', function(e){
      if (e.key === 'Escape'){ e.preventDefault(); closeMenu(ui); ui.btn.focus(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      var items = Array.prototype.slice.call(ui.menu.querySelectorAll('.auth-account-item[role="menuitem"]'));
      var idx = items.indexOf(document.activeElement);
      if (!items.length) return;
      if (e.key === 'Home'){ items[0].focus(); return; }
      if (e.key === 'End'){ items[items.length - 1].focus(); return; }
      var next = e.key === 'ArrowDown' ? (idx + 1 + items.length) % items.length : (idx - 1 + items.length) % items.length;
      items[next].focus();
    });
    document.addEventListener('click', function(e){
      if (ui.menu.getAttribute('aria-hidden') === 'true') return;
      if (!ui.menu.contains(e.target) && e.target !== ui.btn && !ui.btn.contains(e.target)){
        closeMenu(ui);
      }
    });
    document.addEventListener('keydown', function(e){ if (e.key==='Escape') closeMenu(ui); });
  }

  function headerRootObserve(){
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

  async function getInitialUser(){
    try {
      if (window.supabase && window.supabase.auth){
        var sess = await window.supabase.auth.getSession();
        if (sess && sess.data && sess.data.session && sess.data.session.user) return sess.data.session.user;
      }
    } catch(_){ }
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

  async function fetchProfile(user){
    if (!user || !window.supabase || !window.supabase.from) return null;
    try {
      var res = await window.supabase.from('profiles').select('full_name, username, name').eq('id', user.id).single();
      if (res && res.error) return null;
      return (res && res.data) ? res.data : null;
    } catch(_){ return null; }
  }

  ready(async function(){
    hideLegacyAuthLinks(document);
    var ui = ensureUI();
    await ensureSupabaseClient();
    var state = { user: null, profile: null, loadingProfile: false };

    // Initial session and profile
    state.user = await getInitialUser();
    if (state.user){
      state.loadingProfile = true; render(ui, state);
      state.profile = await fetchProfile(state.user);
      state.loadingProfile = false;
    }
    render(ui, state);

    bind(ui, state);
    headerRootObserve();

    if (window.supabase && window.supabase.auth){
      try {
        window.supabase.auth.onAuthStateChange(function(event, session){
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION'){
            state.user = (session && session.user) || null;
            if (state.user){
              state.loadingProfile = true; state.profile = null; render(ui, state);
              fetchProfile(state.user).then(function(p){ state.profile = p; state.loadingProfile = false; render(ui, state); });
            } else {
              state.profile = null; state.loadingProfile = false; render(ui, state);
            }
          }
          if (event === 'SIGNED_OUT'){
            state.user = null; state.profile = null; state.loadingProfile = false; render(ui, state); closeMenu(ui);
          }
        });
      } catch(_){ }
    }

    // BroadcastChannel + storage + postMessage listeners for durability
    var bc = ('BroadcastChannel' in window) ? new BroadcastChannel('tharaga-auth') : null;
    if (bc) {
      bc.addEventListener('message', function(ev){
        if (ev.data && ev.data.type === 'THARAGA_AUTH_SUCCESS') {
          if (window.supabase && window.supabase.auth) {
            window.supabase.auth.getSession().then(function(){
              window.supabase.auth.getUser().then(function(res){
                var u = (res && res.data && res.data.user) ? res.data.user : state.user;
                state.user = u;
                if (u){
                  state.loadingProfile = true; render(ui, state);
                  fetchProfile(u).then(function(p){ state.profile = p; state.loadingProfile = false; render(ui, state); });
                } else { render(ui, state); }
              });
            });
          }
        }
      });
    }

    window.addEventListener('message', function(ev){
      try {
        var d = ev.data;
        // Accept token transfer only from allowed auth origin
        var allowedAuthOrigin = (function(){
          try { return new URL('https://auth.tharaga.co.in').origin; } catch(_) { return null; }
        })();
        if (d && d.type === 'tharaga_token_transfer' && allowedAuthOrigin && ev.origin === allowedAuthOrigin) {
          if (window.supabase && window.supabase.auth && d.access_token && d.refresh_token) {
            window.supabase.auth.setSession({ access_token: d.access_token, refresh_token: d.refresh_token }).then(function(){
              try {
                // Immediately reflect UI and fetch profile
                window.supabase.auth.getUser().then(function(res){
                  var u = (res && res.data && res.data.user) ? res.data.user : state.user;
                  state.user = u;
                  if (u){
                    state.loadingProfile = true; render(ui, state);
                    fetchProfile(u).then(function(p){ state.profile = p; state.loadingProfile = false; render(ui, state); });
                  } else { render(ui, state); }
                });
              } catch(_){}
            }).catch(function(_){});
          }
          return;
        }
        if (d && d.type === 'THARAGA_AUTH_SUCCESS') {
          if (ev.origin !== window.location.origin) return;
          if (window.supabase && window.supabase.auth) {
            window.supabase.auth.getSession().then(function(){
              window.supabase.auth.getUser().then(function(res){
                var u = (res && res.data && res.data.user) ? res.data.user : state.user;
                state.user = u;
                if (u){
                  state.loadingProfile = true; render(ui, state);
                  fetchProfile(u).then(function(p){ state.profile = p; state.loadingProfile = false; render(ui, state); });
                } else { render(ui, state); }
              });
            });
          }
        }
      } catch(_){ }
    });

    window.addEventListener('storage', function(ev){
      if (ev.key === '__tharaga_magic_continue' && ev.newValue){
        try {
          var p = JSON.parse(ev.newValue);
          state.user = p && p.user ? { email:p.user.email||null, user_metadata:{} } : state.user || { email:null, user_metadata:{} };
          render(ui, state);
        } catch(_){ }
      }
      if (ev.key === '__tharaga_magic_confirmed'){
        try {
          if (window.supabase && window.supabase.auth) {
            window.supabase.auth.getSession().then(function(){
              window.supabase.auth.getUser().then(function(res){
                var u = (res && res.data && res.data.user) ? res.data.user : state.user;
                state.user = u;
                if (u){
                  state.loadingProfile = true; render(ui, state);
                  fetchProfile(u).then(function(pp){ state.profile = pp; state.loadingProfile = false; render(ui, state); });
                } else { render(ui, state); }
              });
            });
          }
        } catch(_){ }
      }
    });
  });
})();

