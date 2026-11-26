/* /js/auth-gate.js
   Drop this file in your site and include:
   <script src="/auth-gate.js"></script>
   (No module/exports required - works as a plain script)
*/
(function () {
  'use strict';
  
  const SUPABASE_URL = 'https://wedevtjjmdvngyshqdro.supabase.co';
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M";

  /** CONFIG — login iframe should always use same-origin path */
  // Use a relative URL so it works on any host (prod, preview, localhost)
  const LOGIN_IFRAME_URL = "/login_signup_glassdrop/";
  // Inline login via srcdoc is disabled; iframe loads password form page
  const USE_INLINE_LOGIN = false;
  const AUTO_RESUME_PENDING = false;

  // Build allowed origin list robustly (supports absolute AND relative LOGIN_IFRAME_URL)
  let ALLOWED_IFRAME_ORIGINS = [];
  try {
    ALLOWED_IFRAME_ORIGINS = [ new URL(LOGIN_IFRAME_URL, location.origin).origin ];
  } catch (e) {
    ALLOWED_IFRAME_ORIGINS = [ location.origin ];
    console.warn('auth-gate: invalid LOGIN_IFRAME_URL — falling back to current origin', e);
  }
  // Allow same-origin messages when rendering inline login
  try {
    if (USE_INLINE_LOGIN && ALLOWED_IFRAME_ORIGINS.indexOf(location.origin) === -1) {
      ALLOWED_IFRAME_ORIGINS.push(location.origin);
    }
  } catch(_) {}

  // Prevent double injection
  if (window.__authGateInjected) return;
  window.__authGateInjected = true;

  // Wait for DOM to be ready before manipulating it
  function initAuthGate() {
    if (!document.head || !document.body) {
      setTimeout(initAuthGate, 50);
      return;
    }

    // ------- DOM: overlay, frame, controls -------
    const overlay = document.createElement('div');
    overlay.id = 'authGateModal';
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
      <div class="authgate-backdrop" part="backdrop" aria-hidden="true">
        <div class="authgate-dialog" role="dialog" aria-modal="true" aria-label="Login / Signup">
          <button class="authgate-close" aria-label="Close login modal" title="Close">✕</button>
          <div class="authgate-frame-wrap">
            <iframe id="authGateIframe" src="about:blank" frameborder="0" allow="clipboard-read; clipboard-write"></iframe>
          </div>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      /* Use fixed positioning so the overlay always covers the entire viewport
         regardless of ancestor positioning/overflow/transform contexts. */
      #authGateModal { position: fixed; inset: 0; left: 0; width: 100vw; height: 100vh; display: none; z-index: 2147483646; }
      #authGateModal .authgate-backdrop { display:flex; align-items:center; justify-content:center; inset:0;
        background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(10px); }
      #authGateModal .authgate-dialog { position: relative; width: 90%; max-width: 480px; max-height: 90vh;
        background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
        border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6); overflow: hidden; }
      #authGateModal .authgate-close { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px;
        border: none; background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.8);
        font-size: 24px; line-height: 1; cursor: pointer; border-radius: 8px;
        transition: all 0.2s ease; z-index: 10; display: flex; align-items: center; justify-content: center; padding: 0; }
      #authGateModal .authgate-close:hover { background: rgba(255, 255, 255, 0.2); color: #fff; transform: scale(1.05); }
      #authGateModal .authgate-frame-wrap { position: relative; width: 100%; height: 640px; overflow: hidden; }
      #authGateModal #authGateIframe { width: 100%; height: 100%; border: none; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    const dialog = overlay.querySelector('.authgate-dialog');
    const iframe = overlay.querySelector('#authGateIframe');
    const closeBtn = overlay.querySelector('.authgate-close');
    const modal = overlay.querySelector('.authgate-backdrop');
    let lastFocused = null;
    let signInPromise = null;
    let signInResolve = null;
    let signInReject = null;
    const successBanner = document.createElement('div');
    successBanner.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:none;';
    const successText = document.createElement('span');
    successText.textContent = '✓ Signed in successfully';
    successBanner.appendChild(successText);
    document.body.appendChild(successBanner);

    function isAllowedOrigin(origin) {
      return ALLOWED_IFRAME_ORIGINS.indexOf(origin) !== -1;
    }

    function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    }

    function openLoginModal(opts = {}) {
    const { next = null, waitForSignIn = false } = opts;
    try {
      // Generate a one-time state for cross-browser handoff
      const randomState = (()=>{
        try {
          const bytes = new Uint8Array(16);
          crypto.getRandomValues(bytes);
          return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
        } catch (_) {
          return String(Date.now()) + Math.random().toString(36).slice(2);
        }
      })();
      try { localStorage.setItem('__tharaga_auth_state', JSON.stringify({ state: randomState, ts: Date.now() })); } catch(_) {}

      {
        const params = new URLSearchParams();
        params.set('embed', '1');
        if (next) params.set('next', next);
        params.set('state', randomState);
        params.set('parent_origin', location.origin);
        iframe.src = LOGIN_IFRAME_URL + (params.toString() ? ('?' + params.toString()) : '');
        // debug
        console.debug('auth-gate: opening iframe ->', iframe.src);
        try {
          const tmpUrl = new URL(iframe.src, location.href);
          const iframeOrigin = tmpUrl.origin;
          if (ALLOWED_IFRAME_ORIGINS.indexOf(iframeOrigin) === -1) {
            ALLOWED_IFRAME_ORIGINS.push(iframeOrigin);
          }
        } catch (e) { /* ignore */ }
      }
    } catch (e) {
      if (!USE_INLINE_LOGIN) iframe.src = LOGIN_IFRAME_URL;
    }

    lastFocused = document.activeElement;
    overlay.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { try { if (closeBtn) closeBtn.focus(); } catch(_) {} }, 50);
    document.addEventListener('keydown', onKeyDown);
    dialog.addEventListener('keydown', trapFocus);

    // Helper: ensure a Supabase client is available on this parent page
    async function ensureParentSupabaseClient() {
      try {
        if (window.supabase && window.supabase.auth) return window.supabase;
        const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        const c = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabase = c; // cache for later
        return c;
      } catch (_) { return null; }
    }

    // Magic-link disabled: no auth handoff polling.

    if (waitForSignIn) {
      if (!signInPromise) {
        signInPromise = new Promise((resolve, reject) => { signInResolve = resolve; signInReject = reject; });
      }
      return signInPromise;
    }
      return Promise.resolve(true);
    }

    function closeLoginModal() {
    try { iframe.src = 'about:blank'; } catch (e) {}
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    document.removeEventListener('keydown', onKeyDown);
    dialog.removeEventListener('keydown', trapFocus);
    if (signInPromise && signInReject) {
      signInReject(new Error('Login modal closed'));
      signInPromise = null; signInResolve = null; signInReject = null;
    }
      if (successBanner) { try { successBanner.hidden = true; } catch(_) {} }
    }

    function onKeyDown(e) {
    if (e.key === 'Escape') {
      closeLoginModal();
      postMessageToIframe({ type: 'parent_closed' });
    }
    }

    function postMessageToIframe(msg) {
      try {
    const src = iframe && iframe.src ? iframe.src : '';
    if (!src) return;
    const url = new URL(src, location.href);
    const origin = url.origin;
    if (isAllowedOrigin(origin) && iframe.contentWindow) {
      iframe.contentWindow.postMessage(msg, origin);
    }
  } catch (e) {
        console.warn('auth-gate: postMessageToIframe failed', e);
      }
    }

    async function attachAuthGate(selector, actionFn) {
    const nodes = (typeof selector === 'string') ? document.querySelectorAll(selector)
      : (selector instanceof Element ? [selector] : selector);

    if (!nodes || nodes.length === 0) return;

    nodes.forEach(el => {
      el.addEventListener('click', async (evt) => {
        let loggedIn = false;
        try {
          if (window.supabase && window.supabase.auth) {
            const res = await window.supabase.auth.getUser();
            if (res?.data?.user) loggedIn = true;
          }
        } catch (_) {}
        if (!loggedIn && window.__authGateLoggedIn) loggedIn = true;
        if (loggedIn) {
          try { await actionFn(evt); } catch (err) { console.error('authGate action error', err); }
          return;
        }

        evt.preventDefault && evt.preventDefault();

        if (AUTO_RESUME_PENDING) {
          window.__authGatePendingAction = async () => {
            try { await actionFn(evt); } catch (e) { console.error('pending action failed', e); }
          };
        } else {
          window.__authGatePendingAction = null;
        }

        const next = (location.pathname + location.search);
        openLoginModal({ next: next });
      }, { passive: false });
    });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeLoginModal);
    if (modal) modal.addEventListener('click', (ev) => { /* backdrop click disabled */ });

    // Message receiver: only accept from configured origins
    window.addEventListener('message', (ev) => {
    const origin = ev.origin;
    if (!isAllowedOrigin(origin)) return;
    const msg = ev.data || {};
    if (typeof msg !== 'object') return;

    // expected: { type: 'signed_in' | 'close_login_modal' | 'ping', next?, user? }
    if (msg.type === 'signed_in') {
        window.__authGateLoggedIn = true;
        try { showParentSuccess(msg?.user?.email || null); } catch(_) {}
        if (signInResolve) { try { signInResolve({ signedIn: true, user: msg.user || null }); } catch (_) {} signInPromise = signInResolve = signInReject = null; }
        const next = msg && msg.next ? String(msg.next) : null;
        const isSafe = (()=>{ try { const u=new URL(next, location.href); return u.origin === location.origin; } catch(_) { return false; } })();
        
        // Role-based redirect logic
        setTimeout(async () => {
          try { closeLoginModal(); } catch(_) {}
          try {
            if (next && isSafe) {
              // Check user roles and redirect accordingly
              await redirectBasedOnRole(next, msg.user);
            } else {
              // No next URL, redirect based on primary role
              await redirectBasedOnRole(null, msg.user);
            }
          } catch(err) {
            console.error('[auth-gate] Redirect error:', err);
            // Fallback: redirect to requested URL or home
            if (next && isSafe) {
              location.href = next;
            }
          }
        }, 1200);
        return;
      }

    // token transfer for parent setSession
    if (msg.type === 'tharaga_token_transfer' && msg.access_token && msg.refresh_token) {
        (async () => {
          try {
            if (!window.supabase || !window.supabase.auth) {
              const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
              const client = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
              try { window.supabase = client; } catch(_) {}
            }
            await window.supabase?.auth?.setSession({ access_token: msg.access_token, refresh_token: msg.refresh_token });
          } catch (_) { /* noop */ }
        })();
        return;
      }

    // No verify-failed handling needed for password auth.
        
    if (msg.type === 'close_login_modal') {
        try { closeLoginModal(); } catch (_) {}
        return;
      }  
    }); // <-- THIS closes the message handler (was missing previously)

    // Role-based redirect function
    async function redirectBasedOnRole(requestedUrl, user) {
    if (!user || !user.id) {
      console.warn('[auth-gate] No user provided for role-based redirect');
      return;
    }

    try {
      // Ensure Supabase client is available
      if (!window.supabase || !window.supabase.auth) {
        const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        window.supabase = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await window.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('[auth-gate] Error fetching roles:', rolesError);
        // Fallback: redirect to requested URL or home
        if (requestedUrl) {
          location.href = requestedUrl;
        }
        return;
      }

      const roles = (rolesData || []).map(r => r.role);
      console.log('[auth-gate] User roles:', roles, 'Requested URL:', requestedUrl);

      // If requested URL is specified, check if user has access
      if (requestedUrl) {
        const isBuilderUrl = requestedUrl.includes('/builder');
        const isBuyerUrl = requestedUrl.includes('/my-dashboard');

        if (isBuilderUrl && (roles.includes('builder') || roles.includes('admin'))) {
          location.href = requestedUrl;
          return;
        }
        if (isBuyerUrl && (roles.includes('buyer') || roles.includes('admin'))) {
          location.href = requestedUrl;
          return;
        }
        // User doesn't have access to requested URL, redirect to primary role dashboard
        console.warn('[auth-gate] User does not have access to requested URL');
      }

      // No requested URL or user doesn't have access - redirect to primary role dashboard
      if (roles.includes('admin')) {
        // Admin can go to builder dashboard by default
        location.href = '/builder';
      } else if (roles.includes('builder')) {
        location.href = '/builder';
      } else if (roles.includes('buyer')) {
        location.href = '/my-dashboard';
      } else {
        // No roles assigned, stay on homepage
        console.warn('[auth-gate] User has no roles assigned');
        location.href = '/';
      }
    } catch (error) {
      console.error('[auth-gate] Error in role-based redirect:', error);
      // Fallback: redirect to requested URL or home
      if (requestedUrl) {
        location.href = requestedUrl;
      }
    }
    }

    // Expose API
    window.authGate = {
    openLoginModal: (opts) => openLoginModal(opts || {}),
    closeLoginModal,
    attachAuthGate
  };

    function showParentSuccess(email) {
      try {
        if (!successBanner || !successText) return;
        successText.textContent = email ? `✓ Signed in as ${email}` : '✓ Signed in successfully';
        successBanner.style.display = 'block';
        successBanner.hidden = false;
        setTimeout(() => {
          try {
            successBanner.style.display = 'none';
            successBanner.hidden = true;
          } catch(_) {}
        }, 3000);
      } catch(_) {}
    }

    // Also expose as __thgOpenAuthModal for backward compatibility
    window.__thgOpenAuthModal = (opts) => openLoginModal(opts || {});

    console.log('[auth-gate] Initialized');
  }

  // Call initAuthGate when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthGate);
  } else {
    initAuthGate();
  }
})();

