/**
 * Universal Static Header Component
 * 
 * This is the PERMANENT header for ALL pages across the entire website.
 * It uses the exact HTML structure from index.html homepage.
 * 
 * USAGE:
 * - Already included in root layout.tsx - works automatically on ALL pages
 * - No need to import or include anything in feature files
 * - Header is always visible, never reloads, truly static
 * 
 * Features:
 * - Sticky positioning (matches homepage exactly)
 * - Exact font sizes, gaps, and spacing
 * - Login/Signup buttons always visible
 * - Portal menu dynamically updates based on user roles
 * - Works on mobile and desktop
 */

import { memo } from 'react'
import { HeaderLinkInterceptor } from './HeaderLinkInterceptor'

const StaticHeaderHTML = memo(function StaticHeaderHTML() {
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
                </div>
              </details>
              <span className="divider" aria-hidden="true"></span>
              {/* Portal menu - ALWAYS VISIBLE, shows login prompt if not authenticated */}
              <details className="dropdown" id="portal-menu">
                <summary>Portal</summary>
                <div className="menu" role="menu" aria-label="Portal menu" id="portal-menu-items">
                  <a href="/builder" data-next-link data-portal-link="builder">Builder Dashboard</a>
                  <a href="/my-dashboard" data-next-link data-portal-link="buyer">Buyer Dashboard</a>
                </div>
              </details>
              <span className="divider" aria-hidden="true"></span>
              <a href="/pricing/" data-next-link>Pricing</a>
            </span>
            <span className="divider" aria-hidden="true"></span>
            <a href="/about/" data-next-link>About</a>
          </nav>
          <a className="about-mobile-link" href="/about/" data-next-link>About</a>
          {/* Auth container - auth system will inject login/signup buttons here */}
          {/* The auth system looks for .thg-auth-wrap or creates it inside header */}
          <div id="site-header-auth-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', visibility: 'visible', opacity: 1 }}>
            {/* Auth system will inject .thg-auth-wrap here */}
          </div>
        </div>
      </header>
      <HeaderLinkInterceptor />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              'use strict';
              
              // Ensure auth container is ready for auth system injection
              // The auth system from snippets/index.html will inject .thg-auth-wrap into header
              // We ensure #site-header-auth-container exists for compatibility
              function ensureAuthContainer() {
                const header = document.getElementById('tharaga-static-header');
                const authContainer = document.getElementById('site-header-auth-container');
                
                if (header && authContainer) {
                  // Ensure container is always visible
                  authContainer.style.display = 'flex';
                  authContainer.style.visibility = 'visible';
                  authContainer.style.opacity = '1';
                  authContainer.style.alignItems = 'center';
                  authContainer.style.gap = '12px';
                  
                  // Make header position relative if needed for absolute positioning of auth wrap
                  const headerStyle = window.getComputedStyle(header);
                  if (headerStyle.position === 'static') {
                    header.style.position = 'relative';
                  }
                  
                  // Prevent auth system from hiding the container
                  authContainer.setAttribute('data-thg-protected', 'true');
                }
              }
              
              // Run immediately and on DOM ready
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', ensureAuthContainer);
              } else {
                ensureAuthContainer();
              }
              
              // Minimal check to ensure container stays visible
              // Only fix if completely hidden (display:none), don't force opacity/visibility
              setInterval(function() {
                const authContainer = document.getElementById('site-header-auth-container');
                if (authContainer) {
                  const style = window.getComputedStyle(authContainer);
                  if (style.display === 'none') {
                    authContainer.style.display = 'flex';
                  }
                }
              }, 1000);
              
              // Watch for auth system injection - minimal interference
              const authObserver = new MutationObserver(function(mutations) {
                const authContainer = document.getElementById('site-header-auth-container');
                const authBtn = document.querySelector('header.nav .thg-auth-btn');

                // Only ensure container has correct display, don't force other styles
                if (authContainer && window.getComputedStyle(authContainer).display === 'none') {
                  authContainer.style.display = 'flex';
                }

                // Ensure label text exists (auth system should set this, but double-check)
                if (authBtn) {
                  const label = authBtn.querySelector('.thg-label');
                  if (label && (!label.textContent || label.textContent.trim() === '')) {
                    label.textContent = 'Login / Signup';
                  }
                }
              });
              
              const headerEl = document.getElementById('tharaga-static-header');
              if (headerEl) {
                authObserver.observe(headerEl, {
                  childList: true,
                  subtree: true,
                  attributes: true,
                  attributeFilter: ['style', 'class']
                });
              }
              
              // Removed aggressive periodic visibility checks
              // The auth system and CSS should handle visibility naturally
              
              // Portal menu update function (called by role manager)
              // Portal menu is ALWAYS visible - behavior changes based on login state
              window.__updatePortalMenu = function() {
                const portalMenuItems = document.getElementById('portal-menu-items');
                const portalMenu = document.getElementById('portal-menu');
                const portalSummary = portalMenu ? portalMenu.querySelector('summary') : null;

                if (!portalMenuItems || !portalMenu) return;

                // Portal menu is always visible
                portalMenu.style.display = '';

                // Check if user is logged in and has roles
                let isLoggedIn = false;
                let userRoles = [];
                let primaryRole = null;
                let builderVerified = false;
                let isAdminOwner = false;

                if (window.thgRoleManager) {
                  try {
                    const state = window.thgRoleManager.getState();
                    isLoggedIn = !!(state.initialized && state.user);
                    if (isLoggedIn) {
                      userRoles = state.roles || [];
                      primaryRole = state.primaryRole || null;
                      builderVerified = state.builderVerified || false;
                      isAdminOwner = state.user.email === 'tharagarealestate@gmail.com';
                    }
                  } catch(e) {
                    console.error('[portal-menu] Error getting role state:', e);
                  }
                }

                // If not logged in, make Portal menu redirect to login
                if (!isLoggedIn) {
                  // Show login prompt in dropdown
                  portalMenuItems.innerHTML = '<a href="/login" style="display:flex;align-items:center;justify-content:center;text-align:center;padding:16px;color:#1e40af;font-weight:600;"><span>Login to Access Dashboards</span></a>';
                  return;
                }

                // Build menu HTML based on user state and roles
                let menuHTML = '';

                // Show Buyer Dashboard ONLY if:
                // 1. User is admin owner (tharagarealestate@gmail.com) - sees ALL dashboards
                // 2. User has buyer role OR builder role (builders can see buyer dashboard)

                if (isAdminOwner) {
                  // Admin owner sees all three dashboards
                  const buyerActive = primaryRole === 'buyer' ? '<span style="color:#10b981;font-weight:800;font-size:16px;margin-left:auto;">✓</span>' : '';
                  menuHTML += '<a href="/my-dashboard" data-next-link data-portal-link="buyer" style="display:flex;align-items:center;justify-content:space-between;text-align:left;"><span style="display:flex;align-items:center;gap:8px;">🏠 Buyer Dashboard</span>' + buyerActive + '</a>';

                  const builderActive = primaryRole === 'builder' ? '<span style="color:#10b981;font-weight:800;font-size:16px;margin-left:auto;">✓</span>' : '';
                  const verified = builderVerified ? '<span style="color:#10b981;font-size:11px;">✓ Verified</span>' : '';
                  menuHTML += '<a href="/builder" data-next-link data-portal-link="builder" style="display:flex;align-items:center;justify-content:space-between;text-align:left;"><span style="display:flex;align-items:center;gap:8px;">🏗️ Builder Dashboard</span>' + (builderActive || verified) + '</a>';

                  menuHTML += '<a href="/admin" data-next-link style="border-top:1px solid #e5e7eb;margin-top:8px;padding-top:8px;display:flex;align-items:center;justify-content:space-between;text-align:left;"><span style="display:flex;align-items:center;gap:8px;">🛡️ Admin Panel</span></a>';
                } else if (isLoggedIn && userRoles.includes('buyer') && !userRoles.includes('builder')) {
                  // Buyer only - show only Buyer Dashboard
                  const active = primaryRole === 'buyer' ? '<span style="color:#10b981;font-weight:800;font-size:16px;margin-left:auto;">✓</span>' : '';
                  menuHTML += '<a href="/my-dashboard" data-next-link data-portal-link="buyer" style="display:flex;align-items:center;justify-content:space-between;text-align:left;"><span style="display:flex;align-items:center;gap:8px;">🏠 Buyer Dashboard</span>' + active + '</a>';
                } else if (isLoggedIn && userRoles.includes('builder')) {
                  // Builder (with or without buyer role) - show Buyer Dashboard + Builder Dashboard
                  const buyerActive = primaryRole === 'buyer' ? '<span style="color:#10b981;font-weight:800;font-size:16px;margin-left:auto;">✓</span>' : '';
                  menuHTML += '<a href="/my-dashboard" data-next-link data-portal-link="buyer" style="display:flex;align-items:center;justify-content:space-between;text-align:left;"><span style="display:flex;align-items:center;gap:8px;">🏠 Buyer Dashboard</span>' + buyerActive + '</a>';

                  const builderActive = primaryRole === 'builder' ? '<span style="color:#10b981;font-weight:800;font-size:16px;margin-left:auto;">✓</span>' : '';
                  const verified = builderVerified ? '<span style="color:#10b981;font-size:11px;">✓ Verified</span>' : '';
                  menuHTML += '<a href="/builder" data-next-link data-portal-link="builder" style="display:flex;align-items:center;justify-content:space-between;text-align:left;"><span style="display:flex;align-items:center;gap:8px;">🏗️ Builder Dashboard</span>' + (builderActive || verified) + '</a>';
                }
                
                portalMenuItems.innerHTML = menuHTML;
                
                // Re-intercept regular links after portal menu update
                if (window.__nextRouter) {
                  const links = portalMenuItems.querySelectorAll('a[data-next-link]');
                  links.forEach(function(link) {
                    if (link.hasAttribute('data-next-link-processed')) return;
                    link.setAttribute('data-next-link-processed', 'true');
                    link.addEventListener('click', function(e) {
                      const href = link.getAttribute('href');
                      if (!href || href.startsWith('#') || href.startsWith('http')) return;
                      
                      e.preventDefault();
                      if (window.__nextRouter) {
                        window.__nextRouter.push(href);
                      }
                    });
                  });
                }
              };
              
              // showLoginPrompt function REMOVED - redirects to /login instead

              // Initialize portal menu - always visible, content changes based on login state
              function initPortalMenu() {
                // Update portal menu based on auth state
                if (window.__updatePortalMenu) {
                  window.__updatePortalMenu();
                }
                
                // Also listen for role manager updates
                if (window.thgRoleManager) {
                  const checkRoles = setInterval(function() {
                    const state = window.thgRoleManager.getState();
                    if (state.initialized) {
                      clearInterval(checkRoles);
                      if (window.__updatePortalMenu) {
                        window.__updatePortalMenu();
                      }
                    }
                  }, 500);
                  
                  // Stop checking after 10 seconds to avoid infinite loop
                  setTimeout(function() {
                    clearInterval(checkRoles);
                  }, 10000);
                  
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
                  // Role manager not loaded yet - retry
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
})

// Prevent re-renders - header is truly static
StaticHeaderHTML.displayName = 'StaticHeaderHTML'

export default StaticHeaderHTML



