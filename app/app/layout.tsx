import './globals.css'
import type { Metadata } from 'next'
export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Tharaga — Premium Real Estate',
  description: 'AI-powered real estate assistant',
}

import { EntitlementsProvider } from '@/components/ui/FeatureGate'
import { AppI18nProvider } from '@/components/providers/AppI18nProvider'
import MobileBottomNav from '@/components/MobileBottomNav'
import { PrefetchRoutes } from '@/components/providers/PrefetchRoutes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
        {/* Auth configuration */}
        <script dangerouslySetInnerHTML={{ __html: `window.AUTH_HIDE_HEADER=false;window.AUTH_OPEN_ON_LOAD=false;` }} />
        {/* Load role manager system */}
        <script src="/role-manager-v2.js" defer></script>
        {/* Load snippets auth system (inline from snippets/index.html) */}
        <script src="/snippets/" type="text/html" id="snippets-auth-src" style={{display:'none'}} />
        <script dangerouslySetInnerHTML={{ __html: `
          // Extract and execute scripts from snippets/index.html
          (function(){
            fetch('/snippets/').then(r=>r.text()).then(html=>{
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              const scripts = doc.querySelectorAll('script');
              scripts.forEach(script => {
                if (script.textContent.includes('__thgAuthInstalledV1')) {
                  const newScript = document.createElement('script');
                  newScript.textContent = script.textContent;
                  document.head.appendChild(newScript);
                }
              });
            }).catch(e => console.error('Failed to load auth:', e));
          })();
        ` }} />
        {/* Static header styles from index.html - GLASSY PREMIUM BLUE */}
        <style
          dangerouslySetInnerHTML={{ __html: `
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

          /* Header base styles - Glassy Premium Blue */
          header.nav {
            position: sticky;
            top: 0;
            z-index: 20;
            /* Glassmorphism Effect */
            background: linear-gradient(135deg, rgba(255,255,255,0.85), rgba(248,250,252,0.90));
            backdrop-filter: blur(20px) saturate(1.8);
            -webkit-backdrop-filter: blur(20px) saturate(1.8);
            /* Premium Borders */
            border-top: 2px solid #d4af37;
            border-bottom: 1px solid rgba(226,232,240,0.6);
            box-shadow: 0 1px 3px rgba(15,23,42,0.03), 0 10px 40px rgba(15,23,42,0.04);
          }
          /* Fallback for older browsers */
          @supports not (backdrop-filter: blur(20px)) {
            header.nav { background: rgba(255,255,255,0.95); }
          }
          header.nav .inner { max-width:1100px; margin:0 auto; padding:10px 16px; display:flex; align-items:center; justify-content:space-between; gap:10px; position:relative; padding-right: clamp(130px, 10vw, 200px) }
          .brand { font-family: var(--font-display); font-weight:800; letter-spacing:.2px; font-size:24px }
          header.nav .brand{ color:#0f172a }
          header.nav a, header.nav summary{
            color:#0f172a;
            font-weight:600;
            transition: background 0.2s ease, color 0.2s ease;
          }
          header.nav a:hover, header.nav summary:hover{
            background: linear-gradient(135deg, rgba(30,64,175,0.08), rgba(59,130,246,0.06));
            color: #1e40af;
            border-radius: 8px;
            text-decoration: none;
          }
          .pill { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; background:#fff; border:1px solid #eee; font-size:12px; color:#111 }

          /* Header nav layout */
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
          details.dropdown .menu a{ display:block; padding:10px 12px; border-radius:10px; color:inherit; text-decoration:none; text-align:center; transition: background .15s ease, transform .06s ease, color .15s ease, box-shadow .12s ease }
          details.dropdown .menu a + a{ border-top:1px solid #f0f2f4 }
          details.dropdown .menu a:hover{
            background:linear-gradient(90deg, rgba(30,64,175,.12), rgba(59,130,246,.06));
            color:#1e40af;
            box-shadow: inset 0 0 0 1px rgba(30,64,175,.18);
          }
          details.dropdown .menu a:focus-visible{
            outline:0;
            box-shadow:0 0 0 2px rgba(59,130,246,.30), inset 0 0 0 1px rgba(30,64,175,.24);
          }
          details.dropdown .menu a:active{
            transform:translateY(1px);
            background:linear-gradient(180deg, rgba(30,64,175,.20), rgba(59,130,246,.10));
          }
          details.dropdown .menu .divider{
            display:block; width:auto; height:1px;
            background:rgba(30,64,175,.14); margin:6px 6px; border-radius:1px;
          }
          details.dropdown .menu .show-mobile-only{ display:none }

          /* Auth button styling - Glassy header */
          header.nav .thg-auth-wrap{ display:flex; align-items:center; gap:12px }
          header.nav .thg-auth-wrap::before{
            content:""; display:inline-block; width:1px; height:16px;
            background:rgba(226,232,240,.6); border-radius:1px;
          }
          header.nav .thg-auth-btn{
            background:rgba(30,64,175,.08) !important;
            color:#1e40af !important;
            border-color:rgba(30,64,175,.20) !important;
            font-weight:600 !important;
          }
          header.nav .thg-auth-btn:hover{
            background:rgba(30,64,175,.15) !important;
            border-color:#1e40af !important;
          }
          header.nav .thg-auth-btn.is-auth::after{ border-top-color:#1e40af !important }
          header.nav .divider{ background:rgba(226,232,240,.6) }
          #site-header-auth-container{ display:flex; align-items:center; gap:12px }

          /* Mobile adjustments */
          @media (max-width: 1080px) {
            #home_pill_trust{ display:none }
            header.nav .inner{ padding-right:200px }
          }
          @media (max-width: 880px) {
            header.nav .inner { padding-right:160px; flex-wrap:nowrap; gap:8px }
            .brand { font-size:22px }
            header.nav .inner .row { flex:0 0 auto; justify-content:flex-start }
            header.nav nav.row { white-space:nowrap; gap:10px }
            header.nav nav.row a, header.nav nav.row summary { padding:4px 0; font-size:13px }
            details.dropdown > summary{ font-size:16px; padding:6px 10px }
            .divider{ height:14px }
            header.nav nav.row .menu-group > a[href='/pricing/']{ display:none }
            header.nav nav.row .menu-group > .divider{ display:none }
            header.nav nav.row > a[href='/about/']{ display:none }
            details.dropdown .menu .show-mobile-only{ display:block }
            header.nav .thg-auth-wrap{ position:absolute; top:10px; right:12px; padding:0; gap:10px }
            header.nav .thg-auth-wrap::before{ height:14px }
            #home_pill_trust{ display:none }
            details.dropdown .menu{ position:absolute; left:auto; right:0; top:calc(100% + 8px); min-width:230px; border-radius:12px; }
            details.dropdown .menu a{ padding:8px 10px }
          }
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
          })();
        `}} />
        {/* Static header - Glassy Premium Blue - matches index.html exactly */}
        <header className="nav">
          <div className="inner">
            <div className="row">
              <a className="brand" href="/" style={{ fontSize: '26px' }}>THARAGA</a>
              <span className="pill" id="home_pill_trust">Verified • Broker‑free</span>
            </div>
            <nav className="row" aria-label="Primary">
              <span className="menu-group">
                <details className="dropdown">
                  <summary>Features</summary>
                  <div className="menu" role="menu">
                    <a href="/tools/vastu/">Vastu</a>
                    <a href="/tools/environment/">Climate &amp; environment</a>
                    <a href="/tools/voice-tamil/">Voice (Tamil)</a>
                    <a href="/tools/verification/">Verification</a>
                    <a href="/tools/roi/">ROI</a>
                    <a href="/tools/currency-risk/">Currency risk</a>
                    <span className="divider show-mobile-only" aria-hidden="true"></span>
                    <a className="show-mobile-only" href="/pricing/">Pricing</a>
                    <a className="show-mobile-only" href="/about/">About</a>
                  </div>
                </details>
                <span className="divider" aria-hidden="true"></span>
                <details className="dropdown" id="portal-menu">
                  <summary>Portal</summary>
                  <div className="menu" role="menu" aria-label="Portal menu" id="portal-menu-items">
                    {/* Dynamic content loaded by role-manager-v2.js */}
                    <a href="/builder">Builder Dashboard</a>
                    <a href="/my-dashboard">Buyer Dashboard</a>
                  </div>
                </details>
                <span className="divider" aria-hidden="true"></span>
                <a href="/pricing/">Pricing</a>
              </span>
              <span className="divider" aria-hidden="true"></span>
              <a href="/about/">About</a>
            </nav>
            <a className="about-mobile-link" href="/about/">About</a>
            {/* Auth button container - populated by auth-gate.js */}
          </div>
        </header>
        <AppI18nProvider>
          <EntitlementsProvider>
            <PrefetchRoutes />
            {children}
          </EntitlementsProvider>
        </AppI18nProvider>
        {/* Portal Menu Dynamic Update */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Update Portal menu based on user roles
          function updatePortalMenu() {
            const portalMenuItems = document.getElementById('portal-menu-items');
            if (!portalMenuItems || !window.thgRoleManager) return;

            const state = window.thgRoleManager.getState();

            // Wait for both initialization AND user data to be ready
            if (!state.initialized || !state.user) {
              const portalMenu = document.getElementById('portal-menu');
              if (portalMenu) portalMenu.style.display = 'none';
              return;
            }

            // Special handling: Show ALL dashboards for admin owner email
            const isAdminOwner = state.user.email === 'tharagarealestate@gmail.com';

            // Hide portal menu if no roles AND not admin owner
            if (state.roles.length === 0 && !isAdminOwner) {
              const portalMenu = document.getElementById('portal-menu');
              if (portalMenu) portalMenu.style.display = 'none';
              return;
            }

            const portalMenu = document.getElementById('portal-menu');
            if (portalMenu) portalMenu.style.display = '';

            let menuHTML = '';

            console.log('[Portal Menu] Updating for user:', state.user.email, 'isAdminOwner:', isAdminOwner, 'roles:', state.roles);

            // For admin owner, always show buyer dashboard
            if (state.roles.includes('buyer') || isAdminOwner) {
              const active = state.primaryRole === 'buyer' ? ' <span style="color:#10b981">✓</span>' : '';
              menuHTML += '<a href="/my-dashboard">🏠 Buyer Dashboard' + active + '</a>';
            }

            // For admin owner, always show builder dashboard
            if (state.roles.includes('builder') || isAdminOwner) {
              const active = state.primaryRole === 'builder' ? ' <span style="color:#10b981">✓</span>' : '';
              const verified = state.builderVerified ? ' <span style="color:#10b981;font-size:11px">✓ Verified</span>' : '';
              menuHTML += '<a href="/builder">🏗️ Builder Dashboard' + active + verified + '</a>';
            }

            // Show Admin Panel link if user has admin role OR is admin owner
            if (state.roles.includes('admin') || isAdminOwner) {
              menuHTML += '<a href="/admin" style="border-top:1px solid #e5e7eb;margin-top:8px;padding-top:8px;">🛡️ Admin Panel</a>';
            }

            portalMenuItems.innerHTML = menuHTML || '<a href="/my-dashboard">Buyer Dashboard</a><a href="/builder">Builder Dashboard</a>';
          }

          // Update portal menu when roles change
          if (window.thgRoleManager) {
            const checkRoles = setInterval(() => {
              const state = window.thgRoleManager.getState();
              // Wait for BOTH initialized AND user to be ready
              if (state.initialized && state.user) {
                clearInterval(checkRoles);
                updatePortalMenu();
              }
            }, 500);

            // Listen for role changes
            window.addEventListener('thg-role-changed', updatePortalMenu);
          } else {
            // If role manager not loaded yet, retry
            setTimeout(() => {
              if (window.thgRoleManager) {
                const checkRoles = setInterval(() => {
                  const state = window.thgRoleManager.getState();
                  if (state.initialized && state.user) {
                    clearInterval(checkRoles);
                    updatePortalMenu();
                  }
                }, 500);
                window.addEventListener('thg-role-changed', updatePortalMenu);
              }
            }, 1000);
          }

          // Make function globally available
          window.__updatePortalMenu = updatePortalMenu;
        ` }} />
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

