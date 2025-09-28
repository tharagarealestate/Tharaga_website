'use strict';

(function(){
  if (window.__thgOpenAuthModal) return;
  function ensureOverlay(){
    var overlay = document.querySelector('.thg-auth-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'thg-auth-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.setAttribute('role','dialog');
    overlay.innerHTML = [
      '<div class="thg-auth-modal" role="document">',
      '  <div class="thg-auth-header"><div class="thg-auth-title" id="thg-auth-title">Sign in</div>',
      '    <button class="thg-auth-close" type="button" aria-label="Close">✕</button></div>',
      '  <div class="thg-auth-body">',
      '    <div class="thg-tabs" role="tablist" aria-label="Authentication method">',
      '      <button class="thg-tab" role="tab" id="thg-tab-signin" aria-controls="thg-panel-signin" aria-selected="true">Sign in</button>',
      '      <button class="thg-tab" role="tab" id="thg-tab-signup" aria-controls="thg-panel-signup" aria-selected="false">Create account</button>',
      '    </div>',
      '    <div id="thg-panel-signin" role="tabpanel" aria-labelledby="thg-tab-signin">',
      '      <div class="thg-field"><label for="thg-si-email">Email</label><input id="thg-si-email" class="thg-input" type="email" /></div>',
      '      <div class="thg-field"><label for="thg-si-password">Password</label><input id="thg-si-password" class="thg-input" type="password" /></div>',
      '      <div class="thg-actions"><button class="thg-link" type="button" id="thg-forgot">Forgot password?</button></div>',
      '      <button class="thg-btn-primary" type="button" id="thg-signin-btn">Sign in</button>',
      '    </div>',
      '    <div id="thg-panel-signup" role="tabpanel" aria-labelledby="thg-tab-signup" hidden>',
      '      <div class="thg-field"><label for="thg-su-email">Email</label><input id="thg-su-email" class="thg-input" type="email" /></div>',
      '      <div class="thg-field"><label for="thg-su-password">Password</label><input id="thg-su-password" class="thg-input" type="password" /></div>',
      '      <button class="thg-btn-primary" type="button" id="thg-signup-btn">Create account</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    // minimal styles to keep modal visible
    var style = document.createElement('style');
    style.textContent = [
      '.thg-auth-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);opacity:0;visibility:hidden;transition:opacity .15s ease}',
      '.thg-auth-overlay[aria-hidden="false"]{opacity:1;visibility:visible}',
      '.thg-auth-modal{max-width:420px;width:100%;background:#111;color:#fff;border-radius:14px;border:1px solid rgba(255,255,255,.12)}',
      '.thg-auth-header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}',
      '.thg-auth-body{padding:14px}',
      '.thg-tabs{display:flex;gap:6px;background:rgba(255,255,255,.06);padding:4px;border-radius:9999px;margin-bottom:12px}',
      '.thg-tab{flex:1;text-align:center;padding:8px 10px;border-radius:9999px;color:#ddd}',
      '.thg-tab[aria-selected="true"]{background:#fff;color:#111}',
      '.thg-field{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}',
      '.thg-input{background:#1b1b1b;border:1px solid rgba(255,255,255,.12);color:#fff;border-radius:10px;padding:10px 12px}',
      '.thg-btn-primary{width:100%;background:#facc15;color:#111;border:1px solid rgba(250,204,21,.85);border-radius:12px;padding:10px 12px;font-weight:800}',
      '.thg-link{background:none;border:0;color:#22c55e;cursor:pointer;font-size:13px;padding:0}',
      '.thg-auth-close{background:#facc15;border:0;border-radius:50%;width:30px;height:30px;cursor:pointer;color:#111;font-weight:800}'
    ].join('\n');
    document.head && document.head.appendChild(style);
    document.body && document.body.appendChild(overlay);

    // interactions
    var tabIn = overlay.querySelector('#thg-tab-signin');
    var tabUp = overlay.querySelector('#thg-tab-signup');
    var pIn = overlay.querySelector('#thg-panel-signin');
    var pUp = overlay.querySelector('#thg-panel-signup');
    function select(which){
      var a = which === 'signin';
      tabIn.setAttribute('aria-selected', a ? 'true' : 'false');
      tabUp.setAttribute('aria-selected', a ? 'false' : 'true');
      pIn.hidden = !a; pUp.hidden = a;
      var t = overlay.querySelector('#thg-auth-title');
      if (t) t.textContent = a ? 'Sign in' : 'Create account';
    }
    tabIn.addEventListener('click', function(){ select('signin'); });
    tabUp.addEventListener('click', function(){ select('signup'); });
    overlay.querySelector('.thg-auth-close').addEventListener('click', function(){ overlay.setAttribute('aria-hidden','true'); });
    return overlay;
  }

  window.__thgOpenAuthModal = function(opts){
    var ov = ensureOverlay();
    ov.setAttribute('aria-hidden','false');
    setTimeout(function(){ try { ov.querySelector('#thg-si-email').focus(); } catch(_){} }, 0);
  };
})();

