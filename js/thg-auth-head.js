/* Tharaga durable auth head — single include
 * Mirrors the working flow in /snippets/index.html
 * Usage: <script src="/js/thg-auth-head.js" defer></script>
 */
;(function(){
  try{ if (window.__thgDurableHeadIncluded) return; window.__thgDurableHeadIncluded = true; } catch(_) {}

  // 0) Defaults (host page can override before this script loads)
  try { if (typeof window.AUTH_OPEN_ON_LOAD === 'undefined') window.AUTH_OPEN_ON_LOAD = false; } catch(_){}
  try { if (typeof window.AUTH_HIDE_HEADER === 'undefined') window.AUTH_HIDE_HEADER = false; } catch(_){}
  try { window.AUTH_NAV = Object.assign({ profile: '/profile', dashboard: '/dashboard', settings: null }, window.AUTH_NAV || {}); } catch(_){}
  try { if (!window.DURABLE_AUTH_URL) window.DURABLE_AUTH_URL = 'https://auth.tharaga.co.in/login_signup_glassdrop/'; } catch(_){}

  // Defensive: clean malformed fragments like #https:/auth...
  try { var h = (location.hash||'').trim(); if (/^#https?:\/+/.test(h)) { history.replaceState(null,'',location.href.replace(location.hash,'')); } } catch(_) {}

  // 2) Ensure auth-gate present once
  try {
    if (!document.querySelector('script[data-thg-auth-gate]')){
      var s = document.createElement('script');
      s.src = (window.DURABLE_AUTH_URL || 'https://auth.tharaga.co.in/login_signup_glassdrop/') + 'auth-gate.js';
      s.defer = true; s.setAttribute('data-thg-auth-gate','1');
      (document.head||document.documentElement).appendChild(s);
    }
  } catch(_){}

  // === Inline header UI (from snippets) ===
  (function(){
    if (window.__thgAuthInstalledV1) return; window.__thgAuthInstalledV1 = true;

    const AUTH_NAV = Object.assign({ profile: '/profile', dashboard: '/dashboard', settings: null }, window.AUTH_NAV || {});
    const Z_BASE = 2147483000;

    window.authGate = window.authGate || {};
    window.authGate.openLoginModal = function(opts){ (window.__thgOpenAuthModal || function(){ alert('Auth not ready'); })(opts||{}); };

    function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',fn,{once:true});} else { fn(); } }
    function headerRoot(){ return document.querySelector('header, [role="banner"], [data-section="header"], .site-header, .Header, nav') || null; }
    function hideLegacyAuthLinks(root){ var scope = (root || document); var selector = 'a[href="#login"], a[href="#signup"], [data-auth-open]'; scope.querySelectorAll(selector).forEach(function(el){ if (el.__thgAuthWired) return; el.__thgAuthWired = true; el.addEventListener('click', function(ev){ try { ev.preventDefault(); var next = location.pathname + location.search; if (window.authGate && typeof window.authGate.openLoginModal === 'function') { window.authGate.openLoginModal({ next }); } else if (typeof window.__thgOpenAuthModal === 'function') { window.__thgOpenAuthModal({ next }); } } catch(_){ } }, { passive:false }); }); }
    function clamp(str, max){ if (!str) return ''; return str.length>max ? str.slice(0,max-1)+'…' : str; }
    function getInitials(user){ const meta = user?.user_metadata || {}; const full = (meta.full_name || meta.name || '').trim(); if (full) { const parts = full.split(/\s+/).filter(Boolean); const first = parts[0]?.[0] || ''; const last = parts.length>1 ? parts[parts.length-1][0] : ''; return (first+last || first || '').toUpperCase() || 'U'; } const email = (user?.email || '').trim(); return email ? email[0].toUpperCase() : 'U'; }
    function getDisplayName(user){ const meta = user?.user_metadata || {}; const name = (meta.full_name || meta.name || meta.username || '').trim(); return name || (user?.email || 'My Account'); }
    function createEl(tag, cls, attrs){ const el = document.createElement(tag); if (cls) el.className = cls; if (attrs) for (var k in attrs) el.setAttribute(k, attrs[k]); return el; }
    function validateEmail(val){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); }
    function ensureContainer(){ let hdr = headerRoot(); let wrap = document.querySelector('.thg-auth-wrap'); if (!wrap){ wrap = document.createElement('div'); wrap.className = 'thg-auth-wrap'; let parent = hdr || document.body; if (hdr) { const cs = getComputedStyle(hdr); if (cs.position === 'static') { hdr.style.position = 'relative'; } parent.appendChild(wrap); } else { wrap.classList.add('is-fixed'); parent.appendChild(wrap); } } return wrap; }

    function injectStyles(){ if (document.getElementById('thg-auth-styles')) return; const css = `
.thg-auth-wrap{ position:absolute; top:14px; right:16px; display:flex; align-items:center; z-index:${Z_BASE}; }
@media (min-width:1024px){ .thg-auth-wrap{ top:16px; right:24px; } }
.thg-auth-wrap.is-fixed{ position:fixed; top:14px; right:16px; }
.thg-auth-btn{ appearance:none;background:transparent;color:#fff;border:1px solid rgba(255,255,255,.9); border-radius:9999px;padding:8px 14px;font-weight:600;cursor:pointer;line-height:1;white-space:nowrap;display:inline-flex;align-items:center;gap:8px; transition:background .15s ease, border-color .15s ease, box-shadow .15s ease; }
.thg-auth-btn:hover{background:rgba(255,255,255,.08)}
.thg-auth-btn:focus-visible{ outline:2px solid #7dd3fc; outline-offset:2px; }
.thg-auth-btn .thg-initial{ width:22px;height:22px;border-radius:9999px;background:#fff;color:#111;display:none;align-items:center;justify-content:center;font-weight:700;font-size:11px; }
.thg-auth-btn.is-auth .thg-initial{ display:inline-flex; }
.thg-auth-btn.is-auth::after{ content:""; display:inline-block; width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid rgba(255,255,255,.9); transition:transform .15s ease; transform-origin:center; }
.thg-auth-btn[aria-expanded="true"].is-auth::after{ transform:rotate(180deg); }
.thg-spinner{ width:14px;height:14px;border-radius:9999px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff; animation:thgspin .8s linear infinite; }
@keyframes thgspin{ to{ transform:rotate(360deg); } }
.thg-auth-menu{ position:absolute;top:calc(100% + 10px);right:0;min-width:280px;background:#0b0b0b;color:#fff; border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:8px;box-shadow:0 12px 30px rgba(0,0,0,.45); visibility:hidden; opacity:0; transform:translateY(-6px) scale(.98); transform-origin:top right; pointer-events:none; transition:opacity .16s ease, transform .16s ease, visibility 0s linear .16s; z-index:${Z_BASE+1}; }
.thg-auth-menu[aria-hidden="false"]{ visibility:visible; opacity:1; transform:translateY(0) scale(1); pointer-events:auto; }
.thg-auth-item{ display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;text-decoration:none;color:#fff;cursor:pointer; }
.thg-auth-item:hover{background:rgba(255,255,255,.08)}
.thg-auth-item.is-header{ cursor:default;font-weight:700;opacity:.95; }
.thg-auth-sep{ height:1px;background:rgba(255,255,255,.12);margin:6px 8px;border-radius:1px; }
.thg-initial-lg{ width:28px;height:28px;border-radius:9999px;background:#fff;color:#111;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px; }
.thg-name{ overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:190px; }
.thg-email{ opacity:.7; font-size:12px; overflow:hidden;text-overflow:ellipsis;white-space:nowrap; max-width:200px; }
.thg-auth-overlay{ position:fixed; inset:0; background:rgba(0,0,0,.55); backdrop-filter:saturate(140%) blur(6px); display:flex; align-items:center; justify-content:center; z-index:${Z_BASE+2}; visibility:hidden; opacity:0; transition:opacity .18s ease, visibility 0s linear .18s; }
.thg-auth-overlay[aria-hidden="false"]{ visibility:visible; opacity:1; }
.thg-auth-modal{ width:100%; max-width:420px; background:linear-gradient(180deg, rgba(20,20,20,.98), rgba(12,12,12,.98)); color:#fff; border:1px solid rgba(255,255,255,.1); border-radius:16px; box-shadow:0 30px 60px rgba(0,0,0,.5); transform:translateY(10px) scale(.98); opacity:0; transition:transform .18s ease, opacity .18s ease; }
.thg-auth-overlay[aria-hidden="false"] .thg-auth-modal{ transform:translateY(0) scale(1); opacity:1; }
.thg-auth-header{ display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border-bottom:1px solid rgba(255,255,255,.08); }
.thg-auth-title{ font-weight:800; font-size:20px; }
.thg-auth-close{ appearance:none; background:linear-gradient(180deg,#f3cd4a,#eab308,#c58a04); border:0; color:#111; cursor:pointer; font-weight:800; width:32px; height:32px; line-height:32px; border-radius:9999px; box-shadow:0 2px 6px rgba(0,0,0,.25); }
.thg-auth-body{ padding:16px 18px 18px; }
.thg-tabs{ display:flex; gap:6px; background:rgba(255,255,255,.06); padding:4px; border-radius:9999px; margin-bottom:16px; }
.thg-tab{ flex:1; text-align:center; padding:8px 10px; border-radius:9999px; cursor:pointer; font-weight:700; color:#ddd; }
.thg-tab[aria-selected="true"]{ background:#fff; color:#111; }
.thg-field{ display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
.thg-field label{ font-size:12px; opacity:.9; }
.thg-field label[for="thg-si-password"]::after{ content:" (optional — use Magic Link for fastest login)"; color:#9ca3af; font-weight:500; }
.thg-input{ appearance:none; background:#121212; color:#fff; border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:10px 12px; }
.thg-input::placeholder{ color:#6b7280; }
.thg-input:focus{ outline:2px solid #facc15; outline-offset:2px; }
.thg-actions{ display:flex; justify-content:space-between; align-items:center; margin:6px 0 12px; }
.thg-link{ background:none; border:0; color:#22c55e; cursor:pointer; font-size:13px; padding:0; }
.thg-btn-primary{ width:100%; appearance:none; background:linear-gradient(180deg,#f8d34a,#f0b90b,#c89200); color:#111; border:1px solid rgba(250, 204, 21, .9); border-radius:12px; padding:12px 14px; font-weight:800; cursor:pointer; box-shadow:0 4px 0 rgba(250, 204, 21, .35); }
.thg-oauth{ display:grid; grid-template-columns:1fr; gap:10px; margin-top:10px; }
.thg-oauth-btn{ appearance:none; background:#0f0f0f; color:#fff; border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:12px 14px; cursor:pointer; font-weight:800; display:flex; align-items:center; justify-content:center; gap:10px; }
.thg-oauth-btn .g-icon{ width:18px; height:18px; }
`; const style = document.createElement('style'); style.id = 'thg-auth-styles'; style.textContent = css; (document.head||document.documentElement).appendChild(style); }

    function createUI(){
      const wrap = ensureContainer();
      let btn = wrap.querySelector('.thg-auth-btn');
      if (!btn){ btn = createEl('button', 'thg-auth-btn', { type:'button', 'aria-haspopup':'menu', 'aria-expanded':'false', 'aria-label':'Open account menu' }); const avatar = createEl('span', 'thg-initial'); avatar.textContent = 'U'; const label = document.createElement('span'); label.className = 'thg-label'; const spinner = createEl('span','thg-spinner',{'aria-hidden':'true'}); btn.appendChild(avatar); btn.appendChild(label); btn.appendChild(spinner); wrap.appendChild(btn); }
      let menu = wrap.querySelector('.thg-auth-menu');
      if (!menu){ menu = createEl('div', 'thg-auth-menu', { id:'thg-auth-menu', role:'menu', 'aria-hidden':'true' }); menu.innerHTML = '<div class="thg-auth-item is-header" aria-disabled="true">' + '<span class="thg-initial-lg">U</span>' + '<span class="thg-name-wrap">' + '<span class="thg-name">User</span>' + '<span class="thg-email">email@example.com</span>' + '</span>' + '</div>' + '<div class="thg-auth-sep"></div>' + '<div class="thg-auth-item" role="menuitem" tabindex="0" data-action="profile"><span>Profile</span></div>' + '<div class="thg-auth-item" role="menuitem" tabindex="0" data-action="dashboard"><span>Dashboard</span></div>' + (AUTH_NAV.settings ? '<div class="thg-auth-item" role="menuitem" tabindex="0" data-action="settings"><span>Settings</span></div>' : '') + '<div class="thg-auth-item" role="menuitem" tabindex="0" data-action="logout"><span>Logout</span></div>'; wrap.appendChild(menu); }
      btn.setAttribute('aria-controls','thg-auth-menu');
      let overlay = document.querySelector('.thg-auth-overlay');
      if (!overlay){ overlay = createEl('div','thg-auth-overlay',{'aria-hidden':'true','aria-modal':'true','role':'dialog'}); overlay.innerHTML = '\n        <div class="thg-auth-modal" role="document" aria-labelledby="thg-auth-title">\n          <div class="thg-auth-header">\n            <div class="thg-auth-title" id="thg-auth-title">Sign in</div>\n            <button class="thg-auth-close" type="button" aria-label="Close">✕</button>\n          </div>\n          <div class="thg-loading-bar" aria-hidden="true"></div>\n          <div class="thg-auth-body">\n            <div class="thg-tabs" role="tablist" aria-label="Authentication method">\n              <button class="thg-tab" role="tab" id="thg-tab-signin" aria-controls="thg-panel-signin" aria-selected="true">Sign in</button>\n              <button class="thg-tab" role="tab" id="thg-tab-signup" aria-controls="thg-panel-signup" aria-selected="false">Create account</button>\n            </div>\n            <div class="thg-error" role="alert"></div>\n            <div id="thg-panel-signin" role="tabpanel" aria-labelledby="thg-tab-signin">\n              <div class="thg-field"><label for="thg-si-email">Email</label><input id="thg-si-email" class="thg-input" type="email" autocomplete="email" placeholder="you@example.com" /></div>\n              <div class="thg-field"><label for="thg-si-password">Password</label><input id="thg-si-password" class="thg-input" type="password" autocomplete="current-password" placeholder="Your password" /></div>\n              <div class="thg-actions"><button class="thg-link" type="button" id="thg-forgot">Forgot password?</button><span class="thg-hint"></span></div>\n              <button class="thg-btn-primary" type="button" id="thg-signin-btn">Sign in</button>\n            </div>\n            <div id="thg-panel-signup" role="tabpanel" aria-labelledby="thg-tab-signup" hidden>\n              <div class="thg-field"><label for="thg-su-name">Full name (optional)</label><input id="thg-su-name" class="thg-input" type="text" autocomplete="name" placeholder="Ada Lovelace" /></div>\n              <div class="thg-field"><label for="thg-su-email">Email</label><input id="thg-su-email" class="thg-input" type="email" autocomplete="email" placeholder="you@example.com" /></div>\n              <div class="thg-field"><label for="thg-su-password">Password</label><input id="thg-su-password" class="thg-input" type="password" autocomplete="new-password" placeholder="At least 8 characters" /></div>\n              <div class="thg-actions"><span class="thg-hint">Use a strong password. You can add name later.</span></div>\n              <button class="thg-btn-primary" type="button" id="thg-signup-btn">Create account</button>\n            </div>\n            <div id="thg-panel-reset" role="tabpanel" aria-labelledby="thg-tab-reset" hidden>\n              <div class="thg-field"><label for="thg-rp-email">Email</label><input id="thg-rp-email" class="thg-input" type="email" autocomplete="email" placeholder="you@example.com" /></div>\n              <div class="thg-actions"><span class="thg-hint">We’ll email a password reset link.</span></div>\n              <button class="thg-btn-primary" type="button" id="thg-reset-btn">Send reset link</button>\n            </div>\n          </div>\n        </div>';
        (document.body||document.documentElement).appendChild(overlay);
      }

      return { wrap, btn, menu, overlay };
    }

    const state = { user: null, loading: true, nextUrl: null, supabaseReady: false };
    function setButtonLoading(ui, isLoading){ const spinner = ui.btn.querySelector('.thg-spinner'); const label = ui.btn.querySelector('.thg-label'); if (isLoading){ ui.btn.classList.remove('is-auth'); if (label) label.textContent = 'Loading…'; if (spinner) spinner.style.display = 'inline-block'; ui.btn.setAttribute('aria-expanded','false'); } else { if (spinner) spinner.style.display = 'none'; } }
    function render(ui){ const label = ui.btn.querySelector('.thg-label'); const avatar = ui.btn.querySelector('.thg-initial'); if (state.loading){ setButtonLoading(ui, true); return; } setButtonLoading(ui, false); if (state.user && state.user.email){ const name = getDisplayName(state.user); ui.btn.classList.add('is-auth'); avatar.textContent = getInitials(state.user); label.textContent = clamp(name, 24); ui.btn.prepend(avatar); } else { ui.btn.classList.remove('is-auth'); ui.btn.setAttribute('aria-expanded','false'); label.textContent = 'Login / Signup'; avatar.textContent = 'U'; ui.btn.prepend(avatar); }}
    function showError(uiOverlay, msg){ const el = uiOverlay.querySelector('.thg-error'); if (!el) return; el.textContent = msg; el.style.display = 'block'; }
    function clearError(uiOverlay){ const el = uiOverlay.querySelector('.thg-error'); if (!el) return; el.textContent = ''; el.style.display = 'none'; }
    function setModalLoading(uiOverlay, loading){ const bar = uiOverlay.querySelector('.thg-loading-bar'); if (!bar) return; bar.style.width = loading ? '75%' : '0'; }
    function showPanel(uiOverlay, id, title){ ['signin','signup','reset','update'].forEach(function(key){ const panel = uiOverlay.querySelector('#thg-panel-'+key); if (panel) panel.hidden = (key !== id); }); const tEl = uiOverlay.querySelector('#thg-auth-title'); if (tEl) tEl.textContent = title; clearError(uiOverlay); }
    function openAuthModal(ui, opts){ state.nextUrl = opts?.next || null; ui.overlay.setAttribute('aria-hidden','false'); showPanel(ui.overlay, 'signin', 'Sign in'); setTimeout(function(){ const el = ui.overlay.querySelector('#thg-si-email'); if (el) el.focus(); }, 0); }
    function closeAuthModal(ui){ ui.overlay.setAttribute('aria-hidden','true'); }
    function bindUI(ui){ ui.btn.addEventListener('click', function(e){ e.preventDefault(); if (state.user && state.user.email){ return; } try { if (window.authGate && typeof window.authGate.openLoginModal === 'function'){ window.authGate.openLoginModal({ next: location.pathname + location.search }); return; } } catch(_){} openAuthModal(ui, { next: location.pathname + location.search }); }); ui.overlay.addEventListener('click', function(e){ if (e.target === ui.overlay) closeAuthModal(ui); }); ui.overlay.querySelector('.thg-auth-close').addEventListener('click', function(){ closeAuthModal(ui); }); const tabSignIn = ui.overlay.querySelector('#thg-tab-signin'); const tabSignUp = ui.overlay.querySelector('#thg-tab-signup'); function selectTab(which){ const a = which==='signin'; tabSignIn.setAttribute('aria-selected', a ? 'true' : 'false'); tabSignUp.setAttribute('aria-selected', a ? 'false' : 'true'); showPanel(ui.overlay, a ? 'signin' : 'signup', a ? 'Sign in' : 'Create account'); const first = ui.overlay.querySelector(a ? '#thg-si-email' : '#thg-su-name'); if (first) first.focus(); } tabSignIn.addEventListener('click', function(){ selectTab('signin'); }); tabSignUp.addEventListener('click', function(){ selectTab('signup'); }); ui.overlay.querySelector('#thg-signin-btn').addEventListener('click', async function(){ if (!state.supabaseReady){ showError(ui.overlay, 'Authentication is not initialized.'); return; } const email = ui.overlay.querySelector('#thg-si-email').value.trim(); const password = ui.overlay.querySelector('#thg-si-password').value; if (!validateEmail(email)) { showError(ui.overlay, 'Enter a valid email.'); return; } if (!password || password.length < 6) { showError(ui.overlay, 'Enter your password.'); return; } clearError(ui.overlay); setModalLoading(ui.overlay, true); try{ const { error } = await window.supabase.auth.signInWithPassword({ email, password }); if (error) { showError(ui.overlay, error.message || 'Failed to sign in.'); } } catch(ex){ showError(ui.overlay, 'Network error. Please try again.'); } finally { setModalLoading(ui.overlay, false); } }); ui.overlay.querySelector('#thg-signup-btn').addEventListener('click', async function(){ if (!state.supabaseReady){ showError(ui.overlay, 'Authentication is not initialized.'); return; } const name = ui.overlay.querySelector('#thg-su-name').value.trim(); const email = ui.overlay.querySelector('#thg-su-email').value.trim(); const password = ui.overlay.querySelector('#thg-su-password').value; if (!validateEmail(email)) { showError(ui.overlay, 'Enter a valid email.'); return; } if (!password || password.length < 8) { showError(ui.overlay, 'Password must be at least 8 characters.'); return; } clearError(ui.overlay); setModalLoading(ui.overlay, true); try{ const { error } = await window.supabase.auth.signUp({ email, password, options: { data: name ? { full_name: name } : {} } }); if (error) { showError(ui.overlay, error.message || 'Failed to create account.'); } else { showError(ui.overlay, 'Check your email to verify your account.'); } } catch(ex){ showError(ui.overlay, 'Network error. Please try again.'); } finally { setModalLoading(ui.overlay, false); } }); }

    async function initSupabase(ui){ state.loading = true; render(ui); if (!window.supabase || !window.supabase.auth){ try { const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'); const client = mod.createClient('https://wedevtjjmdvngyshqdro.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M'); window.supabase = client; } catch(_) {} }
      if (!window.supabase || !window.supabase.auth){ state.supabaseReady = false; state.loading = false; render(ui); return; }
      state.supabaseReady = true; try{ const { data } = await window.supabase.auth.getSession(); state.user = data?.session?.user || null; } catch(_){ state.user = null; } finally { state.loading = false; render(ui); }
    }

    function observeRerenders(){ const mo = new MutationObserver(function(muts){ for (var i=0;i<muts.length;i++){ for (var j=0;j<muts[i].addedNodes.length;j++){ const n = muts[i].addedNodes[j]; if (n.nodeType !== 1) continue; hideLegacyAuthLinks(n); ensureContainer(); } } }); mo.observe(document.documentElement, { childList:true, subtree:true }); }

    ready(function(){ hideLegacyAuthLinks(document); const ui = createUI(); bindUI(ui); observeRerenders(); initSupabase(ui); try { const qp = new URLSearchParams(location.search); const hash = (location.hash || '').trim(); const shouldAutoOpen = (window.AUTH_OPEN_ON_LOAD === true) || qp.has('auth_open') || qp.get('login') === '1' || qp.get('open') === '1' || hash === '#login' || hash === '#signup' || hash === '#auth'; if (shouldAutoOpen) { setTimeout(function(){ try { if (!state.user) { openAuthModal(ui, { next: location.pathname + location.search }); } } catch(_){} }, 0); } } catch(_){ }
    });
  })();
})();

/* Tharaga durable auth head — single-include version
 * Mirrors the working flow in /snippets/index.html
 * Usage: <script src="/js/thg-auth-head.js" defer></script>
 */
;(function(){
  try{ if (window.__thgDurableHeadIncluded) return; window.__thgDurableHeadIncluded = true; } catch(_) {}

  // Defaults (can be overridden by host before this script)
  try { if (typeof window.AUTH_OPEN_ON_LOAD === 'undefined') window.AUTH_OPEN_ON_LOAD = false; } catch(_){}
  try { if (typeof window.AUTH_HIDE_HEADER === 'undefined') window.AUTH_HIDE_HEADER = false; } catch(_){}
  try {
    window.AUTH_NAV = Object.assign({ profile: '/profile', dashboard: '/dashboard' }, window.AUTH_NAV || {});
    if (!window.DURABLE_AUTH_URL) window.DURABLE_AUTH_URL = 'https://auth.tharaga.co.in/login_signup_glassdrop/';
  } catch(_) {}

  // Clean malformed fragments like #https:/auth...
  try {
    var h = (location.hash||'').trim();
    if (/^#https?:\/+/.test(h)) { history.replaceState(null,'',location.href.replace(location.hash,'')); }
  } catch(_) {}

  // Load auth-gate once (iframe modal + cross-tab sync)
  try {
    if (!document.querySelector('script[data-thg-auth-gate]')){
      var s = document.createElement('script');
      s.src = 'https://auth.tharaga.co.in/login_signup_glassdrop/auth-gate.js';
      s.defer = true; s.setAttribute('data-thg-auth-gate','1');
      document.head && document.head.appendChild(s);
    }
  } catch(_){}

  // Inline durable auth header UI (ported from snippets/index.html)
  (function(){
    if (window.__thgAuthInstalledV1) return; window.__thgAuthInstalledV1 = true;

    const AUTH_NAV = Object.assign({ profile: '/profile', dashboard: '/dashboard', settings: null }, window.AUTH_NAV || {});
    const Z_BASE = 2147483000;

    window.authGate = window.authGate || {};
    window.authGate.openLoginModal = function(opts){ (window.__thgOpenAuthModal || function(){ alert('Auth not ready'); })(opts||{}); };

    function headerRoot(){ return document.querySelector('header, [role="banner"], [data-section="header"], .site-header, .Header, nav') || null; }
    function hideLegacyAuthLinks(root){ var scope = (root || document); var selector = 'a[href="#login"], a[href="#signup"], [data-auth-open]'; scope.querySelectorAll(selector).forEach(function(el){ if (el.__thgAuthWired) return; el.__thgAuthWired = true; el.addEventListener('click', function(ev){ try { ev.preventDefault(); var next = location.pathname + location.search; if (window.authGate && typeof window.authGate.openLoginModal === 'function') { window.authGate.openLoginModal({ next }); } else if (typeof window.__thgOpenAuthModal === 'function') { window.__thgOpenAuthModal({ next }); } } catch(_){ } }, { passive:false }); }); }
    function clamp(str, max){ if (!str) return ''; return str.length>max ? str.slice(0,max-1)+'…' : str; }
    function getInitials(user){ const meta = user?.user_metadata || {}; const full = (meta.full_name || meta.name || '').trim(); if (full) { const parts = full.split(/\s+/).filter(Boolean); const first = parts[0]?.[0] || ''; const last = parts.length>1 ? parts[parts.length-1][0] : ''; return (first+last || first || '').toUpperCase() || 'U'; } const email = (user?.email || '').trim(); return email ? email[0].toUpperCase() : 'U'; }
    function getDisplayName(user){ const meta = user?.user_metadata || {}; const name = (meta.full_name || meta.name || meta.username || '').trim(); return name || (user?.email || 'My Account'); }
    function createEl(tag, cls, attrs){ const el = document.createElement(tag); if (cls) el.className = cls; if (attrs) for (var k in attrs) el.setAttribute(k, attrs[k]); return el; }
    function validateEmail(val){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); }
    function ensureContainer(){ let hdr = headerRoot(); let wrap = document.querySelector('.thg-auth-wrap'); if (!wrap){ wrap = document.createElement('div'); wrap.className = 'thg-auth-wrap'; let parent = hdr || document.body; if (hdr) { const cs = getComputedStyle(hdr); if (cs.position === 'static') { hdr.style.position = 'relative'; } parent.appendChild(wrap); } else { wrap.classList.add('is-fixed'); parent.appendChild(wrap); } } return wrap; }

    function injectStyles(){ if (document.getElementById('thg-auth-styles')) return; const css = `
.thg-auth-wrap{ position:absolute; top:14px; right:16px; display:flex; align-items:center; z-index:${Z_BASE}; }
@media (min-width:1024px){ .thg-auth-wrap{ top:16px; right:24px; } }
.thg-auth-wrap.is-fixed{ position:fixed; top:14px; right:16px; }
.thg-auth-btn{ appearance:none;background:transparent;color:#fff;border:1px solid rgba(255,255,255,.9); border-radius:9999px;padding:8px 14px;font-weight:600;cursor:pointer;line-height:1;white-space:nowrap;display:inline-flex;align-items:center;gap:8px; transition:background .15s ease, border-color .15s ease, box-shadow .15s ease; }
.thg-auth-btn:hover{background:rgba(255,255,255,.08)}
.thg-auth-btn:focus-visible{ outline:2px solid #7dd3fc; outline-offset:2px; }
.thg-auth-btn .thg-initial{ width:22px;height:22px;border-radius:9999px;background:#fff;color:#111;display:none;align-items:center;justify-content:center;font-weight:700;font-size:11px; }
.thg-auth-btn.is-auth .thg-initial{ display:inline-flex; }
.thg-auth-btn.is-auth::after{ content:""; display:inline-block; width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid rgba(255,255,255,.9); transition:transform .15s ease; transform-origin:center; }
.thg-auth-btn[aria-expanded="true"].is-auth::after{ transform:rotate(180deg); }
.thg-spinner{ width:14px;height:14px;border-radius:9999px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff; animation:thgspin .8s linear infinite; }
@keyframes thgspin{ to{ transform:rotate(360deg); } }
.thg-auth-menu{ position:absolute;top:calc(100% + 10px);right:0;min-width:280px;background:#0b0b0b;color:#fff; border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:8px;box-shadow:0 12px 30px rgba(0,0,0,.45); visibility:hidden; opacity:0; transform:translateY(-6px) scale(.98); transform-origin:top right; pointer-events:none; transition:opacity .16s ease, transform .16s ease, visibility 0s linear .16s; z-index:${Z_BASE+1}; }
.thg-auth-menu[aria-hidden="false"]{ visibility:visible; opacity:1; transform:translateY(0) scale(1); pointer-events:auto; transition:opacity .16s ease, transform .16s ease, visibility 0s linear 0s; }
.thg-auth-item{ display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;text-decoration:none;color:#fff;cursor:pointer; }
.thg-auth-item:hover{background:rgba(255,255,255,.08)}
.thg-auth-item[tabindex]{outline:none}
.thg-auth-item.is-header{ cursor:default;font-weight:700;opacity:.95; }
.thg-auth-item.is-header:hover{background:transparent}
.thg-auth-sep{ height:1px;background:rgba(255,255,255,.12);margin:6px 8px;border-radius:1px; }
.thg-initial-lg{ width:28px;height:28px;border-radius:9999px;background:#fff;color:#111;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px; }
.thg-name-wrap{ display:flex; flex-direction:column; min-width:0; }
.thg-name{ overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:190px; }
.thg-email{ opacity:.7; font-size:12px; overflow:hidden;text-overflow:ellipsis;white-space:nowrap; max-width:200px; }
.thg-auth-overlay{ position:fixed; inset:0; background:rgba(0,0,0,.55); backdrop-filter:saturate(140%) blur(6px); display:flex; align-items:center; justify-content:center; z-index:${Z_BASE+2}; visibility:hidden; opacity:0; transition:opacity .18s ease, visibility 0s linear .18s; }
.thg-auth-overlay[aria-hidden="false"]{ visibility:visible; opacity:1; transition:opacity .18s ease, visibility 0s linear 0s; }
.thg-auth-modal{ width:100%; max-width:420px; background:linear-gradient(180deg, rgba(20,20,20,.98), rgba(12,12,12,.98)); color:#fff; border:1px solid rgba(255,255,255,.1); border-radius:16px; box-shadow:0 30px 60px rgba(0,0,0,.5); transform:translateY(10px) scale(.98); opacity:0; transition:transform .18s ease, opacity .18s ease; }
.thg-auth-overlay[aria-hidden="false"] .thg-auth-modal{ transform:translateY(0) scale(1); opacity:1; }
.thg-auth-header{ display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border-bottom:1px solid rgba(255,255,255,.08); }
.thg-auth-title{ font-weight:800; font-size:20px; }
.thg-auth-close{ appearance:none; background:linear-gradient(180deg,#f3cd4a,#eab308,#c58a04); border:0; color:#111; cursor:pointer; font-weight:800; width:32px; height:32px; line-height:32px; border-radius:9999px; box-shadow:0 2px 6px rgba(0,0,0,.25); }
.thg-auth-close:hover{ color:#fff; background:linear-gradient(180deg,#eab308,#c58a04,#7a5200); transform:scale(1.06); }
.thg-auth-body{ padding:16px 18px 18px; }
.thg-tabs{ display:flex; gap:6px; background:rgba(255,255,255,.06); padding:4px; border-radius:9999px; margin-bottom:16px; }
.thg-tab{ flex:1; text-align:center; padding:8px 10px; border-radius:9999px; cursor:pointer; font-weight:700; color:#ddd; }
.thg-tab[aria-selected="true"]{ background:#fff; color:#111; }
.thg-field{ display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
.thg-field label{ font-size:12px; opacity:.9; }
.thg-field label[for="thg-si-password"]::after{ content:" (optional — use Magic Link for fastest login)"; color:#9ca3af; font-weight:500; }
.thg-input{ appearance:none; background:#121212; color:#fff; border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:10px 12px; }
.thg-input::placeholder{ color:#6b7280; }
.thg-input:focus{ outline:2px solid #facc15; outline-offset:2px; }
.thg-actions{ display:flex; justify-content:space-between; align-items:center; margin:6px 0 12px; }
.thg-link{ background:none; border:0; color:#22c55e; cursor:pointer; font-size:13px; padding:0; }
.thg-btn-primary{ width:100%; appearance:none; background:linear-gradient(180deg,#f8d34a,#f0b90b,#c89200); color:#111; border:1px solid rgba(250, 204, 21, .9); border-radius:12px; padding:12px 14px; font-weight:800; cursor:pointer; transition:transform .06s ease, box-shadow .06s ease, filter .12s ease; box-shadow:0 4px 0 rgba(250, 204, 21, .35); }
.thg-btn-primary:hover{ filter:brightness(1.03); }
.thg-btn-primary:active{ transform:translateY(1px); box-shadow:none; }
.thg-oauth{ display:grid; grid-template-columns:1fr; gap:10px; margin-top:10px; }
.thg-oauth-btn{ appearance:none; background:#0f0f0f; color:#fff; border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:12px 14px; cursor:pointer; font-weight:800; display:flex; align-items:center; justify-content:center; gap:10px; }
.thg-oauth-btn:hover{ background:#141414; }
.thg-oauth-btn .g-icon{ width:18px; height:18px; }
.thg-oauth-btn.google{ border-color:#333; background:#151515; }
.thg-error{ background:rgba(239,68,68,.12); color:#fecaca; border:1px solid rgba(239,68,68,.35); border-radius:10px; padding:10px 12px; font-size:13px; display:none; }
.thg-hint{ font-size:12px; opacity:.8; }
.thg-loading-bar{ height:2px; width:0; background:#7dd3fc; border-radius:2px; transition:width .2s ease; }
.thg-confirm{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; z-index:${Z_BASE+3}; background:rgba(0,0,0,.55); backdrop-filter:blur(3px); visibility:hidden; opacity:0; transition:opacity .16s ease, visibility 0s linear .16s; }
.thg-confirm[aria-hidden="false"]{ visibility:visible; opacity:1; transition:opacity .16s ease, visibility 0s linear 0s; }
.thg-confirm-card{ width:100%; max-width:360px; background:#141414; color:#fff; border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:16px; box-shadow:0 24px 50px rgba(0,0,0,.5); }
.thg-confirm-actions{ display:flex; gap:10px; justify-content:flex-end; margin-top:12px; }
.thg-btn{ appearance:none; border-radius:10px; padding:8px 12px; cursor:pointer; border:1px solid rgba(255,255,255,.15); background:#0f0f0f; color:#fff; }
.thg-btn-danger{ background:#ef4444; border-color:#ef4444; color:#fff; }
@media (max-width:480px){ .thg-auth-wrap{ top:10px; right:10px; } .thg-auth-modal{ width:calc(100% - 16px); margin:0 8px; } .thg-auth-menu{ right:8px; } }
.thg-tagline{ color:#9ca3af; font-size:13px; margin:-4px 0 12px; }
`; const style = document.createElement('style'); style.id = 'thg-auth-styles'; style.textContent = css; document.head.appendChild(style); }

    function createUI(){
      const wrap = ensureContainer();
      let btn = wrap.querySelector('.thg-auth-btn');
      if (!btn){ btn = createEl('button', 'thg-auth-btn', { type:'button', 'aria-haspopup':'menu', 'aria-expanded':'false', 'aria-label':'Open account menu' }); const avatar = createEl('span', 'thg-initial'); avatar.textContent = 'U'; const label = document.createElement('span'); label.className = 'thg-label'; const spinner = createEl('span','thg-spinner',{'aria-hidden':'true'}); btn.appendChild(avatar); btn.appendChild(label); btn.appendChild(spinner); wrap.appendChild(btn); }
      let menu = wrap.querySelector('.thg-auth-menu');
      if (!menu){ menu = createEl('div', 'thg-auth-menu', { id:'thg-auth-menu', role:'menu', 'aria-hidden':'true' }); menu.innerHTML = '<div class="thg-auth-item is-header" aria-disabled="true">' + '<span class="thg-initial-lg">U</span>' + '<span class="thg-name-wrap">' + '<span class="thg-name">User</span>' + '<span class="thg-email">email@example.com</span>' + '</span>' + '</div>' + '<div class="thg-auth-sep"></div>' + '<div class="thg-auth-item" role="menuitem" tabindex="0" data-action="profile"><span>Profile</span></div>' + '<div class="thg-auth-item" role="menuitem" tabindex="0" data-action="dashboard"><span>Dashboard</span></div>' + (AUTH_NAV.settings ? '<div class="thg-auth-item" role="menuitem" tabindex="0" data-action="settings"><span>Settings</span></div>' : '') + '<div class="thg-auth-item" role="menuitem" tabindex="0" data-action="logout"><span>Logout</span></div>'; wrap.appendChild(menu); }
      btn.setAttribute('aria-controls','thg-auth-menu');
      let overlay = document.querySelector('.thg-auth-overlay');
      if (!overlay){ overlay = createEl('div','thg-auth-overlay',{'aria-hidden':'true','aria-modal':'true','role':'dialog'}); overlay.innerHTML = '\n        <div class="thg-auth-modal" role="document" aria-labelledby="thg-auth-title">\n          <div class="thg-auth-header">\n            <div class="thg-auth-title" id="thg-auth-title">Sign in</div>\n            <button class="thg-auth-close" type="button" aria-label="Close">✕</button>\n          </div>\n          <div class="thg-loading-bar" aria-hidden="true"></div>\n          <div class="thg-auth-body">\n            <div class="thg-tagline">"Browse only approved builder projects — safe, transparent, and verified"</div>\n            <div class="thg-tabs" role="tablist" aria-label="Authentication method">\n              <button class="thg-tab" role="tab" id="thg-tab-signin" aria-controls="thg-panel-signin" aria-selected="true">Sign in</button>\n              <button class="thg-tab" role="tab" id="thg-tab-signup" aria-controls="thg-panel-signup" aria-selected="false">Create account</button>\n            </div>\n            <div class="thg-error" role="alert"></div>\n            <div id="thg-panel-signin" role="tabpanel" aria-labelledby="thg-tab-signin">\n              <div class="thg-field"><label for="thg-si-email">Email</label><input id="thg-si-email" class="thg-input" type="email" autocomplete="email" placeholder="you@example.com" /></div>\n              <div class="thg-field"><label for="thg-si-password">Password</label><input id="thg-si-password" class="thg-input" type="password" autocomplete="current-password" placeholder="Your password" /></div>\n              <div class="thg-actions"><button class="thg-link" type="button" id="thg-forgot">Forgot password?</button><span class="thg-hint"></span></div>\n              <button class="thg-btn-primary" type="button" id="thg-signin-btn">Sign in</button>\n              <div class="thg-oauth"><button class="thg-oauth-btn google" type="button" data-provider="google"><svg class="g-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.2 32.6 29 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 6 1.2 8.1 3.2l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 19-7.3 19-20 0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.6 18.9 14 24 14c3.1 0 6 1.2 8.1 3.2l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5 0 9.6-1.9 13-5.1l-6-5.1C29.9 35.6 27.1 36 24 36c-5 0-9.3-3.4-10.8-8l-6.7 5.1C10 40.2 16.5 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.1-4.6 8-11.3 8-5 0-9.3-3.4-10.8-8l-6.7 5.1C10 40.2 16.5 44 24 44c10 0 19-7.3 19-20 0-1.3-.1-2.7-.4-3.5z"/></svg><span>Continue with Google</span></button></div>\n            </div>\n            <div id="thg-panel-signup" role="tabpanel" aria-labelledby="thg-tab-signup" hidden>\n              <div class="thg-field"><label for="thg-su-name">Full name (optional)</label><input id="thg-su-name" class="thg-input" type="text" autocomplete="name" placeholder="Ada Lovelace" /></div>\n              <div class="thg-field"><label for="thg-su-email">Email</label><input id="thg-su-email" class="thg-input" type="email" autocomplete="email" placeholder="you@example.com" /></div>\n              <div class="thg-field"><label for="thg-su-password">Password</label><input id="thg-su-password" class="thg-input" type="password" autocomplete="new-password" placeholder="At least 8 characters" /></div>\n              <div class="thg-actions"><span class="thg-hint">Use a strong password. You can add name later.</span></div>\n              <button class="thg-btn-primary" type="button" id="thg-signup-btn">Create account</button>\n              <div class="thg-oauth"><button class="thg-oauth-btn google" type="button" data-provider="google"><svg class="g-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.2 32.6 29 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 6 1.2 8.1 3.2l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.6 18.9 14 24 14c3.1 0 6 1.2 8.1 3.2l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5 0 9.6-1.9 13-5.1l-6-5.1C29.9 35.6 27.1 36 24 36c-5 0-9.3-3.4-10.8-8l-6.7 5.1C10 40.2 16.5 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.1-4.6 8-11.3 8-5 0-9.3-3.4-10.8-8l-6.7 5.1C10 40.2 16.5 44 24 44c10 0 19-7.3 19-20 0-1.3-.1-2.7-.4-3.5z"/></svg><span>Sign up with Google</span></button></div>\n            </div>\n            <div id="thg-panel-reset" role="tabpanel" aria-labelledby="thg-tab-reset" hidden>\n              <div class="thg-field"><label for="thg-rp-email">Email</label><input id="thg-rp-email" class="thg-input" type="email" autocomplete="email" placeholder="you@example.com" /></div>\n              <div class="thg-actions"><span class="thg-hint">We’ll email a password reset link.</span></div>\n              <button class="thg-btn-primary" type="button" id="thg-reset-btn">Send reset link</button>\n            </div>\n            <div id="thg-panel-update" role="tabpanel" aria-labelledby="thg-tab-update" hidden>\n              <div class="thg-field"><label for="thg-up-password">New password</label><input id="thg-up-password" class="thg-input" type="password" autocomplete="new-password" placeholder="Enter a new password" /></div>\n              <div class="thg-actions"><span class="thg-hint">You’re recovering your account.</span></div>\n              <button class="thg-btn-primary" type="button" id="thg-update-btn">Update password</button>\n            </div>\n          </div>\n        </div>';
        document.body.appendChild(overlay);
      }

      let confirmEl = document.querySelector('.thg-confirm');
      if (!confirmEl){ confirmEl = createEl('div','thg-confirm',{'aria-hidden':'true','role':'dialog','aria-modal':'true'}); confirmEl.innerHTML = '<div class="thg-confirm-card" role="document">' + '<div class="thg-confirm-msg">Are you sure you want to log out?</div>' + '<div class="thg-confirm-actions">' + '<button type="button" class="thg-btn thg-confirm-cancel">Cancel</button>' + '<button type="button" class="thg-btn thg-btn-danger thg-confirm-ok">Log out</button>' + '</div></div>'; document.body.appendChild(confirmEl); }

      try { if (window.AUTH_HIDE_HEADER === true || window.AUTH_NO_HEADER === true) { const w = document.querySelector('.thg-auth-wrap'); if (w) w.style.display = 'none'; } } catch(_){}
      return { wrap, btn, menu, overlay, confirmEl };
    }

    const state = { user: null, loading: true, nextUrl: null, supabaseReady: false, sub: null };
    function setButtonLoading(ui, isLoading){ const spinner = ui.btn.querySelector('.thg-spinner'); const label = ui.btn.querySelector('.thg-label'); if (isLoading){ ui.btn.classList.remove('is-auth'); if (label) label.textContent = 'Loading…'; if (spinner) spinner.style.display = 'inline-block'; ui.btn.setAttribute('aria-expanded','false'); } else { if (spinner) spinner.style.display = 'none'; } }
    function render(ui){ const label = ui.btn.querySelector('.thg-label'); const avatar = ui.btn.querySelector('.thg-initial'); if (state.loading){ setButtonLoading(ui, true); return; } setButtonLoading(ui, false); if (state.user && state.user.email){ const name = getDisplayName(state.user); ui.btn.classList.add('is-auth'); avatar.textContent = getInitials(state.user); label.textContent = clamp(name, 24); ui.btn.prepend(avatar); const initEl = ui.menu.querySelector('.thg-initial-lg'); const nameEl = ui.menu.querySelector('.thg-name'); const emailEl = ui.menu.querySelector('.thg-email'); if (initEl) initEl.textContent = getInitials(state.user); if (nameEl) nameEl.textContent = clamp(name, 28); if (emailEl) emailEl.textContent = clamp(state.user.email || '', 30); } else { ui.btn.classList.remove('is-auth'); ui.btn.setAttribute('aria-expanded','false'); label.textContent = 'Login / Signup'; avatar.textContent = 'U'; ui.btn.prepend(avatar); closeMenu(ui); } }
    function openMenu(ui){ if (!state.user) return; ui.menu.setAttribute('aria-hidden','false'); ui.btn.setAttribute('aria-expanded','true'); const items = ui.menu.querySelectorAll('.thg-auth-item[role="menuitem"]'); if (items[0]) setTimeout(function(){ items[0].focus(); }, 0); }
    function closeMenu(ui){ ui.menu.setAttribute('aria-hidden','true'); ui.btn.setAttribute('aria-expanded','false'); }
    function toggleMenu(ui){ const isHidden = ui.menu.getAttribute('aria-hidden') === 'true'; if (isHidden) openMenu(ui); else closeMenu(ui); }
    function showError(uiOverlay, msg){ const el = uiOverlay.querySelector('.thg-error'); if (!el) return; el.textContent = msg; el.style.display = 'block'; }
    function clearError(uiOverlay){ const el = uiOverlay.querySelector('.thg-error'); if (!el) return; el.textContent = ''; el.style.display = 'none'; }
    function setModalLoading(uiOverlay, loading){ const bar = uiOverlay.querySelector('.thg-loading-bar'); if (!bar) return; if (loading){ bar.style.width = '75%'; } else { bar.style.width = '0'; } }
    function showPanel(uiOverlay, id, title){ ['signin','signup','reset','update'].forEach(function(key){ const panel = uiOverlay.querySelector('#thg-panel-'+key); if (panel) panel.hidden = (key !== id); }); const tEl = uiOverlay.querySelector('#thg-auth-title'); if (tEl) tEl.textContent = title; clearError(uiOverlay); }
    function openAuthModal(ui, opts){ state.nextUrl = opts?.next || null; ui.overlay.setAttribute('aria-hidden','false'); showPanel(ui.overlay, 'signin', 'Sign in'); setTimeout(function(){ const el = ui.overlay.querySelector('#thg-si-email'); if (el) el.focus(); }, 0); }
    function closeAuthModal(ui){ ui.overlay.setAttribute('aria-hidden','true'); }

    function bindUI(ui){
      ui.btn.addEventListener('click', function(e){ e.preventDefault(); if (state.user && state.user.email){ toggleMenu(ui); } else { try { if (window.authGate && typeof window.authGate.openLoginModal === 'function'){ window.authGate.openLoginModal({ next: location.pathname + location.search }); return; } } catch(_){} openAuthModal(ui, { next: location.pathname + location.search }); } });
      ui.btn.addEventListener('keydown', function(e){ if ((e.key === 'ArrowDown' || e.key === 'Enter') && state.user && state.user.email){ e.preventDefault(); openMenu(ui); } });
      ui.menu.addEventListener('click', function(e){ const item = e.target.closest('.thg-auth-item[role="menuitem"]'); if (!item) return; const act = item.getAttribute('data-action'); if (act === 'profile'){ closeMenu(ui); location.href = AUTH_NAV.profile; return; } if (act === 'dashboard'){ closeMenu(ui); location.href = AUTH_NAV.dashboard; return; } if (act === 'settings' && AUTH_NAV.settings){ closeMenu(ui); location.href = AUTH_NAV.settings; return; } if (act === 'logout'){ closeMenu(ui); const c = document.querySelector('.thg-confirm'); if (c) c.setAttribute('aria-hidden','false'); } });
      document.addEventListener('click', function(e){ if (ui.menu.getAttribute('aria-hidden') === 'true') return; if (!ui.menu.contains(e.target) && e.target !== ui.btn && !ui.btn.contains(e.target)){ closeMenu(ui); } });
      const tabSignIn = ui.overlay.querySelector('#thg-tab-signin'); const tabSignUp = ui.overlay.querySelector('#thg-tab-signup'); function selectTab(which){ const a = which==='signin'; tabSignIn.setAttribute('aria-selected', a ? 'true' : 'false'); tabSignUp.setAttribute('aria-selected', a ? 'false' : 'true'); showPanel(ui.overlay, a ? 'signin' : 'signup', a ? 'Sign in' : 'Create account'); const first = ui.overlay.querySelector(a ? '#thg-si-email' : '#thg-su-name'); if (first) first.focus(); } tabSignIn.addEventListener('click', function(){ selectTab('signin'); }); tabSignUp.addEventListener('click', function(){ selectTab('signup'); }); ui.overlay.addEventListener('click', function(e){ if (e.target === ui.overlay) closeAuthModal(ui); }); ui.overlay.querySelector('.thg-auth-close').addEventListener('click', function(){ closeAuthModal(ui); });
      // Basic actions (password + oauth)
      ui.overlay.querySelector('#thg-signin-btn').addEventListener('click', async function(){ if (!state.supabaseReady){ showError(ui.overlay, 'Authentication is not initialized.'); return; } const email = ui.overlay.querySelector('#thg-si-email').value.trim(); const password = ui.overlay.querySelector('#thg-si-password').value; if (!validateEmail(email)) { showError(ui.overlay, 'Enter a valid email.'); return; } if (!password || password.length < 6) { showError(ui.overlay, 'Enter your password.'); return; } clearError(ui.overlay); setModalLoading(ui.overlay, true); try{ const { error } = await window.supabase.auth.signInWithPassword({ email, password }); if (error) { showError(ui.overlay, error.message || 'Failed to sign in.'); } } catch(ex){ showError(ui.overlay, 'Network error. Please try again.'); } finally { setModalLoading(ui.overlay, false); } });
      ui.overlay.querySelector('#thg-signup-btn').addEventListener('click', async function(){ if (!state.supabaseReady){ showError(ui.overlay, 'Authentication is not initialized.'); return; } const name = ui.overlay.querySelector('#thg-su-name').value.trim(); const email = ui.overlay.querySelector('#thg-su-email').value.trim(); const password = ui.overlay.querySelector('#thg-su-password').value; if (!validateEmail(email)) { showError(ui.overlay, 'Enter a valid email.'); return; } if (!password || password.length < 8) { showError(ui.overlay, 'Password must be at least 8 characters.'); return; } clearError(ui.overlay); setModalLoading(ui.overlay, true); try{ const { error } = await window.supabase.auth.signUp({ email, password, options: { data: name ? { full_name: name } : {} } }); if (error) { showError(ui.overlay, error.message || 'Failed to create account.'); } else { showError(ui.overlay, 'Check your email to verify your account.'); } } catch(ex){ showError(ui.overlay, 'Network error. Please try again.'); } finally { setModalLoading(ui.overlay, false); } });
      ui.overlay.querySelectorAll('.thg-oauth-btn').forEach(function(btn){ btn.addEventListener('click', async function(){ const provider = btn.getAttribute('data-provider'); try { if (provider === 'google' && window.authGate && typeof window.authGate.openLoginModal === 'function'){ closeAuthModal(ui); window.authGate.openLoginModal({ next: location.pathname + location.search }); return; } } catch(_){} if (!state.supabaseReady){ showError(ui.overlay, 'Authentication is not initialized.'); return; } clearError(ui.overlay); setModalLoading(ui.overlay, true); try{ const redirectTo = location.origin + location.pathname + location.search; const { data, error } = await window.supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } } }); if (error) { const msg = /provider is not enabled/i.test(error.message||'') ? 'Google sign-in is not available yet.' : (error.message || 'Could not start sign in.'); showError(ui.overlay, msg); setModalLoading(ui.overlay, false); return; } if (data && data.url){ location.href = data.url; } else { setModalLoading(ui.overlay, false); showError(ui.overlay, 'Could not start ' + provider + ' sign in.'); } } catch(ex){ showError(ui.overlay, 'Failed to start ' + provider + ' sign in.'); setModalLoading(ui.overlay, false); } }); });
      const confirmEl = document.querySelector('.thg-confirm');
      confirmEl?.querySelector('.thg-confirm-cancel')?.addEventListener('click', function(){ confirmEl.setAttribute('aria-hidden','true'); });
      confirmEl?.querySelector('.thg-confirm-ok')?.addEventListener('click', async function(){ try { await window.supabase?.auth?.signOut?.(); } catch(_){ } confirmEl.setAttribute('aria-hidden','true'); });
      window.__thgOpenAuthModal = function(opts){ openAuthModal(ui, opts); };
    }

    async function initSupabase(ui){ state.loading = true; render(ui); if (!window.supabase || !window.supabase.auth){ try { const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'); const client = mod.createClient('https://wedevtjjmdvngyshqdro.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M'); window.supabase = client; } catch(_) {} } if (!window.supabase || !window.supabase.auth){ state.supabaseReady = false; state.loading = false; render(ui); console.warn('[thg-auth] window.supabase not found.'); return; } state.supabaseReady = true; try{ const { data } = await window.supabase.auth.getSession(); state.user = data?.session?.user || null; } catch(_){ state.user = null; } finally { state.loading = false; render(ui); }
      try{ const { data: sub } = window.supabase.auth.onAuthStateChange(function(event, session){ state.user = session?.user || null; render(ui); if (event === 'PASSWORD_RECOVERY'){ const overlay = document.querySelector('.thg-auth-overlay'); overlay && overlay.setAttribute('aria-hidden','false'); } if (state.user && state.user.email){ /* close on success */ try { const ov = document.querySelector('.thg-auth-overlay'); ov && ov.setAttribute('aria-hidden','true'); } catch(_){} } }); state.sub = sub?.subscription || sub || null; } catch(_){ }
    }

    function observeRerenders(){ const mo = new MutationObserver(function(muts){ for (var i=0;i<muts.length;i++){ for (var j=0;j<muts[i].addedNodes.length;j++){ const n = muts[i].addedNodes[j]; if (n.nodeType !== 1) continue; hideLegacyAuthLinks(n); ensureContainer(); } } }); mo.observe(document.documentElement, { childList:true, subtree:true }); }

    function boot(){ hideLegacyAuthLinks(document); injectStyles(); const ui = createUI(); bindUI(ui); observeRerenders(); initSupabase(ui);
      try { const qp = new URLSearchParams(location.search); const hash = (location.hash || '').trim(); const shouldAutoOpen = (window.AUTH_OPEN_ON_LOAD === true) || qp.has('auth_open') || qp.get('login') === '1' || qp.get('open') === '1' || hash === '#login' || hash === '#signup' || hash === '#auth'; if (shouldAutoOpen) { setTimeout(function(){ try { if (!state.user) { openAuthModal(ui, { next: location.pathname + location.search }); } } catch(_){} }, 0); } } catch(_){ }
      window.addEventListener('message', function(ev){ try { var data = ev && ev.data; if (!data || typeof data !== 'object') return; if (data.type === 'open_login_modal' || data.type === 'auth_open' || data.type === 'login_open' || data.type === 'trigger_header_login'){ if (state && state.user && state.user.email) { return; } openAuthModal(ui, { next: data.next || (location.pathname + location.search) }); } } catch(_){ } });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
  })();
})();
