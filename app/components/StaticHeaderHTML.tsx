/**
 * Static Header Component - Pure HTML Implementation
 * 
 * This component uses the exact HTML structure from index.html homepage.
 * It's truly static - no React re-renders, just pure HTML/CSS/JS.
 * The header is fixed/floating and persists across all page navigations.
 */

import { HeaderLinkInterceptor } from './HeaderLinkInterceptor'

export default function StaticHeaderHTML() {
  return (
    <>
      <header className="nav" id="tharaga-static-header">
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
                  <a href="/tools/vastu/" data-next-link>Vastu</a>
                  <a href="/tools/environment/" data-next-link>Climate &amp; environment</a>
                  <a href="/tools/voice-tamil/" data-next-link>Voice (Tamil)</a>
                  <a href="/tools/verification/" data-next-link>Verification</a>
                  <a href="/tools/roi/" data-next-link>ROI</a>
                  <a href="/tools/currency-risk/" data-next-link>Currency risk</a>
                  <span className="divider show-mobile-only" aria-hidden="true"></span>
                  <a className="show-mobile-only" href="/pricing/" data-next-link>Pricing</a>
                  <a className="show-mobile-only" href="/about/" data-next-link>About</a>
                </div>
              </details>
              <span className="divider" aria-hidden="true"></span>
              <details className="dropdown" id="portal-menu" style={{ display: 'none' }}>
                <summary>Portal</summary>
                <div className="menu" role="menu" aria-label="Portal menu" id="portal-menu-items">
                  <a href="/builder" data-next-link>Builder Dashboard</a>
                  <a href="/my-dashboard" data-next-link>Buyer Dashboard</a>
                </div>
              </details>
              <span className="divider" aria-hidden="true"></span>
              <a href="/pricing/" data-next-link>Pricing</a>
            </span>
            <span className="divider" aria-hidden="true"></span>
            <a href="/about/" data-next-link>About</a>
          </nav>
          <a className="about-mobile-link" href="/about/" data-next-link>About</a>
          <div id="site-header-auth-container"></div>
        </div>
      </header>
      <HeaderLinkInterceptor />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              'use strict';
              
              // Make header fixed/floating
              const header = document.getElementById('tharaga-static-header');
              if (header) {
                header.style.position = 'fixed';
                header.style.top = '0';
                header.style.left = '0';
                header.style.right = '0';
                header.style.zIndex = '50';
                header.style.width = '100%';
                
                // Add padding to body to account for fixed header
                const updateBodyPadding = function() {
                  const headerHeight = header.offsetHeight || 60;
                  document.body.style.paddingTop = headerHeight + 'px';
                };
                
                updateBodyPadding();
                
                // Update padding on resize
                let resizeTimer;
                window.addEventListener('resize', function() {
                  clearTimeout(resizeTimer);
                  resizeTimer = setTimeout(updateBodyPadding, 100);
                });
              }
              
              // Portal menu update function (called by role manager)
              window.__updatePortalMenu = function() {
                const portalMenuItems = document.getElementById('portal-menu-items');
                const portalMenu = document.getElementById('portal-menu');
                if (!portalMenuItems || !portalMenu || !window.thgRoleManager) return;
                
                const state = window.thgRoleManager.getState();
                
                if (!state.initialized || !state.user) {
                  portalMenu.style.display = 'none';
                  return;
                }
                
                const isAdminOwner = state.user.email === 'tharagarealestate@gmail.com';
                
                if (state.roles.length === 0 && !isAdminOwner) {
                  portalMenu.style.display = 'none';
                  return;
                }
                
                portalMenu.style.display = '';
                
                let menuHTML = '';
                
                if (state.roles.includes('buyer') || isAdminOwner) {
                  const active = state.primaryRole === 'buyer' ? ' <span style="color:#10b981">✓</span>' : '';
                  menuHTML += '<a href="/my-dashboard" data-next-link>🏠 Buyer Dashboard' + active + '</a>';
                }
                
                if (state.roles.includes('builder') || isAdminOwner) {
                  const active = state.primaryRole === 'builder' ? ' <span style="color:#10b981">✓</span>' : '';
                  const verified = state.builderVerified ? ' <span style="color:#10b981;font-size:11px">✓ Verified</span>' : '';
                  menuHTML += '<a href="/builder" data-next-link>🏗️ Builder Dashboard' + active + verified + '</a>';
                }
                
                if (state.roles.includes('admin') || isAdminOwner) {
                  menuHTML += '<a href="/admin" data-next-link style="border-top:1px solid #e5e7eb;margin-top:8px;padding-top:8px;">🛡️ Admin Panel</a>';
                }
                
                portalMenuItems.innerHTML = menuHTML || '<a href="/my-dashboard" data-next-link>Buyer Dashboard</a><a href="/builder" data-next-link>Builder Dashboard</a>';
                
                // Re-intercept links after portal menu update
                if (window.__nextRouter) {
                  const links = portalMenuItems.querySelectorAll('a[data-next-link]');
                  links.forEach(function(link) {
                    if (link.hasAttribute('data-next-link-processed')) return;
                    link.setAttribute('data-next-link-processed', 'true');
                    link.addEventListener('click', function(e) {
                      e.preventDefault();
                      const href = link.getAttribute('href');
                      if (href && window.__nextRouter) {
                        window.__nextRouter.push(href);
                      }
                    });
                  });
                }
              };
              
              // Initialize portal menu when role manager is ready
              function initPortalMenu() {
                if (window.thgRoleManager) {
                  const checkRoles = setInterval(function() {
                    const state = window.thgRoleManager.getState();
                    if (state.initialized && state.user) {
                      clearInterval(checkRoles);
                      if (window.__updatePortalMenu) {
                        window.__updatePortalMenu();
                      }
                    }
                  }, 500);
                  
                  window.addEventListener('thg-role-changed', function() {
                    if (window.__updatePortalMenu) {
                      window.__updatePortalMenu();
                    }
                  });
                  
                  window.addEventListener('storage', function(e) {
                    if (e.key === 'tharaga_active_role' && window.__updatePortalMenu) {
                      window.__updatePortalMenu();
                    }
                  });
                } else {
                  setTimeout(initPortalMenu, 1000);
                }
              }
              
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initPortalMenu);
              } else {
                initPortalMenu();
              }
            })();
          `,
        }}
      />
    </>
  )
}



