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
import StaticHeaderHTML from '@/components/StaticHeaderHTML'
import { HeaderLinkInterceptor } from '@/components/HeaderLinkInterceptor'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
        {/* Load fonts to match homepage */}
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet" />
        {/* Auth configuration */}
        <script dangerouslySetInnerHTML={{ __html: `window.AUTH_HIDE_HEADER=false;window.AUTH_OPEN_ON_LOAD=false;` }} />
        {/* Load role manager system */}
        <script src="/role-manager-v2.js" defer></script>
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
        {/* Load snippets auth system (inline from snippets/index.html) */}
        <script src="/snippets/" type="text/html" id="snippets-auth-src" style={{display:'none'}} />
        <script dangerouslySetInnerHTML={{ __html: `
          // Extract and execute scripts from snippets/index.html
          // Ensure header is ready before auth system initializes
          (function(){
            function loadAuthSystem() {
              // Wait for header to be ready
              const header = document.getElementById('tharaga-static-header');
              const authContainer = document.getElementById('site-header-auth-container');
              
              if (!header || !authContainer) {
                // Retry after a short delay
                setTimeout(loadAuthSystem, 100);
                return;
              }
              
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
            }
            
            // Start loading after DOM is ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', loadAuthSystem);
            } else {
              loadAuthSystem();
            }
          })();
        ` }} />
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
            --font-ui:'Manrope',Inter,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial;
            --font-display:'Plus Jakarta Sans','Manrope',Inter,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial;
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
          }
          /* Fallback for older browsers */
          @supports not (backdrop-filter: blur(20px)) {
            header.nav { background: rgba(255,255,255,0.95); }
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
        {/* Universal Static Header - Works on ALL pages automatically */}
        {/* No need to import anything in feature files - header is always visible */}
        <StaticHeaderHTML />
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
          <EntitlementsProvider>
            <PrefetchRoutes />
            {children}
          </EntitlementsProvider>
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

