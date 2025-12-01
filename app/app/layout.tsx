import './globals.css'
import './mobile-responsive.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Playfair_Display, Plus_Jakarta_Sans, Manrope } from 'next/font/google'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Tharaga — Premium Real Estate',
  description: 'AI-powered real estate assistant',
}

import { AppI18nProvider } from '@/components/providers/AppI18nProvider'
import { EntitlementsProvider } from '@/components/ui/FeatureGate'
import MobileBottomNav from '@/components/MobileBottomNav'
import { PrefetchRoutes } from '@/components/providers/PrefetchRoutes'
import { HeaderLinkInterceptor } from '@/components/HeaderLinkInterceptor'
import { NotificationProvider } from '@/contexts/NotificationContext'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-playfair',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${plusJakarta.variable} ${manrope.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
        {/* Auth configuration */}
        <Script id="auth-config" strategy="beforeInteractive">
          {`window.AUTH_HIDE_HEADER=false;window.AUTH_OPEN_ON_LOAD=false;`}
        </Script>
        {/* Load role manager system SYNCHRONOUSLY to ensure it's available before auth system */}
        <Script src="/role-manager-v2.js" strategy="beforeInteractive" />
        {/* PREVENT DARK DROPDOWN - Inject light theme styles BEFORE auth system */}
        {/* This prevents auth system's injectStyles() from injecting dark #0b0b0b styles */}
        <style id="thg-auth-styles" dangerouslySetInnerHTML={{ __html: `
          /* Light theme auth styles - prevents dark dropdown injection */
          .thg-auth-wrap{ display:flex; align-items:center; position:relative; z-index:2147483000; }
          header .thg-auth-wrap:not(#site-header-auth-container){ position:absolute; top:14px; right:16px; }
          @media (min-width:1024px){ header .thg-auth-wrap:not(#site-header-auth-container){ top:16px; right:24px; } }
          .thg-auth-wrap.is-fixed{ position:fixed; top:14px; right:16px; }
          .thg-auth-btn{ appearance:none;background:transparent;color:#1e40af;border:1px solid rgba(30,64,175,.20); border-radius:9999px;padding:8px 14px;font-weight:600;cursor:pointer;line-height:1;white-space:nowrap;display:inline-flex;align-items:center;gap:8px; transition:background .15s ease, border-color .15s ease, box-shadow .15s ease; }
          .thg-auth-btn:hover{background:rgba(30,64,175,.15)}
          .thg-auth-btn:focus-visible{ outline:2px solid #7dd3fc; outline-offset:2px; }
          .thg-auth-btn .thg-initial{ width:22px;height:22px;border-radius:9999px;background:#1e40af;color:#fff;display:none;align-items:center;justify-content:center;font-weight:700;font-size:11px; }
          .thg-auth-btn.is-auth .thg-initial{ display:inline-flex; }
          .thg-auth-btn.is-auth::after{ content:""; display:inline-block; width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #1e40af; transition:transform .15s ease; transform-origin:center; }
          .thg-auth-btn[aria-expanded="true"].is-auth::after{ transform:rotate(180deg); }
          .thg-spinner{ width:14px;height:14px;border-radius:9999px;border:2px solid rgba(30,64,175,.35);border-top-color:#1e40af; animation:thgspin .8s linear infinite; }
          @keyframes thgspin{ to{ transform:rotate(360deg); } }
          /* Account menu - LIGHT THEME (override dark #0b0b0b) */
          .thg-auth-menu{ position:absolute;top:calc(100% + 10px);right:0;min-width:280px;background:linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.98));backdrop-filter: blur(16px) saturate(1.5);-webkit-backdrop-filter: blur(16px) saturate(1.5);color:#111; border:1px solid rgba(30,64,175,.12);border-radius:12px;padding:12px 8px 8px;box-shadow:0 18px 40px rgba(30,64,175,.16); visibility:hidden; opacity:0; transform:translateY(-6px) scale(.98); transform-origin:top right; pointer-events:none; transition:opacity .16s ease, transform .16s ease, visibility 0s linear .16s; z-index:2147483001; }
          .thg-auth-menu::before{ content:""; position:absolute; top:0; left:0; right:0; height:3px; border-radius:12px 12px 0 0; background:linear-gradient(90deg, #d4af37, #1e40af); }
          .thg-auth-menu[aria-hidden="false"]{ visibility:visible; opacity:1; transform:translateY(0) scale(1); pointer-events:auto; transition:opacity .16s ease, transform .16s ease, visibility 0s linear 0s; }
          .thg-auth-item{ display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;text-decoration:none;color:#111;cursor:pointer; }
          .thg-auth-item:hover{background:linear-gradient(90deg, rgba(30,64,175,.12), rgba(59,130,246,.06));color:#1e40af;}
          .thg-auth-item[tabindex]{outline:none}
          .thg-auth-item.is-header{ cursor:default;font-weight:700;opacity:1; color:#111; }
          .thg-auth-item.is-header:hover{background:transparent}
          .thg-auth-sep{ height:1px;background:rgba(30,64,175,.14);margin:6px 8px;border-radius:1px; }
          .thg-initial-lg{ width:28px;height:28px;border-radius:9999px;background:#1e40af;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px; }
          .thg-name-wrap{ display:flex; flex-direction:column; min-width:0; }
          .thg-name{ overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:190px; color:#111; }
          .thg-email{ opacity:.7; font-size:12px; overflow:hidden;text-overflow:ellipsis;white-space:nowrap; max-width:200px; color:#64748b; }
          @media (max-width:480px){
            .thg-auth-wrap{ top:10px; right:10px; }
            .thg-auth-modal{ width:calc(100% - 16px); margin:0 8px; }
            .thg-auth-menu{ right:8px; }
          }
        ` }} />
        {/* Auth system - directly embedded from snippets/index.html */}
        <Script id="auth-system" strategy="beforeInteractive">
          {`
// Durable top-right authentication header and modal (Supabase-based)
// Works standalone when pasted into Durable Head Code
(function(){
  if (window.__thgAuthInstalledV1) return; window.__thgAuthInstalledV1 = true;

  const AUTH_NAV = Object.assign({ profile: '/profile', dashboard: '/dashboard', settings: null }, window.AUTH_NAV || {});
  const Z_BASE = 2147483000;

  window.authGate = window.authGate || {};
  window.authGate.openLoginModal = function(opts){ (window.__thgOpenAuthModal || function(){ alert('Auth not ready'); })(opts||{}); };

  function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',fn,{once:true});} else { fn(); } }
  function headerRoot(){ return document.querySelector('header, [role="banner"], [data-section="header"], .site-header, .Header, nav') || null; }
  // Instead of hiding legacy/login links, wire them to open the modal directly
  function hideLegacyAuthLinks(root){
    var scope = (root || document);
    var selector = 'a[href="#login"], a[href="#signup"], [data-auth-open]';
    scope.querySelectorAll(selector).forEach(function(el){
      if (el.__thgAuthWired) return;
      el.__thgAuthWired = true;
      el.addEventListener('click', function(ev){
        try {
          ev.preventDefault();
          // Always open the modal directly; never click the header button, to avoid
          // accidentally toggling the account dropdown when the user is already signed in.
          var next = location.pathname + location.search;
          if (window.authGate && typeof window.authGate.openLoginModal === 'function') {
            window.authGate.openLoginModal({ next });
          } else if (typeof window.__thgOpenAuthModal === 'function') {
            window.__thgOpenAuthModal({ next });
          }
        } catch(_){ }
      }, { passive:false });
    });
  }
  function clamp(str, max){ if (!str) return ''; return str.length>max ? str.slice(0,max-1)+'…' : str; }
  function getInitials(user){
    const meta = user?.user_metadata || {};
    const full = (meta.full_name || meta.name || '').trim();
    if (full) {
      const parts = full.split(/\\s+/).filter(Boolean);
      const first = parts[0]?.[0] || '';
      const last = parts.length>1 ? parts[parts.length-1][0] : '';
      return (first+last || first || '').toUpperCase() || 'U';
    }
    const email = (user?.email || '').trim();
    return email ? email[0].toUpperCase() : 'U';
  }
  function getDisplayName(user){
    const meta = user?.user_metadata || {};
    const name = (meta.full_name || meta.name || meta.username || '').trim();
    return name || (user?.email || 'My Account');
  }
  // Keep buyer-form email field in sync with header auth state (same-page or embedded)
  function lockBuyerEmailInBuyerForm(email){
    try {
      const scope = document.getElementById('buyerForm') || document;
      const emailInput = scope && scope.querySelector('#buyerForm [name="email"], form#buyerForm input[name="email"]');
      if (!emailInput) return;
      emailInput.value = email || '';
      emailInput.setAttribute('data-session-email', email || '');
      emailInput.readOnly = true; emailInput.setAttribute('aria-readonly','true');
      emailInput.disabled = true;
      try { emailInput.setAttribute('autocomplete','off'); emailInput.setAttribute('autocapitalize','off'); emailInput.setAttribute('spellcheck','false'); } catch(_){}
      // create/update hidden mirror used for submission
      let hidden = document.getElementById('buyer-email-hidden');
      if (!hidden){ hidden = document.createElement('input'); hidden.type='hidden'; hidden.name='email'; hidden.id='buyer-email-hidden'; emailInput.parentElement && emailInput.parentElement.appendChild(hidden); }
      hidden.value = email || '';
      // prevent duplicate name submission
      if (emailInput.getAttribute('name')) { emailInput.setAttribute('data-original-name','email'); emailInput.removeAttribute('name'); }
    } catch(_){}
  }
  function unlockBuyerEmailInBuyerForm(){
    try {
      const scope = document.getElementById('buyerForm') || document;
      const emailInput = scope && scope.querySelector('#buyerForm [data-session-email], form#buyerForm input[aria-readonly]');
      if (!emailInput) return;
      try { emailInput.readOnly = false; emailInput.disabled = false; emailInput.removeAttribute('aria-readonly'); emailInput.removeAttribute('data-session-email'); } catch(_){}
      try { if (!emailInput.getAttribute('name')) emailInput.setAttribute('name', emailInput.getAttribute('data-original-name') || 'email'); } catch(_){}
      const hidden = document.getElementById('buyer-email-hidden'); if (hidden && hidden.parentElement) hidden.parentElement.removeChild(hidden);
    } catch(_){}
  }
  function setBuyerEmailLockFromUser(user){
    try { if (user && user.email) lockBuyerEmailInBuyerForm(user.email); else unlockBuyerEmailInBuyerForm(); } catch(_){}
  }
  function createEl(tag, cls, attrs){ const el = document.createElement(tag); if (cls) el.className = cls; if (attrs) for (var k in attrs) el.setAttribute(k, attrs[k]); return el; }
  function validateEmail(val){ return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(val); }
  function ensureContainer(){
    // First, try to use the SiteHeader's dedicated container
    let wrap = document.getElementById('site-header-auth-container');
    if (wrap) {
      // ADD thg-auth-wrap class while PRESERVING the ID and any existing classes
      if (!wrap.classList.contains('thg-auth-wrap')) {
        wrap.classList.add('thg-auth-wrap');
      }
      return wrap;
    }

    // Fallback: create wrapper in header or body (original behavior)
    wrap = document.querySelector('.thg-auth-wrap');
    if (!wrap){
      wrap = document.createElement('div');
      wrap.className = 'thg-auth-wrap';
      let hdr = headerRoot();
      let parent = hdr || document.body;
      if (hdr) { const cs = getComputedStyle(hdr); if (cs.position === 'static') { hdr.style.position = 'relative'; } parent.appendChild(wrap); }
      else { wrap.classList.add('is-fixed'); parent.appendChild(wrap); }
    }
    return wrap;
  }

  function injectStyles(){
    if (document.getElementById('thg-auth-styles')) return;
  const css = \`
/* Auth wrapper - positioned by header or falls back to absolute */
.thg-auth-wrap{ display:flex; align-items:center; position:relative; z-index:\${Z_BASE}; }
/* When #site-header-auth-container exists, it's positioned by StaticHeaderHTML inline styles */
/* Fallback: absolute positioning when created dynamically outside SiteHeader */
.thg-auth-wrap:not(#site-header-auth-container){ position:absolute; top:14px; right:16px; }
@media (min-width:1024px){ .thg-auth-wrap:not(#site-header-auth-container){ top:16px; right:24px; } }
.thg-auth-wrap.is-fixed{ position:fixed; top:14px; right:16px; }

/* Header button */
.thg-auth-btn{ appearance:none;background:transparent;color:#fff;border:1px solid rgba(255,255,255,.9); border-radius:9999px;padding:8px 14px;font-weight:600;cursor:pointer;line-height:1;white-space:nowrap;display:inline-flex;align-items:center;gap:8px; transition:background .15s ease, border-color .15s ease, box-shadow .15s ease; }
.thg-auth-btn:hover{background:rgba(255,255,255,.08)}
.thg-auth-btn:focus-visible{ outline:2px solid #7dd3fc; outline-offset:2px; }
.thg-auth-btn .thg-initial{ width:22px;height:22px;border-radius:9999px;background:#fff;color:#111;display:none;align-items:center;justify-content:center;font-weight:700;font-size:11px; }
.thg-auth-btn.is-auth .thg-initial{ display:inline-flex; }
.thg-auth-btn.is-auth::after{ content:""; display:inline-block; width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid rgba(255,255,255,.9); transition:transform .15s ease; transform-origin:center; }
.thg-auth-btn[aria-expanded="true"].is-auth::after{ transform:rotate(180deg); }
.thg-spinner{ width:14px;height:14px;border-radius:9999px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff; animation:thgspin .8s linear infinite; }
@keyframes thgspin{ to{ transform:rotate(360deg); } }

/* Account menu */
.thg-auth-menu{ position:absolute;top:calc(100% + 10px);right:0;min-width:280px;background:#0b0b0b;color:#fff; border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:8px;box-shadow:0 12px 30px rgba(0,0,0,.45); visibility:hidden; opacity:0; transform:translateY(-6px) scale(.98); transform-origin:top right; pointer-events:none; transition:opacity .16s ease, transform .16s ease, visibility 0s linear .16s; z-index:\${Z_BASE+1}; }
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

/* Modal */
.thg-auth-overlay{ position:fixed; inset:0; background:rgba(0,0,0,.55); backdrop-filter:saturate(140%) blur(6px); display:flex; align-items:center; justify-content:center; z-index:\${Z_BASE+2}; visibility:hidden; opacity:0; transition:opacity .18s ease, visibility 0s linear .18s; }
.thg-auth-overlay[aria-hidden="false"]{ visibility:visible; opacity:1; transition:opacity .18s ease, visibility 0s linear 0s; }
.thg-auth-modal{ width:100%; max-width:420px; background:linear-gradient(180deg, rgba(20,20,20,.98), rgba(12,12,12,.98)); color:#fff; border:1px solid rgba(255,255,255,.1); border-radius:16px; box-shadow:0 30px 60px rgba(0,0,0,.5); transform:translateY(10px) scale(.98); opacity:0; transition:transform .18s ease, opacity .18s ease; }
.thg-auth-overlay[aria-hidden="false"] .thg-auth-modal{ transform:translateY(0) scale(1); opacity:1; }
.thg-auth-header{ display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border-bottom:1px solid rgba(255,255,255,.08); }
.thg-auth-title{ font-weight:800; font-size:20px; }
.thg-auth-close{ appearance:none; background:linear-gradient(180deg,#f3cd4a,#eab308,#c58a04); border:0; color:#111; cursor:pointer; font-weight:800; width:32px; height:32px; line-height:32px; border-radius:9999px; box-shadow:0 2px 6px rgba(0,0,0,.25); }
.thg-auth-close:hover{ color:#fff; background:linear-gradient(180deg,#eab308,#c58a04,#7a5200); transform:scale(1.06); }
.thg-auth-body{ padding:16px 18px 18px; }

/* Tabs */
.thg-tabs{ display:flex; gap:6px; background:rgba(255,255,255,.06); padding:4px; border-radius:9999px; margin-bottom:16px; }
.thg-tab{ flex:1; text-align:center; padding:8px 10px; border-radius:9999px; cursor:pointer; font-weight:700; color:#ddd; }
.thg-tab[aria-selected="true"]{ background:#fff; color:#111; }

/* Fields */
.thg-field{ display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
.thg-field label{ font-size:12px; opacity:.9; }
.thg-field label[for="thg-si-password"]::after{ content:" (optional — use Magic Link for fastest login)"; color:#9ca3af; font-weight:500; }
.thg-input{ appearance:none; background:#121212; color:#fff; border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:10px 12px; }
.thg-input::placeholder{ color:#6b7280; }
.thg-input:focus{ outline:2px solid #facc15; outline-offset:2px; }

/* Actions and links */
.thg-actions{ display:flex; justify-content:space-between; align-items:center; margin:6px 0 12px; }
.thg-link{ background:none; border:0; color:#22c55e; cursor:pointer; font-size:13px; padding:0; }

/* Primary CTA (yellow) */
.thg-btn-primary{ width:100%; appearance:none; background:linear-gradient(180deg,#f8d34a,#f0b90b,#c89200); color:#111; border:1px solid rgba(250, 204, 21, .9); border-radius:12px; padding:12px 14px; font-weight:800; cursor:pointer; transition:transform .06s ease, box-shadow .06s ease, filter .12s ease; box-shadow:0 4px 0 rgba(250, 204, 21, .35); }
.thg-btn-primary:hover{ filter:brightness(1.03); }
.thg-btn-primary:active{ transform:translateY(1px); box-shadow:none; }

/* OAuth / secondary buttons */
.thg-oauth{ display:grid; grid-template-columns:1fr; gap:10px; margin-top:10px; }
.thg-oauth-btn{ appearance:none; background:#0f0f0f; color:#fff; border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:12px 14px; cursor:pointer; font-weight:800; display:flex; align-items:center; justify-content:center; gap:10px; }
.thg-oauth-btn:hover{ background:#141414; }
.thg-oauth-btn .g-icon{ width:18px; height:18px; }
.thg-oauth-btn.google{ border-color:#333; background:#151515; }

/* Errors, hints, loading */
.thg-error{ background:rgba(239,68,68,.12); color:#fecaca; border:1px solid rgba(239,68,68,.35); border-radius:10px; padding:10px 12px; font-size:13px; display:none; }
.thg-hint{ font-size:12px; opacity:.8; }
.thg-loading-bar{ height:2px; width:0; background:#7dd3fc; border-radius:2px; transition:width .2s ease; }

/* Confirm dialog */
.thg-confirm{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; z-index:\${Z_BASE+3}; background:rgba(0,0,0,.55); backdrop-filter:blur(3px); visibility:hidden; opacity:0; transition:opacity .16s ease, visibility 0s linear .16s; }
.thg-confirm[aria-hidden="false"]{ visibility:visible; opacity:1; transition:opacity .16s ease, visibility 0s linear 0s; }
.thg-confirm-card{ width:100%; max-width:360px; background:#141414; color:#fff; border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:16px; box-shadow:0 24px 50px rgba(0,0,0,.5); }
.thg-confirm-actions{ display:flex; gap:10px; justify-content:flex-end; margin-top:12px; }
.thg-btn{ appearance:none; border-radius:10px; padding:8px 12px; cursor:pointer; border:1px solid rgba(255,255,255,.15); background:#0f0f0f; color:#fff; }
.thg-btn-danger{ background:#ef4444; border-color:#ef4444; color:#fff; }

/* Responsive */
@media (max-width:480px){
  .thg-auth-wrap{ top:10px; right:10px; }
  .thg-auth-modal{ width:calc(100% - 16px); margin:0 8px; }
  .thg-auth-menu{ right:8px; }
}

/* tagline styling */
.thg-tagline{ color:#9ca3af; font-size:13px; margin:-4px 0 12px; }
\`;
    const style = document.createElement('style');
    style.id = 'thg-auth-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function createUI(){
    const wrap = ensureContainer();
    let btn = wrap.querySelector('.thg-auth-btn');
    if (!btn){
      btn = createEl('button', 'thg-auth-btn', { type:'button', 'aria-haspopup':'menu', 'aria-expanded':'false', 'aria-label':'Open account menu' });
      const avatar = createEl('span', 'thg-initial');
      avatar.textContent = 'U';
      const label = document.createElement('span');
      label.className = 'thg-label';
      const spinner = createEl('span','thg-spinner',{'aria-hidden':'true'});
      btn.appendChild(avatar); btn.appendChild(label); btn.appendChild(spinner);
      wrap.appendChild(btn);
    }

    let menu = wrap.querySelector('.thg-auth-menu');
    if (!menu){
      menu = createEl('div', 'thg-auth-menu', { id:'thg-auth-menu', role:'menu', 'aria-hidden':'true' });
      menu.innerHTML = '<div class="thg-auth-item is-header" aria-disabled="true">' +
        '<span class="thg-initial-lg">U</span>' +
        '<span class="thg-name-wrap">' +
        '<span class="thg-name">User</span>' +
        '<span class="thg-email">email@example.com</span>' +
        '</span>' +
        '</div>' +
        '<div class="thg-auth-sep"></div>' +
        '<div class="thg-auth-item" role="menuitem" tabindex="0" data-action="profile"><span>Profile</span></div>' +
        '<div class="thg-auth-item" role="menuitem" tabindex="0" data-action="dashboard"><span>Dashboard</span></div>' +
        (AUTH_NAV.settings ? '<div class="thg-auth-item" role="menuitem" tabindex="0" data-action="settings"><span>Settings</span></div>' : '') +
        '<div class="thg-auth-item" role="menuitem" tabindex="0" data-action="logout"><span>Logout</span></div>';
      wrap.appendChild(menu);
    }
    btn.setAttribute('aria-controls','thg-auth-menu');

    // MODAL REMOVED - Login/Signup now redirects to /login page
    // No overlay/modal creation - completely removed

    let confirmEl = document.querySelector('.thg-confirm');
    if (!confirmEl){
      confirmEl = createEl('div','thg-confirm',{'aria-hidden':'true','role':'dialog','aria-modal':'true'});
      confirmEl.innerHTML = '<div class="thg-confirm-card" role="document">' +
        '<div class="thg-confirm-msg">Are you sure you want to log out?</div>' +
        '<div class="thg-confirm-actions">' +
        '<button type="button" class="thg-btn thg-confirm-cancel">Cancel</button>' +
        '<button type="button" class="thg-btn thg-btn-danger thg-confirm-ok">Log out</button>' +
        '</div></div>';
      document.body.appendChild(confirmEl);
    }

    // Respect global flag to hide the header button completely
    try {
      if (window.AUTH_HIDE_HEADER === true || window.AUTH_NO_HEADER === true) {
        if (wrap) wrap.style.display = 'none';
      }
    } catch(_){}
    return { wrap, btn, menu, overlay: null, confirmEl };
  }

  const state = { user: null, loading: true, nextUrl: null, supabaseReady: false, sub: null };

  function setButtonLoading(ui, isLoading){ const spinner = ui.btn.querySelector('.thg-spinner'); const label = ui.btn.querySelector('.thg-label'); if (isLoading){ ui.btn.classList.remove('is-auth'); if (label) label.textContent = 'Loading…'; if (spinner) spinner.style.display = 'inline-block'; ui.btn.setAttribute('aria-expanded','false'); } else { if (spinner) spinner.style.display = 'none'; } }

  function render(ui){
    const label = ui.btn.querySelector('.thg-label');
    const avatar = ui.btn.querySelector('.thg-initial');
    if (state.loading){ setButtonLoading(ui, true); return; }
    setButtonLoading(ui, false);
    if (state.user && state.user.email){
      const name = getDisplayName(state.user);
      ui.btn.classList.add('is-auth');
      avatar.textContent = getInitials(state.user);
      label.textContent = clamp(name, 24);
      ui.btn.prepend(avatar);
      const initEl = ui.menu.querySelector('.thg-initial-lg');
      const nameEl = ui.menu.querySelector('.thg-name');
      const emailEl = ui.menu.querySelector('.thg-email');
      if (initEl) initEl.textContent = getInitials(state.user);
      if (nameEl) nameEl.textContent = clamp(name, 28);
      if (emailEl) emailEl.textContent = clamp(state.user.email || '', 30);
    } else {
      ui.btn.classList.remove('is-auth');
      ui.btn.setAttribute('aria-expanded','false');
      label.textContent = 'Login / Signup';
      avatar.textContent = 'U';
      ui.btn.prepend(avatar);
      closeMenu(ui);
    }
  }

  function openMenu(ui){ if (!state.user) return; ui.menu.setAttribute('aria-hidden','false'); ui.btn.setAttribute('aria-expanded','true'); const items = ui.menu.querySelectorAll('.thg-auth-item[role="menuitem"]'); if (items[0]) setTimeout(function(){ items[0].focus(); }, 0); }
  function closeMenu(ui){ ui.menu.setAttribute('aria-hidden','true'); ui.btn.setAttribute('aria-expanded','false'); }
  function toggleMenu(ui){ const isHidden = ui.menu.getAttribute('aria-hidden') === 'true'; if (isHidden) openMenu(ui); else closeMenu(ui); }

  // Use iframe modal from auth-gate.js if available, otherwise fallback to new window
  function openAuthModal(ui, opts){
    const next = opts?.next || location.pathname + location.search;
    // Prefer iframe modal from auth-gate.js
    if (window.authGate && typeof window.authGate.openLoginModal === 'function') {
      try {
        window.authGate.openLoginModal({ next });
        return;
      } catch(e) {
        console.warn('[thg-auth] auth-gate modal failed, using fallback:', e);
      }
    }
    // Fallback to new window if auth-gate not available
    const base = window.DURABLE_AUTH_URL || 'https://auth.tharaga.co.in/login_signup_glassdrop/';
    const url = new URL(base);
    url.searchParams.set('next', next);
    window.open(url.toString(), 'tharaga-auth', 'width=480,height=640,scrollbars=yes,resizable=yes');
  }
  function closeAuthModal(ui){ 
    // Use auth-gate close if available
    if (window.authGate && typeof window.authGate.closeLoginModal === 'function') {
      try {
        window.authGate.closeLoginModal();
        return;
      } catch(e) {}
    }
  }

  // Don't override auth-gate functions - let them handle the modal
  // Only set fallback if auth-gate is not available
  if (!window.authGate || typeof window.authGate.openLoginModal !== 'function') {
    window.authGate = window.authGate || {};
    window.authGate.openLoginModal = function(opts) {
      const next = opts?.next || location.pathname + location.search;
      const base = window.DURABLE_AUTH_URL || 'https://auth.tharaga.co.in/login_signup_glassdrop/';
      const url = new URL(base);
      url.searchParams.set('next', next);
      window.open(url.toString(), 'tharaga-auth', 'width=480,height=640,scrollbars=yes,resizable=yes');
    };
  }
  
  // Set __thgOpenAuthModal as alias to auth-gate if available
  if (window.authGate && typeof window.authGate.openLoginModal === 'function') {
    window.__thgOpenAuthModal = function(opts) {
      window.authGate.openLoginModal(opts);
    };
  } else if (!window.__thgOpenAuthModal) {
    window.__thgOpenAuthModal = function(opts) {
      const next = opts?.next || location.pathname + location.search;
      const base = window.DURABLE_AUTH_URL || 'https://auth.tharaga.co.in/login_signup_glassdrop/';
      const url = new URL(base);
      url.searchParams.set('next', next);
      window.open(url.toString(), 'tharaga-auth', 'width=480,height=640,scrollbars=yes,resizable=yes');
    };
  }
  function openConfirm(ui){ ui.confirmEl.setAttribute('aria-hidden','false'); }
  // Broadcast current auth state (email only) to child iframes, sibling tabs, and embedded forms
  function broadcastAuth(user){
    var loggedIn = !!(user && user.email);
    try { window.__authGateLoggedIn = loggedIn; } catch(_) {}
    try {
      localStorage.setItem('__tharaga_magic_continue', JSON.stringify({ user: loggedIn ? { email: user.email } : null, ts: Date.now() }));
    } catch(_) {}
    try {
      var evtType = loggedIn ? 'THARAGA_AUTH_SUCCESS' : 'THARAGA_AUTH_SIGNED_OUT';
      if ('BroadcastChannel' in window){
        window.__thgAuthBC = window.__thgAuthBC || new BroadcastChannel('tharaga-auth');
        window.__thgAuthBC.postMessage(loggedIn ? { type: evtType, user: { email: user.email } } : { type: evtType });
      }
    } catch(_) {}
    try {
      var payload = loggedIn ? { type: 'THARAGA_AUTH_SUCCESS', user: { email: user.email } } : { type: 'THARAGA_AUTH_SIGNED_OUT' };
      // Notify any embedded iframes (cross-origin safe via postMessage)
      var iframes = document.querySelectorAll('iframe');
      for (var i=0;i<iframes.length;i++){
        try { iframes[i].contentWindow && iframes[i].contentWindow.postMessage(payload, '*'); } catch(__) {}
      }
      // If this page itself is inside an iframe, also notify parent
      try { if (window.parent && window.parent !== window) window.parent.postMessage(payload, '*'); } catch(__) {}
    } catch(_) {}
  }
  function closeConfirm(ui){ ui.confirmEl.setAttribute('aria-hidden','true'); }

  function bindUI(ui){
    ui.btn.addEventListener('click', function(e){ e.preventDefault(); if (state.user && state.user.email){ toggleMenu(ui); } else { openAuthModal(ui, { next: location.pathname + location.search }); } });
    ui.btn.addEventListener('keydown', function(e){ if ((e.key === 'ArrowDown' || e.key === 'Enter') && state.user && state.user.email){ e.preventDefault(); openMenu(ui); } });
    ui.menu.addEventListener('click', function(e){ const item = e.target.closest('.thg-auth-item[role="menuitem"]'); if (!item) return; const act = item.getAttribute('data-action'); if (act === 'profile'){ closeMenu(ui); location.href = AUTH_NAV.profile; return; } if (act === 'dashboard'){ closeMenu(ui); location.href = AUTH_NAV.dashboard; return; } if (act === 'settings' && AUTH_NAV.settings){ closeMenu(ui); location.href = AUTH_NAV.settings; return; } if (act === 'logout'){ closeMenu(ui); openConfirm(ui); } });
    ui.menu.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ e.preventDefault(); closeMenu(ui); ui.btn.focus(); return; } if (['ArrowDown','ArrowUp','Home','End'].indexOf(e.key) === -1) return; e.preventDefault(); const items = Array.prototype.slice.call(ui.menu.querySelectorAll('.thg-auth-item[role="menuitem"]')); const idx = items.indexOf(document.activeElement); if (!items.length) return; if (e.key === 'Home'){ items[0].focus(); return; } if (e.key === 'End'){ items[items.length - 1].focus(); return; } const next = e.key === 'ArrowDown' ? (idx + 1 + items.length) % items.length : (idx - 1 + items.length) % items.length; items[next].focus(); });
    document.addEventListener('click', function(e){ if (ui.menu.getAttribute('aria-hidden') === 'true') return; if (!ui.menu.contains(e.target) && e.target !== ui.btn && !ui.btn.contains(e.target)){ closeMenu(ui); } });
    // MODAL UI REMOVED - All modal event listeners removed
    ui.confirmEl.querySelector('.thg-confirm-cancel').addEventListener('click', function(){ closeConfirm(ui); });
    ui.confirmEl.addEventListener('click', function(e){ if (e.target === ui.confirmEl) closeConfirm(ui); });
    ui.confirmEl.querySelector('.thg-confirm-ok').addEventListener('click', async function(){
      try { await window.supabase?.auth?.signOut?.(); } catch(_){ }
      // Proactively broadcast sign-out so embedded forms unlock immediately
      try { broadcastAuth(null); } catch(_){ }
      closeConfirm(ui);
    });
    window.__thgOpenAuthModal = function(opts){ openAuthModal(ui, opts); };
    // Expose a helper to programmatically open the auth modal (never toggles dropdown)
    window.authGate.triggerHeaderLogin = function(opts){
      try { openAuthModal(ui, opts||{ next: location.pathname + location.search }); }
      catch(_){ try { window.__thgOpenAuthModal && window.__thgOpenAuthModal(opts||{ next: location.pathname + location.search }); } catch(__){} }
    };
  }

  async function initSupabase(ui){
    state.loading = true; render(ui);
    if (!window.supabase || !window.supabase.auth){
      try {
        const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        const client = mod.createClient('https://wedevtjjmdvngyshqdro.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M');
        window.supabase = client;
      } catch(_) {}
    }
    if (!window.supabase || !window.supabase.auth){ state.supabaseReady = false; state.loading = false; render( ui); console.warn('[thg-auth] window.supabase not found.'); return; }
    state.supabaseReady = true;
    try{ const { data } = await window.supabase.auth.getSession(); state.user = data?.session?.user || null; } catch(_){ state.user = null; } finally { state.loading = false; render(ui); try { broadcastAuth(state.user); } catch(__) {} try { setBuyerEmailLockFromUser(state.user); } catch(__) {}
      // Initialize role manager for authenticated user with retry mechanism
      if (state.user && state.user.email) {
        try {
          window.__thgAuthState = state;
          window.__thgAuthUI = ui;

          // Wait for role manager to be available (with retry mechanism)
          var retryCount = 0;
          var maxRetries = 20;
          var initRoleManager = async function() {
            if (window.thgRoleManager && typeof window.thgRoleManager.init === 'function') {
              await window.thgRoleManager.init(state.user, ui);
              console.log('[thg-auth] Role manager initialized successfully');
            } else if (retryCount < maxRetries) {
              retryCount++;
              console.warn('[thg-auth] Role manager not ready, retry ' + retryCount + '/' + maxRetries);
              setTimeout(initRoleManager, 200);
            } else {
              console.error('[thg-auth] Role manager failed to load after ' + maxRetries + ' retries');
            }
          };

          await initRoleManager();
        } catch(roleErr) {
          console.error('[thg-auth] Role manager init error:', roleErr);
        }
      }
    }
    try{
      const { data: sub } = window.supabase.auth.onAuthStateChange(async function(event, session){
        state.user = session?.user || null;
        render(ui);
        try { broadcastAuth(state.user); } catch(__) {}
        try { setBuyerEmailLockFromUser(state.user); } catch(__) {}

        // Initialize role manager on auth state change with retry mechanism
        if (state.user && state.user.email) {
          try {
            window.__thgAuthState = state;
            window.__thgAuthUI = ui;

            // Wait for role manager to be available (with retry mechanism)
            var retryCount = 0;
            var maxRetries = 20;
            var initRoleManager = async function() {
              if (window.thgRoleManager && typeof window.thgRoleManager.init === 'function') {
                await window.thgRoleManager.init(state.user, ui);
                console.log('[thg-auth] Role manager initialized on auth change');
              } else if (retryCount < maxRetries) {
                retryCount++;
                console.warn('[thg-auth] Role manager not ready on auth change, retry ' + retryCount + '/' + maxRetries);
                setTimeout(initRoleManager, 200);
              } else {
                console.error('[thg-auth] Role manager failed to load on auth change after ' + maxRetries + ' retries');
              }
            };

            await initRoleManager();
          } catch(roleErr) {
            console.error('[thg-auth] Role manager init error on auth change:', roleErr);
          }
        }

        if (event === 'PASSWORD_RECOVERY'){ window.location.href = '/login?recovery=1'; }
        if (state.user && state.user.email){
          if (state.nextUrl){
            const to = state.nextUrl;
            state.nextUrl = null;
            location.href = to;
          }
        } else {
          closeMenu(ui);
        }
      });
      state.sub = sub?.subscription || sub || null;
    } catch(_){ }
  }

  function observeRerenders(){ const mo = new MutationObserver(function(muts){ for (var i=0;i<muts.length;i++){ for (var j=0;j<muts[i].addedNodes.length;j++){ const n = muts[i].addedNodes[j]; if (n.nodeType !== 1) continue; hideLegacyAuthLinks(n); ensureContainer(); } } }); mo.observe(document.documentElement, { childList:true, subtree:true }); }

  ready(function(){
    hideLegacyAuthLinks(document);
    injectStyles();
    const ui = createUI();
    bindUI(ui);
    // If there is no header on the host page, we use a fixed fallback button.
    // On white/light backgrounds (like the Netlify snippet page), the default
    // white-on-dark styling can be invisible. Add a light-theme override only
    // for this fallback state to ensure visibility without affecting host sites
    // that have their own headers.
    try {
      if (ui.wrap && ui.wrap.classList.contains('is-fixed') && !document.getElementById('thg-auth-fixed-contrast')){
        const style = document.createElement('style');
        style.id = 'thg-auth-fixed-contrast';
        style.textContent = [
          '.thg-auth-wrap.is-fixed .thg-auth-btn{color:#111;border:1px solid rgba(0,0,0,.85);background:rgba(0,0,0,.03)}',
          '.thg-auth-wrap.is-fixed .thg-auth-btn:hover{background:rgba(0,0,0,.06)}',
          '.thg-auth-wrap.is-fixed .thg-auth-btn:focus-visible{outline:2px solid #2563eb;outline-offset:2px}',
          '.thg-auth-wrap.is-fixed .thg-auth-btn.is-auth::after{border-top-color:rgba(0,0,0,.85)}',
          '.thg-auth-wrap.is-fixed .thg-auth-menu{background:#fff;color:#111;border:1px solid rgba(0,0,0,.12);box-shadow:0 12px 30px rgba(0,0,0,.12)}',
          '.thg-auth-wrap.is-fixed .thg-auth-item:hover{background:rgba(0,0,0,.06)}',
          '.thg-auth-wrap.is-fixed .thg-initial{background:#111;color:#fff}',
          '.thg-auth-wrap.is-fixed .thg-initial-lg{background:#111;color:#fff}'
        ].join('\\n');
        document.head && document.head.appendChild(style);
      }
    } catch(_){}
    observeRerenders();
    initSupabase(ui);

    // Auto-open the auth modal on first load if configured or URL hints present
    try {
      const qp = new URLSearchParams(location.search);
      const hash = (location.hash || '').trim();
      const shouldAutoOpen = (window.AUTH_OPEN_ON_LOAD === true)
        || qp.has('auth_open') || qp.get('login') === '1' || qp.get('open') === '1'
        || hash === '#login' || hash === '#signup' || hash === '#auth';
      if (shouldAutoOpen) {
        setTimeout(function(){ try { if (!state.user) { openAuthModal(ui, { next: location.pathname + location.search }); } } catch(_){} }, 0);
      }
    } catch(_){}

    // Allow child iframes (e.g., Netlify buyer-form) to request opening the global login
    // Secure origin-validated postMessage listener (also supports legacy types)
    const ALLOWED_IFRAME_ORIGINS = [location.origin];

    function openDurableHeaderBehavior(meta){
      try {
        var el = document.getElementById('durable-head')
          || document.querySelector('header, [role="banner"], [data-section="header"], .site-header, nav')
          || document.querySelector('.thg-auth-wrap');
        if (el && el.scrollIntoView) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // If not authenticated, open the auth modal directly. If authenticated, do nothing.
        var isAuthed = !!(state && state.user && state.user.email);
        if (!isAuthed) {
          try { openAuthModal(ui, { next: (meta && meta.next) || (location.pathname + location.search) }); }
          catch(_) { try { window.__thgOpenAuthModal && window.__thgOpenAuthModal({ next: location.pathname + location.search }); } catch(__){} }
        }
      } catch (err) { console.error('openDurableHeaderBehavior error:', err); }
    }
    window.openDurableHeaderBehavior = openDurableHeaderBehavior;

    window.addEventListener('message', function(ev){
      try {
        var data = ev && ev.data;
        if (!data || typeof data !== 'object') return;
        // Loosen origin checks for safe CTA from known child frames (e.g., Netlify buyer-form)
        if (ev.origin && ALLOWED_IFRAME_ORIGINS.indexOf(ev.origin) === -1) {
          var extraOk = false;
          try {
            var o = ev.origin || '';
            if (/^https:\\/\\//.test(o)) {
              if (o.indexOf('tharaga.co.in') !== -1 || o.indexOf('auth.tharaga.co.in') !== -1 || o.indexOf('netlify.app') !== -1) extraOk = true;
              if (!extraOk && Array.isArray(window.ALLOWED_CHILD_ORIGINS) && window.ALLOWED_CHILD_ORIGINS.indexOf(o) !== -1) extraOk = true;
            }
          } catch(_) {}
          if (!extraOk) return;
        }

        if (data.type === 'cta' && data.action === 'openDurableHead'){
          console.log('Parent received openDurableHead from', ev.origin, data);
          openDurableHeaderBehavior(data.meta || {});
          return;
        }

        // Update header immediately when auth success is broadcast (post-auth)
        if (data.type === 'THARAGA_AUTH_SUCCESS' && data.user && data.user.email){
          try { state.user = { email: data.user.email, user_metadata: {} }; render(ui); } catch(_) {}
          try { ensureSupabaseReady().then(async function(ok){ if (ok){ try { const s = await window.supabase.auth.getSession(); if (s && s.data && s.data.session && s.data.session.user){ state.user = s.data.session.user; render(ui); } } catch(_){} } }); } catch(_){}
          return;
        }

        if (data.type === 'open_login_modal' || data.type === 'auth_open' || data.type === 'login_open' || data.type === 'trigger_header_login'){
          // If already authenticated, ignore the request so no dropdown toggles.
          if (state && state.user && state.user.email) { return; }
          // Otherwise open the modal directly (never click the header button)
          try { openAuthModal(ui, { next: data.next || (location.pathname + location.search) }); } catch(_){ }
        }

        // Navigation request from embedded forms to open listings in same tab
        if (data.type === 'open_listings' && typeof data.url === 'string'){
          try {
            var o = ev.origin || '';
            var allowed = ALLOWED_IFRAME_ORIGINS.indexOf(o) !== -1 || /tharaga\\.co\\.in|auth\\.tharaga\\.co\\.in|netlify\\.app/.test(o);
            if (!allowed) return;
          } catch(_) {}
          try { location.href = data.url; } catch(_) {}
          return;
        }
      } catch(_){ }
    });

    window.addEventListener('storage', function(ev){ if (ev.key === 'supabase.auth.token'){ } });
    window.addEventListener('beforeunload', function(){ try { state.sub && state.sub.unsubscribe && state.sub.unsubscribe(); } catch(_){} });
  });
})();
        `}
        </Script>
        {/* Static header styles from index.html - GLASSY PREMIUM BLUE */}
        <style
          dangerouslySetInnerHTML={{ __html: `
          :root {
            /* Primary Colors - Premium Blue (Trust & Technology) */
            --primary:#1e40af; --primary-light:#3b82f6; --primary-dark:#1e3a8a;
            /* Accent - Tharaga Gold (Prestige) */
            --gold:#d4af37; --gold-light:#f5e6c8;
            /* Neutrals - Cool Grays */
            --slate-50:#f8fafc; --slate-100:#f1f5f9; --slate-200:#e2e8f0; --slate-300:#cbd5e1;
            --slate-600:#475569; --slate-700:#334155; --slate-900:#0f172a;
            /* Semantic */
            --success:#10b981; --warning:#f59e0b; --danger:#ef4444;
            /* Legacy support (map to new colors) */
            --brand:var(--primary); --brand-600:var(--primary-dark);
            --ink:#111111; --cream:#f7efe7; --muted:#4b5563; --ring:rgba(59,130,246,.30);
            --font-ui:var(--font-manrope),Inter,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial;
            --font-display:var(--font-plus-jakarta),var(--font-manrope),Inter,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial;
            /* Header height for positioning dashboard elements below it */
            --header-height: 60px;
          }
          /* Premium Background - Match Homepage */
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background:
              radial-gradient(1200px 520px at 12% -10%, rgba(255,255,255,.78), rgba(255,255,255,0) 55%),
              radial-gradient(900px 360px at 95% 0%, rgba(212,175,55,.08), rgba(212,175,55,0) 60%),
              linear-gradient(180deg, #f3f5f8 0%, #edf1f6 36%, #e9edf2 100%);
            background-attachment: fixed;
          }

          /* Header base styles - Glassy Premium Blue - EXACT MATCH TO HOMEPAGE */
          header.nav {
            position: sticky !important;
            top: 0 !important;
            z-index: 9999 !important;
            /* Glassmorphism Effect */
            background: linear-gradient(135deg, rgba(255,255,255,0.85), rgba(248,250,252,0.90));
            backdrop-filter: blur(20px) saturate(1.8);
            -webkit-backdrop-filter: blur(20px) saturate(1.8);
            /* Premium Borders */
            border-top: 2px solid var(--gold);
            border-bottom: 1px solid rgba(226,232,240,0.6);
            box-shadow: 0 1px 3px rgba(15,23,42,0.03), 0 10px 40px rgba(15,23,42,0.04);
            transition: min-height 0.2s ease, padding 0.2s ease, top 0.2s ease;
          }
          
          /* Homepage-specific glassmorphic header styling - EXACT Builder Pro container styling from pricing page */
          /* Higher specificity to override base styles */
          body:has(.hero-premium) header.nav,
          .homepage-header header.nav {
            position: fixed !important;
            top: 16px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: min(1200px, calc(100% - 48px)) !important;
            max-width: 1400px !important;
            /* EXACT Builder Pro container styling from pricing page */
            background: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(24px) !important;
            -webkit-backdrop-filter: blur(24px) !important;
            /* Gold border matching Builder Pro highlighted card */
            border: 2px solid rgba(212, 175, 55, 0.5) !important;
            border-radius: 24px !important;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 1px rgba(212, 175, 55, 0.3) !important;
            min-height: 72px !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 9999 !important;
            transition: min-height 0.2s ease, padding 0.2s ease, top 0.2s ease, box-shadow 0.2s ease;
            position: relative;
            overflow: visible !important;
            /* Fallback for older browsers */
          }
          
          @supports not (backdrop-filter: blur(24px)) {
            body:has(.hero-premium) header.nav,
            .homepage-header header.nav {
              background: rgba(255, 255, 255, 0.25) !important;
            }
          }
          
          /* Gold shimmer effect - matching Builder Pro container */
          body:has(.hero-premium) header.nav::before,
          .homepage-header header.nav::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transform: translateX(-100%);
            animation: shimmer 3s ease-in-out infinite;
            pointer-events: none;
            z-index: 1;
            border-radius: 24px;
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(100%); }
          }
          
          /* Sticky shrink state for homepage header */
          body:has(.hero-premium) header.nav.is-scrolled,
          .homepage-header header.nav.is-scrolled {
            min-height: 56px !important;
            top: 8px !important;
          }
          
          /* Homepage header inner container - perfect alignment */
          body:has(.hero-premium) header.nav .inner,
          .homepage-header header.nav .inner {
            max-width: 100% !important;
            padding: 14px 24px !important;
            margin: 0 !important;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            position: relative;
            padding-right: clamp(140px, 12vw, 220px) !important;
            height: 100%;
            min-height: inherit;
            z-index: 2;
            overflow: visible !important;
          }
          
          body:has(.hero-premium) header.nav.is-scrolled .inner,
          .homepage-header header.nav.is-scrolled .inner {
            padding: 10px 24px !important;
          }
          
          /* White text matching pricing page - no text-shadow needed with solid background */
          body:has(.hero-premium) header.nav .brand,
          .homepage-header header.nav .brand {
            color: #ffffff !important;
            font-weight: 800 !important;
          }
          
          body:has(.hero-premium) header.nav a,
          body:has(.hero-premium) header.nav summary,
          .homepage-header header.nav a,
          .homepage-header header.nav summary {
            color: #ffffff !important;
            font-weight: 700 !important;
            transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
          }
          
          body:has(.hero-premium) header.nav a:hover,
          body:has(.hero-premium) header.nav summary:hover,
          .homepage-header header.nav a:hover,
          .homepage-header header.nav summary:hover {
            background: rgba(255, 255, 255, 0.15) !important;
            color: #ffffff !important;
            border-radius: 8px;
            text-decoration: none;
            transform: translateY(-1px);
          }
          
          /* Trust pill - glassy styling matching pricing page */
          body:has(.hero-premium) header.nav .pill,
          .homepage-header header.nav .pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(24px) !important;
            -webkit-backdrop-filter: blur(24px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            font-size: 12px;
            color: #ffffff !important;
            font-weight: 700 !important;
          }
          
          /* Dropdown styling - non-transparent for perfect visibility */
          body:has(.hero-premium) details.dropdown,
          .homepage-header details.dropdown {
            position: relative;
            z-index: 10001;
          }
          
          body:has(.hero-premium) details.dropdown > summary,
          .homepage-header details.dropdown > summary {
            list-style: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 700 !important;
            color: #ffffff !important;
            transition: background 0.2s ease;
          }
          
          body:has(.hero-premium) details.dropdown > summary:hover,
          .homepage-header details.dropdown > summary:hover {
            background: rgba(255, 255, 255, 0.15) !important;
          }
          
          body:has(.hero-premium) details.dropdown > summary::-webkit-details-marker,
          .homepage-header details.dropdown > summary::-webkit-details-marker {
            display: none;
          }
          
          body:has(.hero-premium) details.dropdown > summary::after,
          .homepage-header details.dropdown > summary::after {
            content: "";
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid rgba(255, 255, 255, 0.9);
            opacity: 0.9;
            transition: transform 0.18s ease;
            margin-left: 4px;
          }
          
          body:has(.hero-premium) details.dropdown[open] > summary::after,
          .homepage-header details.dropdown[open] > summary::after {
            transform: rotate(180deg);
          }
          
          /* Dropdown menu: Non-transparent for perfect visibility */
          body:has(.hero-premium) details.dropdown .menu,
          .homepage-header details.dropdown .menu {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            min-width: 240px;
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(24px) !important;
            -webkit-backdrop-filter: blur(24px) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            border-radius: 24px !important;
            padding: 12px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.25) !important;
            z-index: 10000;
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
            visibility: hidden;
            pointer-events: none;
            transition: opacity 0.18s ease, transform 0.18s ease, visibility 0s linear 0.18s;
          }
          
          @supports not (backdrop-filter: blur(24px)) {
            body:has(.hero-premium) details.dropdown .menu,
            .homepage-header details.dropdown .menu {
              background: rgba(255, 255, 255, 0.98) !important;
            }
          }
          
          body:has(.hero-premium) details.dropdown .menu::before,
          .homepage-header details.dropdown .menu::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            border-radius: 12px 12px 0 0;
            background: linear-gradient(90deg, #d4af37, #1e40af);
          }
          
          body:has(.hero-premium) details.dropdown[open] .menu,
          .homepage-header details.dropdown[open] .menu {
            opacity: 1;
            transform: translateY(0) scale(1);
            visibility: visible;
            pointer-events: auto;
            transition: opacity 0.18s ease, transform 0.18s ease, visibility 0s linear 0s;
          }
          
          body:has(.hero-premium) details.dropdown .menu a,
          .homepage-header details.dropdown .menu a {
            display: block;
            padding: 10px 14px;
            border-radius: 8px;
            color: #111 !important;
            text-decoration: none;
            text-align: left;
            font-weight: 600 !important;
            font-size: 14px;
            transition: background 0.15s ease, transform 0.06s ease, color 0.15s ease;
            margin-bottom: 2px;
          }
          
          body:has(.hero-premium) details.dropdown .menu a:last-child,
          .homepage-header details.dropdown .menu a:last-child {
            margin-bottom: 0;
          }
          
          body:has(.hero-premium) details.dropdown .menu a:hover,
          .homepage-header details.dropdown .menu a:hover {
            background: rgba(0, 0, 0, 0.05) !important;
            color: #111 !important;
            transform: translateX(2px);
          }
          
          /* Auth buttons on glassy header - EXACT pricing page glassy gradient */
          body:has(.hero-premium) header.nav .thg-auth-wrap,
          .homepage-header header.nav .thg-auth-wrap {
            display: flex;
            align-items: center;
            gap: 12px;
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
          }
          
          body:has(.hero-premium) header.nav .thg-auth-wrap::before,
          .homepage-header header.nav .thg-auth-wrap::before {
            content: "";
            display: inline-block;
            width: 1px;
            height: 20px;
            background: rgba(255, 255, 255, 0.3) !important;
            border-radius: 1px;
          }
          
          /* Login/Signup button - glassy gradient matching pricing page */
          body:has(.hero-premium) header.nav .thg-auth-btn,
          .homepage-header header.nav .thg-auth-btn {
            background: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(24px) !important;
            -webkit-backdrop-filter: blur(24px) !important;
            color: #ffffff !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            font-weight: 700 !important;
            padding: 8px 18px !important;
            border-radius: 12px !important;
            transition: all 0.2s ease !important;
            font-size: 14px;
            white-space: nowrap;
          }
          
          body:has(.hero-premium) header.nav .thg-auth-btn:hover,
          .homepage-header header.nav .thg-auth-btn:hover {
            background: rgba(255, 255, 255, 0.25) !important;
            border-color: rgba(255, 255, 255, 0.35) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          }
          
          /* User button when logged in - glassy styling */
          body:has(.hero-premium) header.nav .thg-auth-btn.is-auth,
          .homepage-header header.nav .thg-auth-btn.is-auth {
            background: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(24px) !important;
            -webkit-backdrop-filter: blur(24px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            color: #ffffff !important;
            font-weight: 700 !important;
          }
          
          body:has(.hero-premium) header.nav .thg-auth-btn.is-auth:hover,
          .homepage-header header.nav .thg-auth-btn.is-auth:hover {
            background: rgba(255, 255, 255, 0.25) !important;
            border-color: rgba(255, 255, 255, 0.35) !important;
          }
          
          body:has(.hero-premium) header.nav .thg-auth-btn.is-auth::after,
          .homepage-header header.nav .thg-auth-btn.is-auth::after {
            border-top-color: rgba(255, 255, 255, 0.9) !important;
          }
          
          body:has(.hero-premium) header.nav .thg-auth-btn .thg-initial,
          .homepage-header header.nav .thg-auth-btn .thg-initial {
            background: rgba(255, 255, 255, 0.2) !important;
            color: #ffffff !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
          }
          
          /* Hide any X/close buttons in header completely */
          body:has(.hero-premium) header.nav button[aria-label*="close" i],
          body:has(.hero-premium) header.nav button[aria-label*="Close" i],
          body:has(.hero-premium) header.nav .close,
          body:has(.hero-premium) header.nav .close-btn,
          body:has(.hero-premium) header.nav button.close,
          body:has(.hero-premium) header.nav [class*="close"],
          body:has(.hero-premium) header.nav [class*="x-icon"],
          body:has(.hero-premium) header.nav svg[aria-label*="close" i],
          body:has(.hero-premium) header.nav button:has(svg[aria-label*="close" i]),
          body:has(.hero-premium) header.nav .thg-auth-wrap button:has(svg),
          body:has(.hero-premium) header.nav .thg-auth-wrap > button:not(.thg-auth-btn),
          .homepage-header header.nav button[aria-label*="close" i],
          .homepage-header header.nav button[aria-label*="Close" i],
          .homepage-header header.nav .close,
          .homepage-header header.nav .close-btn,
          .homepage-header header.nav button.close,
          .homepage-header header.nav [class*="close"],
          .homepage-header header.nav [class*="x-icon"],
          .homepage-header header.nav svg[aria-label*="close" i],
          .homepage-header header.nav button:has(svg[aria-label*="close" i]),
          .homepage-header header.nav .thg-auth-wrap button:has(svg),
          .homepage-header header.nav .thg-auth-wrap > button:not(.thg-auth-btn) {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          
          body:has(.hero-premium) header.nav .divider,
          .homepage-header header.nav .divider {
            background: rgba(255, 255, 255, 0.3) !important;
          }
          
          /* Active page indicator */
          header.nav nav.row a[aria-current="page"]::after,
          header.nav nav.row a.active::after {
            content: "";
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            width: 24px;
            height: 3px;
            background: #3A6FF8;
            border-radius: 2px;
          }
          
          header.nav nav.row a {
            position: relative;
            padding-bottom: 4px;
          }
          
          /* Hover states with translateY effect */
          header.nav nav.row a:hover,
          header.nav nav.row summary:hover {
            transform: translateY(-2px);
          }
          
          /* Fallback for older browsers */
          @supports not (backdrop-filter: blur(20px)) {
            header.nav { background: rgba(255,255,255,0.95); }
            body:has(.hero-premium) header.nav,
            .homepage-header header.nav {
              background: rgba(255, 255, 255, 0.25) !important;
            }
          }
          header.nav .inner { 
            max-width:1100px; 
            margin:0 auto; 
            padding:10px 16px; 
            display:flex; 
            align-items:center; 
            justify-content:space-between; 
            gap:10px; 
            position:relative; 
            /* Remove extra padding-right - let flex handle spacing naturally */
            padding-right: 16px;
            /* Ensure proper alignment on all pages - match homepage exactly */
            flex-wrap: nowrap;
          }
          /* Brand row - flex container for brand + pill - EXACT GAP MATCH */
          header.nav .inner .row { display:flex; align-items:center; gap:10px }
          .brand { font-family: var(--font-display); font-weight:800; letter-spacing:.2px; font-size:26px }
          header.nav .brand{ color:var(--slate-900); }
          header.nav a, header.nav summary{
            color:var(--slate-900);
            font-weight:600;
            transition: background 0.2s ease, color 0.2s ease;
          }
          header.nav a:hover, header.nav summary:hover{
            background: linear-gradient(135deg, rgba(30,64,175,0.08), rgba(59,130,246,0.06));
            color: var(--primary);
            border-radius: 8px;
            text-decoration: none;
          }
          .pill { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; background:#fff; border:1px solid #eee; font-size:12px; color:#111 }

          /* Header nav layout - exact spacing match */
          header.nav nav.row { gap:12px; align-items:center; flex-wrap:nowrap; margin-left:auto }
          header.nav nav.row a, header.nav nav.row summary { font-weight:700 }
          .menu-group{ display:inline-flex; align-items:center; gap:12px }
          .divider{ width:1px; height:16px; background:#e5e7eb; border-radius:1px; display:inline-block }

          /* Dropdown styling from index.html */
          details.dropdown{ position:relative }
          details.dropdown > summary{ list-style:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; font-size:16px; }
          details.dropdown > summary::-webkit-details-marker{ display:none }
          details.dropdown > summary::after{ content:""; width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid currentColor; opacity:.8; transition:transform .18s ease }
          details.dropdown[open] > summary::after{ transform:rotate(180deg) }
          details.dropdown .menu{
            position:absolute; top:calc(100% + 8px); right:0; min-width:240px;
            background:linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.98));
            backdrop-filter: blur(16px) saturate(1.5);
            color:#111; border:1px solid rgba(30,64,175,.12);
            border-radius:12px; padding:12px 8px 8px;
            box-shadow:0 18px 40px rgba(30,64,175,.16);
            z-index:60; opacity:0; transform:translateY(-6px) scale(.98);
            visibility:hidden; pointer-events:none;
            transition:opacity .18s ease, transform .18s ease, visibility 0s linear .18s;
          }
          details.dropdown .menu::before{
            content:""; position:absolute; top:0; left:0; right:0; height:3px;
            border-radius:12px 12px 0 0;
            background:linear-gradient(90deg, #d4af37, #1e40af);
          }
          details.dropdown[open] .menu{ opacity:1; transform:translateY(0) scale(1); visibility:visible; pointer-events:auto; transition:opacity .18s ease, transform .18s ease, visibility 0s linear 0s }
          /* Ensure Next.js Link components in dropdowns are styled correctly */
          details.dropdown .menu a,
          details.dropdown .menu a[href] {
            display:flex;
            align-items:center;
            justify-content:space-between;
            padding:10px 12px;
            border-radius:10px;
            color:inherit;
            text-decoration:none;
            text-align:left;
            transition: background .15s ease, transform .06s ease, color .15s ease, box-shadow .12s ease;
            width:100%;
            box-sizing:border-box;
            gap:8px;
          }
          /* Portal dropdown items - left-align icons and text, right-align checkmarks */
          details.dropdown .menu a[data-portal-link] {
            display:flex;
            align-items:center;
            justify-content:space-between;
            text-align:left;
          }
          details.dropdown .menu a[data-portal-link] > span:first-child {
            display:flex;
            align-items:center;
            gap:8px;
            flex:1;
          }
          details.dropdown .menu a[data-portal-link] > span:last-child {
            margin-left:auto;
          }
          details.dropdown .menu a + a{ border-top:1px solid #f0f2f4 }
          details.dropdown .menu a:hover,
          details.dropdown .menu a[href]:hover {
            background:linear-gradient(90deg, rgba(30,64,175,.12), rgba(59,130,246,.06));
            color:#1e40af;
            box-shadow: inset 0 0 0 1px rgba(30,64,175,.18);
            text-decoration:none;
          }
          details.dropdown .menu a:focus-visible,
          details.dropdown .menu a[href]:focus-visible {
            outline:0;
            box-shadow:0 0 0 2px rgba(59,130,246,.30), inset 0 0 0 1px rgba(30,64,175,.24);
          }
          details.dropdown .menu a:active,
          details.dropdown .menu a[href]:active {
            transform:translateY(1px);
            background:linear-gradient(180deg, rgba(30,64,175,.20), rgba(59,130,246,.10));
          }
          details.dropdown .menu .divider{
            display:block; width:auto; height:1px;
            background:rgba(30,64,175,.14); margin:6px 6px; border-radius:1px;
          }
          details.dropdown .menu .show-mobile-only{ display:none }

          /* Auth button styling - Glassy header - EXACT MATCH TO HOMEPAGE */
          /* Override auth system's absolute positioning - use flex layout instead */
          header.nav .thg-auth-wrap,
          header.nav #site-header-auth-container.thg-auth-wrap { 
            display:flex !important; 
            align-items:center !important; 
            gap:12px !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            top: auto !important;
            right: auto !important;
            transform: none !important;
            margin-left: auto !important;
            /* Ensure auth button is aligned to right corner like homepage */
            justify-content: flex-end !important;
          }
          header.nav .thg-auth-wrap::before{
            content:"" !important; 
            display:inline-block !important; 
            width:1px !important; 
            height:16px !important;
            background:rgba(226,232,240,.6) !important; 
            border-radius:1px !important;
          }
          header.nav .thg-auth-btn{
            background:rgba(30,64,175,.08) !important;
            color:#1e40af !important;
            border-color:rgba(30,64,175,.20) !important;
            font-weight:600 !important;
            visibility: visible !important;
            opacity: 1 !important;
            display: inline-flex !important;
            /* Override auth system's white text - match homepage exactly */
            color: var(--primary) !important;
            border: 1px solid rgba(30,64,175,.20) !important;
          }
          /* Override auth system default white text styles - match homepage exactly */
          header.nav .thg-auth-btn .thg-label {
            color: var(--primary) !important;
            font-weight: 600 !important;
          }
          /* Ensure auth button text is always visible and matches homepage */
          header.nav .thg-auth-btn,
          header.nav .thg-auth-btn * {
            color: var(--primary) !important;
          }
          /* Override auth system's white border */
          header.nav .thg-auth-btn {
            border-color: rgba(30,64,175,.20) !important;
          }
          /* Spinner should also match */
          header.nav .thg-auth-btn .thg-spinner {
            border-color: rgba(30,64,175,.35) !important;
            border-top-color: var(--primary) !important;
          }
          header.nav .thg-auth-btn:hover{
            background:rgba(30,64,175,.15) !important;
            border-color:#1e40af !important;
          }
          header.nav .thg-auth-btn.is-auth::after{ border-top-color:#1e40af !important }
          header.nav .divider{ background:rgba(226,232,240,.6) }
          /* Prevent auth container from being hidden */
          header.nav #site-header-auth-container,
          header.nav .thg-auth-wrap {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          #site-header-auth-container{ 
            display:flex !important; 
            align-items:center !important; 
            gap:12px !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            margin-left: auto !important;
            /* Ensure auth button is aligned to right corner like homepage */
            justify-content: flex-end !important;
          }

          /* Mobile adjustments - exact match to homepage */
          @media (max-width: 1080px) {
            /* Hide trust pill a bit earlier to free space */
            #home_pill_trust{ display:none }
            /* Reserve extra space for auth button to avoid collisions */
            header.nav .inner{ padding-right:200px }
          }
          /* Mobile hamburger menu for homepage */
          @media (max-width: 767px) {
            /* Reduce blur on mobile for performance */
            body:has(.hero-premium) header.nav,
            .homepage-header header.nav {
              backdrop-filter: blur(8px) !important;
              -webkit-backdrop-filter: blur(8px) !important;
              background: rgba(255, 255, 255, 0.25) !important;
            }
            
            body:has(.hero-premium) header.nav .inner,
            .homepage-header header.nav .inner {
              padding: 10px 16px !important;
              padding-right: 50px !important;
            }
            
            /* Hide desktop nav on mobile for homepage */
            body:has(.hero-premium) header.nav nav.row,
            .homepage-header header.nav nav.row {
              display: none;
            }
            
            /* Show hamburger button */
            body:has(.hero-premium) header.nav .mobile-menu-toggle,
            .homepage-header header.nav .mobile-menu-toggle {
              display: flex !important;
              align-items: center;
              justify-content: center;
              width: 44px;
              height: 44px;
              background: rgba(255, 255, 255, 0.15) !important;
              backdrop-filter: blur(8px) !important;
              -webkit-backdrop-filter: blur(8px) !important;
              border: 1px solid rgba(255, 255, 255, 0.25) !important;
              border-radius: 8px;
              cursor: pointer;
              position: absolute;
              right: 12px;
              top: 50%;
              transform: translateY(-50%);
              z-index: 10001;
              color: #ffffff !important;
              transition: all 0.2s ease;
            }
            
            body:has(.hero-premium) header.nav .mobile-menu-toggle:hover,
            .homepage-header header.nav .mobile-menu-toggle:hover {
              background: rgba(255, 255, 255, 0.25) !important;
              border-color: rgba(255, 255, 255, 0.35) !important;
            }
            
            /* Mobile menu overlay */
            body:has(.hero-premium) header.nav .mobile-menu-overlay,
            .homepage-header header.nav .mobile-menu-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.8);
              backdrop-filter: blur(4px);
              z-index: 10000;
              opacity: 0;
              visibility: hidden;
              transition: opacity 0.2s ease, visibility 0.2s ease;
            }
            
            body:has(.hero-premium) header.nav .mobile-menu-overlay.is-open,
            .homepage-header header.nav .mobile-menu-overlay.is-open {
              opacity: 1;
              visibility: visible;
            }
            
            /* Mobile menu panel - glassmorphic matching pricing page */
            body:has(.hero-premium) header.nav .mobile-menu-panel,
            .homepage-header header.nav .mobile-menu-panel {
              position: fixed;
              top: 0;
              right: 0;
              width: min(320px, 85vw);
              height: 100vh;
              background: rgba(255, 255, 255, 0.1) !important;
              backdrop-filter: blur(24px) !important;
              -webkit-backdrop-filter: blur(24px) !important;
              border-left: 1px solid rgba(255, 255, 255, 0.2) !important;
              padding: 80px 24px 24px;
              transform: translateX(100%);
              transition: transform 0.3s ease;
              z-index: 10001;
              overflow-y: auto;
              box-shadow: -8px 0 32px 0 rgba(31, 38, 135, 0.15) !important;
            }
            
            body:has(.hero-premium) header.nav .mobile-menu-panel.is-open,
            .homepage-header header.nav .mobile-menu-panel.is-open {
              transform: translateX(0);
            }
            
            body:has(.hero-premium) header.nav .mobile-menu-panel a,
            .homepage-header header.nav .mobile-menu-panel a {
              display: block;
              padding: 16px;
              color: #ffffff !important;
              font-weight: 600;
              border-radius: 8px;
              margin-bottom: 8px;
              min-height: 44px;
              display: flex;
              align-items: center;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            }
            
            body:has(.hero-premium) header.nav .mobile-menu-panel a:hover,
            .homepage-header header.nav .mobile-menu-panel a:hover {
              background: rgba(255, 255, 255, 0.15) !important;
              color: #ffffff !important;
            }
            
            /* Mobile menu close button */
            body:has(.hero-premium) header.nav .mobile-menu-close,
            .homepage-header header.nav .mobile-menu-close {
              position: absolute;
              top: 20px;
              right: 20px;
              width: 44px;
              height: 44px;
              background: rgba(255, 255, 255, 0.15) !important;
              backdrop-filter: blur(8px) !important;
              -webkit-backdrop-filter: blur(8px) !important;
              border: 1px solid rgba(255, 255, 255, 0.25) !important;
              border-radius: 8px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff !important;
              transition: all 0.2s ease;
            }
            
            body:has(.hero-premium) header.nav .mobile-menu-close:hover,
            .homepage-header header.nav .mobile-menu-close:hover {
              background: rgba(255, 255, 255, 0.25) !important;
              border-color: rgba(255, 255, 255, 0.35) !important;
            }
          }
          
          @media (max-width: 880px) {
            /* Mobile header: keep single-row like desktop, just tighter
               Reserve more right-side space so "Features | Login / Signup" never overlaps */
            header.nav .inner { padding-right:160px; flex-wrap:nowrap; gap:8px }
            .brand { font-size:22px }
            header.nav .inner .row { flex:0 0 auto; justify-content:flex-start }
            header.nav nav.row { white-space:nowrap; gap:10px }
            header.nav nav.row a, header.nav nav.row summary { padding:4px 0; font-size:13px }
            /* Make Features font-size match Login/Signup on mobile */
            details.dropdown > summary{ font-size:16px; padding:6px 10px }
            .divider{ height:14px }
            /* Move About into Features menu on mobile; hide right-group About */
            header.nav .thg-auth-wrap .about-link{ display:none }
            header.nav nav.row > a[href='/about/']{ display:none }
            /* Hide nav-level divider before About on mobile */
            header.nav nav.row > .divider{ display:none }
            .about-mobile-link{ display:none }
            /* Hide top-level Pricing in main nav on mobile */
            header.nav nav.row .menu-group > a[href='/pricing/']{ display:none }
            /* Hide the internal divider in nav when Pricing is hidden */
            header.nav nav.row .menu-group > .divider{ display:none }
            /* Show mobile-only items inside Features dropdown */
            details.dropdown .menu .show-mobile-only{ display:block }
            /* Right-side auth group position */
            header.nav .thg-auth-wrap{ position:absolute; top:10px; right:12px; padding:0; gap:10px }
            header.nav .thg-auth-wrap::before{ height:14px }
            /* Hide trust pill to avoid crowding on small screens */
            #home_pill_trust{ display:none }
            /* Use the same dropdown style as desktop */
            details.dropdown .menu{ position:absolute; left:auto; right:0; top:calc(100% + 8px); min-width:230px; border-radius:12px; }
            details.dropdown .menu a{ padding:8px 10px }
          }

          /* Desktop: auth wrap should be in flex layout, not absolutely positioned */
          @media (min-width: 881px) {
            header.nav .thg-auth-wrap:not(.is-fixed){ 
              position: relative !important;
              top: auto !important;
              transform: none !important;
            }
            /* Ensure auth container is properly aligned in flex layout */
            header.nav #site-header-auth-container {
              position: relative !important;
              top: auto !important;
              transform: none !important;
            }
          }

          /* Always suppress legacy About link; using new right-aligned group */
          .about-mobile-link{ display:none !important }
          
          /* Role Manager Enhanced Styles - Pre-inject to prevent delay */
          /* These styles match role-manager-v2.js injectEnhancedStyles() */
          .thg-role-section {
            padding: 4px 0;
          }
          .thg-role-label {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: rgba(255,255,255,0.4);
            padding: 8px 12px 6px;
            letter-spacing: 0.8px;
          }
          .thg-role-icon {
            font-size: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
          }
          .thg-role-switcher {
            position: relative;
            transition: all 0.15s ease;
            cursor: pointer;
          }
          .thg-role-switcher.is-active {
            background: rgba(243, 205, 74, 0.12) !important;
            border-left: 3px solid #f3cd4a;
            padding-left: 9px;
          }
          .thg-role-switcher:not(.is-active):hover {
            background: rgba(255, 255, 255, 0.08);
            cursor: pointer;
          }
          .thg-role-badge {
            font-size: 9px;
            padding: 3px 8px;
            border-radius: 10px;
            font-weight: 700;
            letter-spacing: 0.3px;
          }
          .thg-role-badge.verified {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
          }
          .thg-role-active {
            color: #10b981;
            font-weight: 800;
            font-size: 16px;
            margin-left: auto;
          }
          .thg-add-role-btn {
            border: 1px dashed rgba(255,255,255,0.25);
            margin-top: 4px;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .thg-add-role-btn:hover {
            border-color: #f3cd4a;
            background: rgba(243, 205, 74, 0.08);
          }
          /* OVERRIDE AUTH SYSTEM DARK THEME - Force Light Theme Immediately */
          /* User dropdown menu - LIGHT THEME (override dark #0b0b0b background) */
          header.nav .thg-auth-menu,
          .thg-auth-menu {
            background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.98)) !important;
            backdrop-filter: blur(16px) saturate(1.5) !important;
            -webkit-backdrop-filter: blur(16px) saturate(1.5) !important;
            color: #111 !important;
            border: 1px solid rgba(30,64,175,.12) !important;
            box-shadow: 0 18px 40px rgba(30,64,175,.16) !important;
            border-radius: 12px !important;
            padding: 12px 8px 8px !important;
            min-width: 280px !important;
          }
          header.nav .thg-auth-menu::before {
            content: "" !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 3px !important;
            border-radius: 12px 12px 0 0 !important;
            background: linear-gradient(90deg, #d4af37, #1e40af) !important;
          }
          header.nav .thg-auth-menu .thg-auth-item,
          .thg-auth-menu .thg-auth-item {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            padding: 10px 12px !important;
            border-radius: 10px !important;
            text-decoration: none !important;
            color: #111 !important;
            cursor: pointer !important;
            justify-content: flex-start !important;
          }
          header.nav .thg-auth-menu .thg-auth-item:hover,
          .thg-auth-menu .thg-auth-item:hover {
            background: linear-gradient(90deg, rgba(30,64,175,.12), rgba(59,130,246,.06)) !important;
            color: #1e40af !important;
          }
          header.nav .thg-auth-menu .thg-auth-item.is-header,
          .thg-auth-menu .thg-auth-item.is-header {
            color: #111 !important;
            opacity: 1 !important;
          }
          header.nav .thg-auth-menu .thg-auth-sep,
          .thg-auth-menu .thg-auth-sep {
            background: rgba(30,64,175,.14) !important;
            height: 1px !important;
            margin: 6px 8px !important;
          }
          header.nav .thg-auth-menu .thg-name,
          .thg-auth-menu .thg-name {
            color: #111 !important;
          }
          header.nav .thg-auth-menu .thg-email,
          .thg-auth-menu .thg-email {
            color: #64748b !important;
          }
          header.nav .thg-auth-menu .thg-initial-lg,
          .thg-auth-menu .thg-initial-lg {
            background: #1e40af !important;
            color: #fff !important;
          }
          header.nav .thg-auth-menu .thg-auth-item.thg-role-switcher {
            justify-content: space-between !important;
          }
          header.nav .thg-auth-menu .thg-auth-item.thg-role-switcher > span:first-child,
          .thg-auth-menu .thg-auth-item.thg-role-switcher > span:first-child {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            flex: 1 !important;
          }
          header.nav .thg-auth-menu .thg-role-label,
          .thg-auth-menu .thg-role-label {
            color: rgba(15,23,42,0.4) !important;
          }
          header.nav .thg-auth-menu .thg-role-switcher.is-active,
          .thg-auth-menu .thg-role-switcher.is-active {
            background: rgba(243, 205, 74, 0.12) !important;
            border-left: 3px solid #f3cd4a !important;
            padding-left: 9px !important;
          }
          header.nav .thg-auth-menu .thg-role-switcher:not(.is-active):hover,
          .thg-auth-menu .thg-role-switcher:not(.is-active):hover {
            background: rgba(30,64,175,.08) !important;
          }
          header.nav .thg-auth-menu .thg-role-active,
          .thg-auth-menu .thg-role-active {
            color: #10b981 !important;
          }
          header.nav .thg-auth-menu .thg-add-role-btn,
          .thg-auth-menu .thg-add-role-btn {
            border: 1px dashed rgba(30,64,175,.25) !important;
            color: #111 !important;
          }
                 header.nav .thg-auth-menu .thg-add-role-btn:hover,
                 .thg-auth-menu .thg-add-role-btn:hover {
                   border-color: #f3cd4a !important;
                   background: rgba(243, 205, 74, 0.08) !important;
                 }
                 
                 /* FORCE HIDE ALL MODALS - Complete removal */
                 .thg-auth-overlay,
                 .thg-auth-overlay[aria-hidden="false"],
                 .thg-auth-overlay[aria-hidden="true"] {
                   display: none !important;
                   visibility: hidden !important;
                   opacity: 0 !important;
                   pointer-events: none !important;
                   z-index: -9999 !important;
                 }
                 .thg-auth-modal {
                   display: none !important;
                   visibility: hidden !important;
                   opacity: 0 !important;
                 }
                 
                 /* FORCE HIDE LOGOUT CONFIRMATION DIALOG - Complete removal */
                 .thg-confirm,
                 .thg-confirm[aria-hidden="false"],
                 .thg-confirm[aria-hidden="true"] {
                   display: none !important;
                   visibility: hidden !important;
                   opacity: 0 !important;
                   pointer-events: none !important;
                   z-index: -9999 !important;
                 }
                 .thg-confirm-card {
                   display: none !important;
                   visibility: hidden !important;
                   opacity: 0 !important;
                 }

                 /* Homepage-specific styles from index.html */
                 .pill { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; background:#fff; border:1px solid #eee; font-size:12px; color:#111 }
                 .hero { position:relative; padding:56px 16px 28px; background:linear-gradient(180deg, rgba(255,255,255,1), rgba(255,255,255,.92)); }
                 .hero::before{ content:none }
                 .hero, .hero .h1, .hero .sub, .hero label{ color:#111 !important }
                 .hero .inner { max-width:1100px; margin:0 auto; display:grid; grid-template-columns: 1fr; gap:28px; align-items:center; justify-items:center; text-align:center }
                 .h1 { font-family: var(--font-display); font-weight:700; font-size:36px; line-height:1.12; margin:0 0 12px; letter-spacing:.01em; color:#111 }
                 .sub { color:#111; opacity:1; font-size:16px; margin:0 0 18px; letter-spacing:.01em }
                 .search-card { background:rgba(255,255,255,.72); border:1px solid rgba(30,64,175,.10); border-radius:16px; box-shadow:0 12px 36px rgba(30,64,175,.12); backdrop-filter: blur(12px) saturate(1.05); padding:14px; }
                 .search-grid { display:grid; grid-template-columns:1.2fr .8fr .8fr auto; gap:10px }
                 .chip-row { display:flex; gap:8px; flex-wrap:wrap }
                 .chip { padding:8px 10px; border-radius:999px; border:1px solid #e5e7eb; background:#fff; cursor:pointer; font-weight:600; font-size:13px }
                 .chip[aria-pressed="true"] { background:var(--brand); color:#fff; border-color:var(--brand) }
                 .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:10px 14px; border-radius:12px; border:1px solid var(--primary); background:var(--primary); color:#fff; font-weight:650; transition: background .15s ease, box-shadow .15s ease, transform .15s ease; }
                 .btn:hover{ background: var(--primary-light); transform: translateY(-1px); box-shadow: 0 8px 18px rgba(30,64,175,.22); }
                 .btn.secondary { background:#fff; color:var(--brand) }
                 .features { max-width:1100px; margin:26px auto; padding:0 16px; color:#111 }
                 #how-works-animated iframe{ height: clamp(320px, 58vw, 560px); }
                 .feature-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:14px }
                 .card { background:#fff; border:1px solid var(--slate-200); border-radius:16px; box-shadow:0 12px 36px rgba(30,64,175,.1); padding:16px; }
                 .how { background:linear-gradient(180deg, rgba(30,64,175,.04), rgba(59,130,246,.02)); border-top:1px solid var(--slate-200); border-bottom:1px solid var(--slate-200); }
                 .how .inner { max-width:1100px; margin:0 auto; padding:24px 16px; display:grid; grid-template-columns: repeat(3, 1fr); gap:14px }
                 .kpi-row { display:flex; gap:14px; flex-wrap:wrap; align-items:center }
                 .kpi { font-family: var(--font-display); font-weight:700; font-size:22px }
                 .footer { max-width:1100px; margin:0 auto; padding:28px 16px; color:#666; font-size:14px }
                 .text-gradient{ background:none !important; -webkit-background-clip:initial !important; background-clip:initial !important; color:#111 !important }
                 .ai-hero-figure{ margin:0; width:100%; display:grid; place-items:center; justify-self:center }
                 .ai-hero-art{ width:min(520px,95%); height:auto; opacity:.96; filter:drop-shadow(0 18px 40px rgba(30,64,175,.22)); display:block; margin:0 auto; transform:scaleX(-1); }
                 .hero-premium{ min-height:100vh; padding-top:calc(72px + 32px) !important; padding-bottom:72px; color:#fff; background:transparent; overflow:hidden; position:relative; }
                 @media (max-width: 767px) {
                   .hero-premium{ padding-top:calc(72px + 24px) !important; }
                 }
                 .hero-premium .inner{ max-width:1200px; margin:0 auto; padding:0 16px; display:grid; grid-template-columns:1fr; gap:32px; align-items:center }
                 @media (min-width: 1024px){ .hero-premium .inner{ grid-template-columns:1.05fr .95fr; gap:48px } }
                 .hero-premium .eyebrow{ display:inline-flex; align-items:center; gap:10px; padding:8px 12px; border-radius:9999px; background:rgba(212,175,55,.16); border:1px solid rgba(212,175,55,.28) }
                 .hero-premium .dot{ width:8px; height:8px; border-radius:9999px; background:#d4af37; animation:pulse 1.8s ease-in-out infinite }
                 .hero-premium .headline{ font-family:'Playfair Display', Georgia, serif; font-weight:900; letter-spacing:.2px; line-height:1.06; font-size:44px; margin:14px 0 10px }
                 @media (min-width:640px){ .hero-premium .headline{ font-size:56px } }
                 @media (min-width:1024px){ .hero-premium .headline{ font-size:72px } }
                 .text-gradient-gold{ background:linear-gradient(90deg,#C99A1E,#D4AF37,#E5C86D); -webkit-background-clip:text; background-clip:text; color:transparent }
                 .hero-premium .subhead{ color:#e5e7eb; font-size:18px; line-height:1.6; max-width:640px; margin:0 0 18px }
                 .hero-premium .subhead strong{ color:#f5d779 }
                 .trust-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin:18px 0 22px; max-width:640px }
                 .trust-card{ text-align:center; background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.16); border-radius:14px; padding:14px; backdrop-filter:blur(10px) }
                 .trust-card .k{ font-size:26px; font-weight:800; color:#f1cc4c; margin-bottom:4px }
                 .trust-card .t{ font-size:12px; color:#d1d5db }
                 .cta-row{ display:flex; flex-wrap:wrap; gap:12px }
                 .btn-gold{ appearance:none; border:0; background:linear-gradient(90deg,#c69a17,#d4af37); color:#0f172a; font-weight:800; padding:12px 16px; border-radius:12px; box-shadow:0 10px 30px rgba(212,175,55,.22); display:inline-flex; align-items:center; gap:10px; text-decoration:none; cursor:pointer; }
                 .btn-gold:hover{ filter:brightness(1.02); transform:translateY(-1px) }
                 .btn-glass{ background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.22); color:#fff; font-weight:700; padding:12px 16px; border-radius:12px; display:inline-flex; align-items:center; gap:10px; text-decoration:none }
                 .btn-glass:hover{ background:rgba(255,255,255,.18) }
                 .proof{ display:flex; align-items:center; gap:14px; margin-top:16px }
                 .avatars{ display:flex }
                 .avatars img{ width:40px; height:40px; border-radius:9999px; border:2px solid #071328; margin-left:-10px; background:#ddd }
                 .avatars img:first-child{ margin-left:0 }
                 .stars{ display:flex; gap:4px; margin-bottom:2px }
                 .star{ width:16px; height:16px; color:#d4af37 }
                 .visual{ position:relative; width:100%; display:none }
                 @media (min-width:1024px){ .visual{ display:block } }
                 .card-3d{ position:relative; background:rgba(255,255,255,.85); border:1px solid rgba(212,175,55,.15); border-radius:18px; padding:16px; box-shadow:0 18px 40px rgba(7,19,40,.25); transform:rotate(3deg); transition:transform .45s ease }
                 .card-3d:hover{ transform:rotate(0deg) }
                 .badge{ display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:9999px; background:#d1fae5; color:#065f46; font-size:12px; font-weight:700 }
                 .ai-badge{ position:absolute; top:-10px; right:-10px; background:rgba(255,255,255,.9); border:1px solid rgba(17,24,39,.08); border-radius:14px; padding:12px; box-shadow:0 16px 36px rgba(0,0,0,.22) }
                 .roi-badge{ position:absolute; bottom:-10px; left:-10px; background:rgba(255,255,255,.9); border:1px solid rgba(17,24,39,.08); border-radius:14px; padding:12px; box-shadow:0 16px 36px rgba(0,0,0,.22) }
                 .shape{ position:absolute; border-radius:9999px; filter:blur(60px); opacity:.20; pointer-events:none }
                 .shape.gold{ width:280px; height:280px; left:6%; top:10%; background:#d4af37; animation:floatY 6s ease-in-out infinite }
                 .shape.blue{ width:360px; height:360px; right:6%; bottom:10%; background:#2563EB; animation:floatY2 7s ease-in-out infinite }
                 .scroll-indicator{ position:absolute; bottom:18px; left:50%; transform:translateX(-50%); animation:bounce 1.6s ease-in-out infinite; opacity:.8 }
                 @keyframes pulse{ 0%,100%{ transform:scale(1); opacity:.8 } 50%{ transform:scale(1.18); opacity:1 } }
                 @keyframes floatY{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(12px) } }
                 @keyframes floatY2{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-14px) } }
                 @keyframes slideInLeft{ from{ opacity:0; transform:translateX(-36px) } to{ opacity:1; transform:translateX(0) } }
                 @keyframes scaleIn{ from{ opacity:0; transform:scale(.92) } to{ opacity:1; transform:scale(1) } }
                 @keyframes bounce{ 0%,100%{ transform:translate(-50%,0) } 50%{ transform:translate(-50%,-8px) } }
                 .trial-cta{ position:relative; padding:72px 0; color:#fff; background:linear-gradient(135deg, #071328 0%, #0F2D52 55%, #1A4173 100%); overflow:hidden }
                 .trial-cta .inner{ max-width:1100px; margin:0 auto; padding:0 16px; text-align:center }
                 .trial-cta .badge{ display:inline-flex; align-items:center; gap:10px; padding:8px 12px; border-radius:9999px; background:rgba(16,185,129,.18); border:1px solid rgba(16,185,129,.35); margin-bottom:16px }
                 .trial-cta .headline{ font-family:'Playfair Display', Georgia, serif; font-weight:900; letter-spacing:.2px; line-height:1.06; font-size:44px; margin:14px 0 10px }
                 @media (min-width:640px){ .trial-cta .headline{ font-size:56px } }
                 @media (min-width:1024px){ .trial-cta .headline{ font-size:64px } }
                 .trial-cta .subhead{ color:#e5e7eb; font-size:18px; line-height:1.6; max-width:640px; margin:0 auto 18px }
                 .trial-cta .shapes .shape{ position:absolute; border-radius:9999px; filter:blur(60px); opacity:.25; pointer-events:none }
                 .trial-cta .shapes .gold{ top:-40px; right:-40px; width:380px; height:380px; background:#d4af37 }
                 .trial-cta .shapes .blue{ bottom:-60px; left:-60px; width:420px; height:420px; background:#2563EB }
                 .trial-cta .cta-row{ display:flex; flex-wrap:wrap; gap:12px; justify-content:center; margin:16px 0 10px }
                 .trial-cta .trust{ display:flex; flex-wrap:wrap; gap:16px; justify-content:center; color:#d1d5db; margin-top:6px }

                 /* VALUE PROPOSITION SECTION - COMPLETE CSS FROM ORIGINAL */
                 .value-prop{ position:relative; padding:96px 0; background:linear-gradient(180deg,#f9fafb 0%, #ffffff 100%); overflow:hidden }
                 .value-prop .deco{ position:absolute; border-radius:9999px; filter:blur(72px); opacity:.6; pointer-events:none }
                 .value-prop .deco.gold{ top:-80px; left:-80px; width:260px; height:260px; background:rgba(212,175,55,.10) }
                 .value-prop .deco.primary{ bottom:-100px; right:-100px; width:380px; height:380px; background:rgba(37,99,235,.10) }
                 .value-prop .inner{ position:relative; max-width:1100px; margin:0 auto; padding:0 16px; z-index:1 }
                 .value-prop .header{ text-align:center; max-width:760px; margin:0 auto 28px }
                 .value-prop .eyebrow-gold{ display:inline-block; padding:8px 12px; border-radius:9999px; background:#fef3c7; color:#92400e; font-weight:800; font-size:12px; margin-bottom:16px }
                 .value-prop .headline{ font-family: var(--font-display); font-weight:800; font-size:36px; line-height:1.12; color:#111; margin:0 0 12px }
                 .value-prop .sub{ color:#4b5563; font-size:18px; line-height:1.7; margin:0 auto; max-width:680px }
                 .vp-grid{ display:grid; grid-template-columns:1fr; gap:16px }
                 @media (min-width:768px){ .vp-grid{ grid-template-columns:repeat(2,1fr); gap:18px } }
                 @media (min-width:1024px){ .vp-grid{ grid-template-columns:repeat(3,1fr); gap:20px } }
                 .glass-card{ background:rgba(255,255,255,.72); border:1px solid rgba(17,24,39,.08); border-radius:16px; padding:24px; box-shadow:0 12px 36px rgba(17,24,39,.08); backdrop-filter:blur(10px) saturate(1.02); transition: box-shadow .2s ease, transform .2s ease, border-color .2s ease }
                 .vp-card{ height:100%; border-left:4px solid transparent; transition: border-color .2s ease }
                 .vp-card:hover{ border-left-color: var(--gold) }
                 .vp-card:hover .glass-card{ box-shadow:0 20px 50px rgba(17,24,39,.16); transform:translateY(-2px) }
                 .icon-circle{ width:56px; height:56px; border-radius:14px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#c69a17,#d4af37); color:#fff; margin-bottom:16px; transition: transform .2s ease }
                 .icon-circle svg{ width:28px; height:28px }
                 .vp-card:hover .icon-circle{ transform:scale(1.06) }
                 .vp-title{ font-weight:800; font-size:20px; margin:0 0 10px; color:#111; transition: color .2s ease }
                 .vp-card:hover .vp-title{ color:#1d4ed8 }
                 .vp-desc{ color:#4b5563; line-height:1.7; margin:0 0 14px }
                 .vp-stat{ display:flex; align-items:center; gap:8px; color:#065f46; font-weight:800 }
                 .vp-stat svg{ width:20px; height:20px }
                 .fade-up{ opacity:0; transform:translateY(30px); transition: opacity .5s ease, transform .5s ease; transition-delay: var(--delay, 0s) }
                 .fade-up.in-view{ opacity:1; transform:translateY(0) }

                 /* Mobile optimizations: Value Props (320px–767px) */
                 @media (max-width:767px){
                   .value-prop{ padding:56px 0 }
                   .value-prop .vp-grid{ display:flex; flex-direction:column; gap:12px }
                   .value-prop .glass-card{ padding:16px }
                   .value-prop .icon-circle{ width:40px; height:40px; border-radius:12px; margin-bottom:12px }
                   .value-prop .icon-circle svg{ width:20px; height:20px }
                 }

                 @media (max-width: 880px) { .hero .inner { grid-template-columns: 1fr; text-align:center; } .search-grid { grid-template-columns: 1fr; } .feature-grid { grid-template-columns: 1fr; } .how .inner { grid-template-columns: 1fr; } .h1 { font-size:28px; line-height:1.16 } .sub { font-size:15px } }
               ` }}
               />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            function safeQueue(){
              try { return JSON.parse(localStorage.getItem('__thg_events')||'[]'); } catch(_) { return []; }
            }
            function saveQueue(q){ try { localStorage.setItem('__thg_events', JSON.stringify(q.slice(-200))); } catch(_){}}
            function emit(event, props){
              try{
                var payload = { event: event, ts: Date.now(), props: props||{} };
                if (Array.isArray(window.dataLayer)) { window.dataLayer.push({ event: event, ...(payload.props||{}) }); }
                if (typeof window.gtag === 'function') { try { window.gtag('event', event, payload.props||{}); } catch(_){ } }
                var q = safeQueue(); q.push(payload); saveQueue(q);
              } catch(_){ }
            }
            try { if (!window.thgTrack) window.thgTrack = emit } catch(_){ }

            // Periodically flush events to backend for AI learning
            async function flush(){
              try{
                var q = safeQueue(); if (!q.length) return;
                var userId = localStorage.getItem('thg_user_id') || ('U_'+Math.random().toString(36).slice(2)+'_'+Date.now());
                localStorage.setItem('thg_user_id', userId);
                var sessionId = sessionStorage.getItem('thg_session_id') || ('S_'+Math.random().toString(36).slice(2)+'_'+Date.now());
                sessionStorage.setItem('thg_session_id', sessionId);
                var events = q.map(function(e){ return {
                  user_id: userId,
                  session_id: sessionId,
                  property_id: String(e.props && e.props.property_id || ''),
                  event: String(e.event||'custom'),
                  value: Number(e.props && e.props.value || 1),
                  ts: Number(e.ts||Date.now()),
                }}).filter(function(ev){ return !!ev.property_id && !!ev.event; });
                if (!events.length) { return; }
                var res = await fetch('/api/interactions', { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ events }) });
                if (res.ok) saveQueue([]);
              }catch(_){ }
            }
            setInterval(flush, 15000);
          })();
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var stored = localStorage.getItem('thg.theme');
              var mode = stored || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
              document.documentElement.setAttribute('data-color-mode', mode);
              var meta = document.querySelector('meta[name=\"theme-color\"]');
              if (meta) meta.setAttribute('content', mode === 'dark' ? '#0d1117' : '#ffffff');
            } catch(_){}
          })();
        `}} />
      </head>
      <body className="font-ui bg-canvas text-fg">
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function(){
                navigator.serviceWorker.register('/sw.js').catch(function(){});
              });
            }
            
            // Homepage header sticky shrink behavior
            function initHomepageHeader() {
              const header = document.querySelector('header.nav');
              if (!header) return;
              
              // Check if we're on homepage
              const isHomepage = document.querySelector('.hero-premium') || document.body.classList.contains('homepage-header');
              if (!isHomepage) return;
              
              // Add class to body for CSS fallback
              document.body.classList.add('homepage-header');
              
              let lastScrollY = window.scrollY;
              let ticking = false;
              
              function updateHeader() {
                const scrollY = window.scrollY;
                
                if (scrollY > 50) {
                  header.classList.add('is-scrolled');
                } else {
                  header.classList.remove('is-scrolled');
                }
                
                lastScrollY = scrollY;
                ticking = false;
              }
              
              function onScroll() {
                if (!ticking) {
                  window.requestAnimationFrame(updateHeader);
                  ticking = true;
                }
              }
              
              window.addEventListener('scroll', onScroll, { passive: true });
              updateHeader();
            }
            
            // Mobile menu functionality
            function initMobileMenu() {
              const header = document.querySelector('header.nav');
              if (!header) return;
              
              const toggleBtn = header.querySelector('.mobile-menu-toggle');
              const overlay = header.querySelector('.mobile-menu-overlay');
              const panel = header.querySelector('.mobile-menu-panel');
              const desktopNav = header.querySelector('nav.row');
              
              if (!toggleBtn || !overlay || !panel) return;
              
              function populateMobileMenu() {
                if (!desktopNav || !panel) return;
                
                const menuItems = desktopNav.querySelectorAll('a, details');
                let menuHTML = '';
                
                menuItems.forEach(function(item) {
                  if (item.tagName === 'A') {
                    const href = item.getAttribute('href') || '#';
                    const text = item.textContent.trim();
                    menuHTML += '<a href="' + href + '" data-next-link>' + text + '</a>';
                  } else if (item.tagName === 'DETAILS') {
                    const summary = item.querySelector('summary');
                    const menu = item.querySelector('.menu');
                    if (summary && menu) {
                      menuHTML += '<div class="mobile-menu-group">';
                      menuHTML += '<div class="mobile-menu-title">' + summary.textContent.trim() + '</div>';
                      const links = menu.querySelectorAll('a');
                      links.forEach(function(link) {
                        const href = link.getAttribute('href') || '#';
                        const text = link.textContent.trim();
                        menuHTML += '<a href="' + href + '" data-next-link class="mobile-menu-item">' + text + '</a>';
                      });
                      menuHTML += '</div>';
                    }
                  }
                });
                
                const authContainer = header.querySelector('#site-header-auth-container');
                if (authContainer) {
                  const authLinks = authContainer.querySelectorAll('a, button');
                  if (authLinks.length > 0) {
                    menuHTML += '<div class="mobile-menu-divider"></div>';
                    authLinks.forEach(function(link) {
                      const href = link.getAttribute('href') || '#';
                      const text = link.textContent.trim();
                      const isButton = link.tagName === 'BUTTON';
                      if (isButton) {
                        menuHTML += '<button class="mobile-menu-cta">' + text + '</button>';
                      } else {
                        menuHTML += '<a href="' + href + '" data-next-link class="mobile-menu-cta">' + text + '</a>';
                      }
                    });
                  }
                }
                
                panel.innerHTML = '<button class="mobile-menu-close" aria-label="Close menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' + menuHTML;
                
                const newCloseBtn = panel.querySelector('.mobile-menu-close');
                if (newCloseBtn) {
                  newCloseBtn.addEventListener('click', closeMenu);
                }
              }
              
              function openMenu() {
                overlay.classList.add('is-open');
                panel.classList.add('is-open');
                toggleBtn.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden';
                populateMobileMenu();
              }
              
              function closeMenu() {
                overlay.classList.remove('is-open');
                panel.classList.remove('is-open');
                toggleBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
              }
              
              toggleBtn.addEventListener('click', openMenu);
              overlay.addEventListener('click', closeMenu);
              
              document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && panel.classList.contains('is-open')) {
                  closeMenu();
                }
              });
              
              function updateMobileMenuVisibility() {
                if (window.innerWidth <= 767) {
                  toggleBtn.style.display = 'flex';
                } else {
                  toggleBtn.style.display = 'none';
                  closeMenu();
                }
              }
              
              window.addEventListener('resize', updateMobileMenuVisibility);
              updateMobileMenuVisibility();
            }
            
            // Initialize on DOM ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                initHomepageHeader();
                initMobileMenu();
              });
            } else {
              initHomepageHeader();
              initMobileMenu();
            }
          })();
        `}} />
        <HeaderLinkInterceptor />
               {/* Ensure auth button is always visible - prevent hiding */}
               {/* FORCE REMOVE ALL MODALS - Complete removal */}
               <script dangerouslySetInnerHTML={{ __html: `
                 (function() {
                   'use strict';
                   
                   // REMOVE ALL MODALS AND CONFIRMATION DIALOGS IMMEDIATELY
                   function removeAllModals() {
                     // Remove all modal overlays
                     const overlays = document.querySelectorAll('.thg-auth-overlay');
                     overlays.forEach(function(overlay) {
                       overlay.remove();
                     });
                     
                     // Force hide any remaining modals
                     const modals = document.querySelectorAll('.thg-auth-modal');
                     modals.forEach(function(modal) {
                       modal.style.display = 'none';
                       modal.style.visibility = 'hidden';
                       modal.style.opacity = '0';
                       modal.remove();
                     });
                     
                     // Remove logout confirmation dialogs
                     const confirms = document.querySelectorAll('.thg-confirm');
                     confirms.forEach(function(confirm) {
                       confirm.style.display = 'none';
                       confirm.style.visibility = 'hidden';
                       confirm.style.opacity = '0';
                       confirm.remove();
                     });
                     
                     // Remove confirmation cards
                     const confirmCards = document.querySelectorAll('.thg-confirm-card');
                     confirmCards.forEach(function(card) {
                       card.style.display = 'none';
                       card.style.visibility = 'hidden';
                       card.style.opacity = '0';
                       card.remove();
                     });
                     
                     // Remove any modal parent elements
                     const modalParents = document.querySelectorAll('[class*="thg-auth-overlay"]');
                     modalParents.forEach(function(el) {
                       if (el.classList.contains('thg-auth-overlay')) {
                         el.remove();
                       }
                     });
                   }
                   
                   // Run immediately
                   removeAllModals();
                   
                   // Run on DOM ready
                   if (document.readyState === 'loading') {
                     document.addEventListener('DOMContentLoaded', removeAllModals);
                   }
                   
                   // Watch for new modals being added and remove them
                   const modalObserver = new MutationObserver(function(mutations) {
                     removeAllModals();
                   });
                   
                   modalObserver.observe(document.body, {
                     childList: true,
                     subtree: true
                   });
                   
                   // Run periodically to catch any modals
                   setInterval(removeAllModals, 500);
                   
                   // Force auth container to be visible immediately
                   function forceAuthVisible() {
                     const container = document.getElementById('site-header-auth-container');
                     const wrap = document.querySelector('header.nav .thg-auth-wrap');
                     const btn = document.querySelector('header.nav .thg-auth-btn');
                     
                     if (container) {
                       container.style.display = 'flex';
                       container.style.visibility = 'visible';
                       container.style.opacity = '1';
                     }
                     
                     if (wrap) {
                       wrap.style.display = 'flex';
                       wrap.style.visibility = 'visible';
                       wrap.style.opacity = '1';
                     }
                     
                     if (btn) {
                       btn.style.display = 'inline-flex';
                       btn.style.visibility = 'visible';
                       btn.style.opacity = '1';
                       btn.style.color = '#1e40af';
                       
                       const label = btn.querySelector('.thg-label');
                       if (label) {
                         label.style.color = '#1e40af';
                         if (!label.textContent || label.textContent.trim() === '') {
                           label.textContent = 'Login / Signup';
                         }
                       }
                     }
                   }
                   
                   // Run immediately
                   forceAuthVisible();
                   
                   // Run on DOM ready
                   if (document.readyState === 'loading') {
                     document.addEventListener('DOMContentLoaded', forceAuthVisible);
                   }
                   
                   // Run periodically to prevent hiding
                   setInterval(forceAuthVisible, 200);
                 })();
               ` }} />
        <AppI18nProvider>
          <NotificationProvider>
            <EntitlementsProvider>
              <PrefetchRoutes />
              {children}
            </EntitlementsProvider>
          </NotificationProvider>
        </AppI18nProvider>
        {/* Web Vitals reporting */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            function report(name, value){
              try{ navigator.sendBeacon && navigator.sendBeacon('/api/__vitals', JSON.stringify({ name, value, t: Date.now() })); }catch(_){ }
            }
            try{
              if ('PerformanceObserver' in window) {
                new PerformanceObserver((list) => { for (const entry of list.getEntries()) report(entry.name, entry.value) }).observe({ type: 'largest-contentful-paint', buffered: true });
                new PerformanceObserver((list) => { for (const entry of list.getEntries()) report('CLS', entry.value) }).observe({ type: 'layout-shift', buffered: true });
              }
            }catch(_){ }
            var btn = document.getElementById('themeToggleBtn');
            if (btn) {
              btn.addEventListener('click', function(){
                try {
                  var current = document.documentElement.getAttribute('data-color-mode') || 'light';
                  var next = current === 'dark' ? 'light' : 'dark';
                  document.documentElement.setAttribute('data-color-mode', next);
                  localStorage.setItem('thg.theme', next);
                  var meta = document.querySelector('meta[name=\"theme-color\"]');
                  if (meta) meta.setAttribute('content', next === 'dark' ? '#0d1117' : '#ffffff');
                } catch(_){}
              });
            }
          })();
        `}} />
        <MobileBottomNav />
      </body>
    </html>
  )
}

