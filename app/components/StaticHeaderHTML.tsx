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
                  <span className="divider show-mobile-only" aria-hidden="true"></span>
                  <a className="show-mobile-only" href="/pricing/" data-next-link>Pricing</a>
                  <a className="show-mobile-only" href="/about/" data-next-link>About</a>
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
          <div id="site-header-auth-container">
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
              
              // Re-check periodically to ensure container stays visible
              // This prevents the auth system from hiding it
              setInterval(function() {
                const authContainer = document.getElementById('site-header-auth-container');
                if (authContainer) {
                  const style = window.getComputedStyle(authContainer);
                  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                    authContainer.style.display = 'flex';
                    authContainer.style.visibility = 'visible';
                    authContainer.style.opacity = '1';
                  }
                }
              }, 500);
              
              // Watch for auth system injection and ensure it's visible
              const authObserver = new MutationObserver(function(mutations) {
                const authContainer = document.getElementById('site-header-auth-container');
                const authWrap = document.querySelector('header.nav .thg-auth-wrap');
                const authBtn = document.querySelector('header.nav .thg-auth-btn');
                
                if (authContainer) {
                  authContainer.style.display = 'flex';
                  authContainer.style.visibility = 'visible';
                  authContainer.style.opacity = '1';
                  authContainer.style.alignItems = 'center';
                  authContainer.style.gap = '12px';
                }
                
                if (authWrap) {
                  authWrap.style.display = 'flex';
                  authWrap.style.visibility = 'visible';
                  authWrap.style.opacity = '1';
                  authWrap.style.alignItems = 'center';
                  authWrap.style.gap = '12px';
                }
                
                // Ensure auth button is visible and styled correctly
                if (authBtn) {
                  authBtn.style.display = 'inline-flex';
                  authBtn.style.visibility = 'visible';
                  authBtn.style.opacity = '1';
                  authBtn.style.color = '#1e40af';
                  authBtn.style.borderColor = 'rgba(30,64,175,.20)';
                  authBtn.style.backgroundColor = 'rgba(30,64,175,.08)';
                  
                  // Ensure label text is visible and matches homepage
                  const label = authBtn.querySelector('.thg-label');
                  if (label) {
                    label.style.color = '#1e40af';
                    label.style.fontWeight = '600';
                    // Ensure label has text (auth system sets it to "Login / Signup" when not authenticated)
                    if (!label.textContent || label.textContent.trim() === '') {
                      label.textContent = 'Login / Signup';
                    }
                    // Force label to be visible
                    label.style.display = 'inline';
                    label.style.visibility = 'visible';
                    label.style.opacity = '1';
                  }
                  
                  // Ensure button is properly aligned in flex layout
                  authBtn.style.margin = '0';
                  authBtn.style.verticalAlign = 'middle';
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
              
              // Also check periodically to ensure auth button stays visible
              setInterval(function() {
                const authBtn = document.querySelector('header.nav .thg-auth-btn');
                const authContainer = document.getElementById('site-header-auth-container');
                
                if (authContainer) {
                  const style = window.getComputedStyle(authContainer);
                  if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) {
                    authContainer.style.display = 'flex';
                    authContainer.style.visibility = 'visible';
                    authContainer.style.opacity = '1';
                  }
                }
                
                if (authBtn) {
                  const btnStyle = window.getComputedStyle(authBtn);
                  if (btnStyle.display === 'none' || btnStyle.visibility === 'hidden' || parseFloat(btnStyle.opacity) < 0.1) {
                    authBtn.style.display = 'inline-flex';
                    authBtn.style.visibility = 'visible';
                    authBtn.style.opacity = '1';
                  }
                  
                  // Ensure label has text
                  const label = authBtn.querySelector('.thg-label');
                  if (label && (!label.textContent || label.textContent.trim() === '')) {
                    label.textContent = 'Login / Signup';
                  }
                }
              }, 300);
              
              // Portal menu update function (called by role manager)
              // Portal menu is ALWAYS VISIBLE - shows login prompt if user not authenticated
              window.__updatePortalMenu = function() {
                const portalMenuItems = document.getElementById('portal-menu-items');
                const portalMenu = document.getElementById('portal-menu');
                if (!portalMenuItems || !portalMenu) return;
                
                // Portal menu is always visible - no hiding logic
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
                
                // Build menu HTML based on user state
                let menuHTML = '';
                
                // Always show Buyer Dashboard link first (matches homepage order)
                if (isLoggedIn && (userRoles.includes('buyer') || isAdminOwner)) {
                  const active = primaryRole === 'buyer' ? '<span style="color:#10b981;font-weight:800;font-size:16px;margin-left:auto;">✓</span>' : '';
                  menuHTML += '<a href="/my-dashboard" data-next-link data-portal-link="buyer" style="display:flex;align-items:center;justify-content:space-between;text-align:left;"><span style="display:flex;align-items:center;gap:8px;">🏠 Buyer Dashboard</span>' + active + '</a>';
                } else {
                  // Not logged in or no buyer role - show locked version
                  menuHTML += '<a href="/my-dashboard" data-portal-link="buyer" data-requires-auth="true" style="opacity:0.7;cursor:pointer;display:flex;align-items:center;justify-content:space-between;text-align:left;"><span style="display:flex;align-items:center;gap:8px;">🏠 Buyer Dashboard</span><span style="color:#6b7280;font-size:11px;">🔒 Login Required</span></a>';
                }
                
                // Always show Builder Dashboard link
                if (isLoggedIn && (userRoles.includes('builder') || isAdminOwner)) {
                  const active = primaryRole === 'builder' ? '<span style="color:#10b981;font-weight:800;font-size:16px;margin-left:auto;">✓</span>' : '';
                  const verified = builderVerified ? '<span style="color:#10b981;font-size:11px;margin-left:auto;">✓ Verified</span>' : '';
                  menuHTML += '<a href="/builder" data-next-link data-portal-link="builder" style="display:flex;align-items:center;justify-content:space-between;text-align:left;"><span style="display:flex;align-items:center;gap:8px;">🏗️ Builder Dashboard</span>' + (active || verified) + '</a>';
                } else {
                  // Not logged in or no builder role - show locked version
                  menuHTML += '<a href="/builder" data-portal-link="builder" data-requires-auth="true" style="opacity:0.7;cursor:pointer;display:flex;align-items:center;justify-content:space-between;text-align:left;"><span style="display:flex;align-items:center;gap:8px;">🏗️ Builder Dashboard</span><span style="color:#6b7280;font-size:11px;">🔒 Login Required</span></a>';
                }
                
                // Admin Panel (only if logged in and admin)
                if (isLoggedIn && (userRoles.includes('admin') || isAdminOwner)) {
                  menuHTML += '<a href="/admin" data-next-link style="border-top:1px solid #e5e7eb;margin-top:8px;padding-top:8px;display:flex;align-items:center;justify-content:space-between;text-align:left;"><span style="display:flex;align-items:center;gap:8px;">🛡️ Admin Panel</span></a>';
                }
                
                portalMenuItems.innerHTML = menuHTML;
                
                // Intercept portal link clicks - show login prompt if not authenticated
                const portalLinks = portalMenuItems.querySelectorAll('a[data-portal-link]');
                portalLinks.forEach(function(link) {
                  // Remove old listeners
                  const newLink = link.cloneNode(true);
                  link.parentNode.replaceChild(newLink, link);
                  
                  newLink.addEventListener('click', function(e) {
                    const requiresAuth = newLink.getAttribute('data-requires-auth') === 'true';
                    const portalType = newLink.getAttribute('data-portal-link');
                    
                    if (requiresAuth) {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Redirect to login page instead of showing modal
                      const next = newLink.getAttribute('href') || '/';
                      window.location.href = '/login?next=' + encodeURIComponent(next);
                    } else {
                      // User is authenticated - allow navigation
                      // Let HeaderLinkInterceptor handle it
                    }
                  });
                });
                
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
              
              // Initialize portal menu - always visible
              function initPortalMenu() {
                // Portal menu is always visible - initialize immediately
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



