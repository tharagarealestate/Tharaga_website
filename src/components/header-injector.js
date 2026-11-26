/**
 * Tharaga Header Injector
 * ========================
 * 
 * Client-side header injection for static HTML pages.
 * Loads header.html, header.css, and header.js and injects the header into the page.
 * 
 * USAGE:
 *   <div id="tharaga-header-mount"></div>
 *   <script src="/src/components/header-injector.js"></script>
 * 
 * The header will be injected into #tharaga-header-mount (or at the start of <body> if not found).
 */

(function() {
  'use strict';

  const HEADER_HTML_URL = '/src/components/header.html';
  const HEADER_CSS_URL = '/src/components/header.css';
  const HEADER_JS_URL = '/src/components/header.js';

  // Check if header already exists
  if (document.getElementById('tharaga-static-header')) {
    console.warn('[tharaga-header-injector] Header already exists, skipping injection');
    return;
  }

  // Load CSS
  function loadCSS(url) {
    return new Promise(function(resolve, reject) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  // Load HTML
  function loadHTML(url) {
    return fetch(url)
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Failed to load header HTML: ' + response.statusText);
        }
        return response.text();
      });
  }

  // Load JS
  function loadJS(url) {
    return new Promise(function(resolve, reject) {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Inject header into DOM
  function injectHeader(html) {
    const mountPoint = document.getElementById('tharaga-header-mount');
    const target = mountPoint || document.body;
    
    // Create a temporary container to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html.trim();
    
    // Get the header element
    const header = temp.querySelector('header, .tharaga-header, #tharaga-static-header');
    
    if (!header) {
      throw new Error('Header HTML does not contain a header element');
    }
    
    // Insert at the start of target (or replace mount point)
    if (mountPoint) {
      mountPoint.replaceWith(header);
    } else {
      target.insertBefore(header, target.firstChild);
    }
    
    return header;
  }

  // Initialize header injection
  function init() {
    Promise.all([
      loadCSS(HEADER_CSS_URL),
      loadHTML(HEADER_HTML_URL)
    ])
    .then(function(results) {
      const html = results[1];
      const header = injectHeader(html);
      
      // Load JS after header is in DOM
      return loadJS(HEADER_JS_URL).then(function() {
        return header;
      });
    })
    .then(function(header) {
      console.log('[tharaga-header-injector] Header injected successfully');
      
      // Dispatch custom event for other scripts
      const event = new CustomEvent('tharaga-header-loaded', {
        detail: { header: header }
      });
      document.dispatchEvent(event);
    })
    .catch(function(error) {
      console.error('[tharaga-header-injector] Failed to inject header:', error);
      
      // Fallback: show error message or use default header
      const mountPoint = document.getElementById('tharaga-header-mount');
      if (mountPoint) {
        mountPoint.innerHTML = '<div style="padding: 10px; background: #fee; color: #c00; border: 1px solid #fcc;">Failed to load header. Please refresh the page.</div>';
      }
    });
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

