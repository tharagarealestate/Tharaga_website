/* /js/auth-gate.js
   Drop this file in your site and include:
   <script src="/js/auth-gate.js"></script>
   (No module/exports required - works as a plain script)
*/
(function () {
  'use strict';
  const SUPABASE_URL = 'https://wedevtjjmdvngyshqdro.supabase.co';
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M";

  /** CONFIG — update LOGIN_IFRAME_URL to your actual login/embed page */
  const LOGIN_IFRAME_URL = "/login_signup_glassdrop/"; // <-- replace if needed

    // Build allowed origin list robustly (supports absolute AND relative LOGIN_IFRAME_URL)
  let ALLOWED_IFRAME_ORIGINS = [];
  try {
    // Use location.origin as base so relative paths work: new URL(relative, base)
    ALLOWED_IFRAME_ORIGINS = [ new URL(LOGIN_IFRAME_URL, location.origin).origin ];
  } catch (e) {
    // If even that fails, at least allow the current origin so embedded same-origin iframes work
    ALLOWED_IFRAME_ORIGINS = [ location.origin ];
    console.warn('auth-gate: invalid LOGIN_IFRAME_URL — falling back to current origin', e);
  }

  // Prevent double injection
  if (window.__authGateInjected) return;
  window.__authGateInjected = true;

  // ------- DOM: overlay, frame, controls -------
  const overlay = document.createElement('div');
  overlay.id = 'authGateModal';
  overlay.setAttribute('aria-hidden', 'true');

  // Use inner HTML for structured layout (keeps styling tidy)
  overlay.innerHTML = `
    <div class="authgate-backdrop" part="backdrop" aria-hidden="true">
      <div class="authgate-dialog" role="dialog" aria-modal="true" aria-label="Sign in / Sign up">
        <button class="authgate-close" aria-label="Close login modal" title="Close">✕</button>
        <div class="authgate-frame-wrap">
          <iframe id="authGateIframe" src="about:blank" frameborder="0" allow="clipboard-read; clipboard-write"></iframe>
        </div>
      </div>
    </div>
  `;

  // Minimal styles (avoid dependency on site CSS)
  const style = document.createElement('style');
  style.textContent = `
    #authGateModal { position: fixed; inset: 0; display: none; z-index: 2147483646; }
    #authGateModal .authgate-backdrop { display:flex; align-items:center; justify-content:center; inset:0; position:fixed; width:100%; height:100%; background: rgba(0,0,0,0.65); }
    #authGateModal .authgate-dialog { width: min(1100px, 98%); height: min(850px, 92%); background: transparent; border-radius:12px; box-shadow: 0 12px 40px rgba(0,0,0,0.45); position:relative; display:flex; flex-direction:column; overflow:hidden; }
    #authGateModal .authgate-close { position:absolute; top:10px; right:12px; z-index:3; background:transparent; border:none; font-size:20px; cursor:pointer; padding:6px; }
    #authGateModal .authgate-frame-wrap { display:flex; align-items:center; justify-content:center; padding:28px; flex:1; min-height:0; } 
    #authGateModal iframe#authGateIframe { width:100%; height:100%; border:0; display:block; background:transparent; border-radius:12px; }
    /* small screens */
    @media (max-width:420px) {
      #authGateModal .authgate-dialog { width:98%; height:98%; border-radius:6px; }
      #authGateModal .authgate-close { top:6px; right:8px; }
    }
  `;

  // append to document
  document.head && document.head.appendChild(style);
  document.body.appendChild(overlay);

  const modal = overlay.querySelector('.authgate-backdrop');
  const dialog = overlay.querySelector('.authgate-dialog');
  const iframe = document.getElementById('authGateIframe');
  const closeBtn = overlay.querySelector('.authgate-close');

   // Make iframe visually transparent / rounded so parent overlay shows through (UX)
  try {
    iframe.setAttribute('allowtransparency', 'true'); // defensive attribute
    iframe.style.background = 'transparent';
    iframe.style.border = '0';
    iframe.style.borderRadius = '12px';
    iframe.style.overflow = 'hidden';
  } catch (e) { /* ignore if DOM not ready */ }

  // Accessibility: track focus
  let lastFocused = null;

  // Promise helpers for callers who want to wait for sign-in
  let signInPromise = null;
  let signInResolve = null;
  let signInReject = null;

  // Pending action supplied by attachAuthGate
  window.__authGatePendingAction = null;

  // Public state
  window.__authGateLoggedIn = !!window.__authGateLoggedIn; // keep existing if set

  // Helper: check origin allowed
  function isAllowedOrigin(origin) {
    if (!origin) return false;
    return ALLOWED_IFRAME_ORIGINS.indexOf(origin) !== -1;
  }

  // Focus trap: keep keyboard focus inside the dialog
  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = dialog.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) { // shift + tab
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

  // Open modal. Returns a Promise that resolves when signed_in message arrives (if waitForSignIn true).
  // opts: { next: string|null, waitForSignIn: boolean } 
  function openLoginModal(opts = {}) {
    const { next = null, waitForSignIn = false } = opts;
    try {
      const params = new URLSearchParams();
      params.set('embed', '1');
      if (next) params.set('next', next);
      // include referrer origin (optional) so iframe can detect origin for safe postMessage back
      params.set('parent_origin', location.origin);
      iframe.src = LOGIN_IFRAME_URL + (params.toString() ? ('?' + params.toString()) : '');
    } catch (e) {
      // fallback if URL building fails
      iframe.src = LOGIN_IFRAME_URL;
    }

    lastFocused = document.activeElement;
    overlay.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // small delay to ensure elements are present
    setTimeout(() => {
      closeBtn.focus();
    }, 50);

    // attach keyboard handlers
    document.addEventListener('keydown', onKeyDown);
    dialog.addEventListener('keydown', trapFocus);

    if (waitForSignIn) {
      if (!signInPromise) {
        signInPromise = new Promise((resolve, reject) => { signInResolve = resolve; signInReject = reject; });
      }
      return signInPromise;
    }
    return Promise.resolve(true);
  }

  function closeLoginModal() {
    // clear iframe to free memory and stop its scripts
    try { iframe.src = 'about:blank'; } catch (e) {}
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // restore focus
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    // remove handlers
    document.removeEventListener('keydown', onKeyDown);
    dialog.removeEventListener('keydown', trapFocus);
    // if there was an outstanding sign-in promise, reject it (modal closed)
    if (signInPromise && signInReject) {
      signInReject(new Error('Login modal closed'));
      signInPromise = null; signInResolve = null; signInReject = null;
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      // Treat Esc as close request
      closeLoginModal();
      // inform iframe (optional)
      postMessageToIframe({ type: 'parent_closed' });
    }
  }

  // Safely post a message to iframe (only if src origin is allowed)
  function postMessageToIframe(msg) {
    try {
      const url = new URL(iframe.src);
      const origin = url.origin;
      if (isAllowedOrigin(origin)) {
        iframe.contentWindow && iframe.contentWindow.postMessage(msg, origin);
      } else {
        // do nothing if origin unknown/unsafe
      }
    } catch (e) {
      // ignore
    }
  }

  // Expose attachAuthGate(selector, actionFn)
  // selector can be string CSS selector, Element, or NodeList/Array
  async function attachAuthGate(selector, actionFn) {
    const nodes = (typeof selector === 'string') ? document.querySelectorAll(selector)
      : (selector instanceof Element ? [selector] : selector);

    if (!nodes || nodes.length === 0) return;

    nodes.forEach(el => {
      el.addEventListener('click', async (evt) => {
        // Try to detect existing Supabase session (if supabase is loaded)
        let loggedIn = false;
        try {
          if (window.supabase && supabase.auth) {
            const res = await supabase.auth.getUser();
            if (res?.data?.user) loggedIn = true;
          }
        } catch (_) { /* ignore failures */ }

        // fallback to iframe-sent state
        if (!loggedIn && window.__authGateLoggedIn) loggedIn = true;

        if (loggedIn) {
          try { await actionFn(evt); } catch (err) { console.error('authGate action error', err); }
          return;
        }

        // not logged in: block and store pending action
        evt.preventDefault && evt.preventDefault();
        window.__authGatePendingAction = async () => {
          try { await actionFn(evt); } catch (e) { console.error('pending action failed', e); }
        };

        // open modal — pass next for safe return when iframe posts next
        const next = (location.pathname + location.search);
        openLoginModal({ next: next });
      }, { passive: false });
    });
  }

  // Click close button
  closeBtn.addEventListener('click', closeLoginModal);

  // Overlay: clicking backdrop (outside dialog) closes modal
  modal.addEventListener('click', (ev) => {
    if (ev.target === modal) closeLoginModal();
  });

  // Message receiver: only accept from configured origins
 window.addEventListener('message', (ev) => {
  const origin = ev.origin;
  if (!isAllowedOrigin(origin)) return; // ignore unknown origins

  const msg = ev.data || {};
  if (typeof msg !== 'object') return;

  // expected messages from iframe: { type: 'signed_in' | 'close_login_modal' | 'ping', next?, user? }
  if (msg.type === 'signed_in') {
    window.__authGateLoggedIn = true;

    // Run pending action if any
    if (window.__authGatePendingAction) {
      try {
        window.__authGatePendingAction();
      } catch (e) {
        console.error('Pending action failed', e);
      }
      window.__authGatePendingAction = null;
    }

    // Resolve promise if someone awaited
    if (signInResolve) {
      signInResolve({ signedIn: true, user: msg.user || null });
      signInPromise = null; signInResolve = null; signInReject = null;
    }

    // Optional safe redirect (only allow same-origin)
    if (msg.next) {
      try {
        const u = new URL(msg.next, location.origin);
        if (u.origin === location.origin) location.href = u.href;
      } catch (e) {
        console.warn('invalid next from iframe', msg.next);
      }
    }

    closeLoginModal();

  } else if (msg.type === 'close_login_modal') {
    closeLoginModal();

  } else if (msg.type === 'ping') {
    // optional handshake message from iframe
    postMessageToIframe({ type: 'pong' });

  } else {
    // ignore unknown message types
  }
}, false);

// Expose API
window.authGate = {
  openLoginModal: (opts) => openLoginModal(opts || {}),
  closeLoginModal,
  attachAuthGate
};
  // -------------------- Cross-tab auth sync --------------------
// Listen for sign-ins that happen in *other* tabs (e.g. user clicked magic link email).
// When another tab signs in Supabase will persist the session to localStorage — this code
// subscribes and resumes any pending action (created earlier by attachAuthGate).
(async function setupAuthCrossTabSync() {
  try {
    // prefer existing global client if available
    let sClient = window.supabase;

    // if no global client, dynamically import and create a minimal client using fallback keys
    if (!sClient) {
      // only try if fallback config exists (prevents noisy errors on pages that don't want it)
      if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined') {
        // nothing to do
        return;
      }
      const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      sClient = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      // do not assign to window.supabase to avoid clobbering an existing client
    }

    // subscribe to auth change events — these fire across tabs when localStorage is updated
    sClient.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || session?.access_token) {
    try {
      // Remote sign-in detected: mark logged-in state but DO NOT auto-resume or close UI.
      window.__authGateRemoteSignedIn = true;
      window.__authGateLoggedIn = true;
      console.debug('authGate: sign-in detected in another tab — waiting for explicit continue signal');
      // DON'T close modal or resume pending action here; wait for explicit user confirmation from the sign-in tab.
    } catch (e) {
      console.warn('authGate cross-tab handler error', e);
    }
  }
});

    // Only resume pending action when the sign-in tab writes this explicit key
window.addEventListener('storage', (ev) => {
  if (ev.key === '__tharaga_magic_continue') {
    window.__authGateLoggedIn = true;
    try { closeLoginModal(); } catch (_) {}
    if (signInPromise && signInResolve) { signInResolve(...); }
    if (window.__authGatePendingAction) { ... fn(); }
  }
});


  } catch (err) {
    // non-fatal: if dynamic import fails we simply don't do cross-tab sync
    console.warn('authGate cross-tab sync not available:', err);
  }
})();


  // quick debug hint in console
  console.debug && console.debug('authGate injected — use authGate.attachAuthGate(selector, actionFn)');

})();
