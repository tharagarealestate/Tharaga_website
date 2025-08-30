/* /js/auth-gate.js
   Drop this file in your site and include:
   <script src="/js/auth-gate.js"></script>
   (No module/exports required - works as a plain script)
*/
(function () {
  'use strict';

  /** CONFIG — update LOGIN_IFRAME_URL to your actual login/embed page */
  const LOGIN_IFRAME_URL = "https://thriving-beijinho-ce44d5.netlify.app/login_signup_glassdrop/"; // <-- replace if needed

  iframe.setAttribute('allowtransparency','true');   // allow transparent bg
iframe.style.background = 'transparent';          // remove default white
iframe.style.border = '0';                        // no border
iframe.style.borderRadius = '12px';               // rounded corners
iframe.style.overflow = 'hidden';                 // hide iframe scrollbars

  // Compute allowed origins safely
  let ALLOWED_IFRAME_ORIGINS = [];
  try {
    ALLOWED_IFRAME_ORIGINS = [new URL(LOGIN_IFRAME_URL).origin];
  } catch (e) {
    // fall back to empty array — message handler will reject unknown origins
    ALLOWED_IFRAME_ORIGINS = [];
    console.warn('auth-gate: invalid LOGIN_IFRAME_URL', e);
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
    #authGateModal .authgate-frame-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 28px;
    } 
    #authGateModal iframe#authGateIframe { width:100%; height:100%; border:0; display:block; background:#fff; }
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

    // expected messages from iframe: { type: 'signed_in' | 'close_login_modal', next?, user? }
    if (msg.type === 'signed_in') {
      // mark logged-in
      window.__authGateLoggedIn = true;

      // close UI
      closeLoginModal();

      // resolve any waiting openLoginModal() promise
      if (signInPromise && signInResolve) {
        signInResolve({ signedIn: true, user: msg.user || null });
        signInPromise = null; signInResolve = null; signInReject = null;
      }

      // Resume pending action if present
      if (window.__authGatePendingAction) {
        const fn = window.__authGatePendingAction;
        window.__authGatePendingAction = null;
        try { fn(); } catch (err) { console.error('resume pending action failed', err); }
      }

      // Optional safe redirect to in-app path (only allow same-origin next)
      if (msg.next) {
        try {
          const u = new URL(msg.next, location.origin);
          if (u.origin === location.origin) location.href = u.href;
        } catch (e) { console.warn('invalid next from iframe', msg.next); }
      }
    } else if (msg.type === 'close_login_modal') {
      closeLoginModal();
    } else if (msg.type === 'ping') {
      // optional handshake message from iframe — reply if needed
      postMessageToIframe({ type: 'pong' });
    } else {
      // ignore other message types (safe default)
    }
  }, false);

  // Expose API
  window.authGate = {
    openLoginModal: (opts) => openLoginModal(opts || {}),
    closeLoginModal,
    attachAuthGate
  };

  // quick debug hint in console
  console.debug && console.debug('authGate injected — use authGate.attachAuthGate(selector, actionFn)');

})();
