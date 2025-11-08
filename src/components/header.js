/**
 * Tharaga Global Header JavaScript
 * =================================
 * 
 * Handles all header functionality:
 * - Portal menu updates based on auth state
 * - Login prompt modals for locked dashboards
 * - Link interception for client-side navigation
 * - Accessibility (keyboard navigation, ARIA)
 * - Mobile menu toggle
 * 
 * USAGE:
 * - Load this file after header.html is in the DOM
 * - Requires: window.thgRoleManager (role manager system)
 * - Optional: window.__nextRouter (Next.js router for client-side navigation)
 */

(function() {
  'use strict';

  // Ensure auth container is ready for auth system injection
  function ensureAuthContainer() {
    const header = document.getElementById('tharaga-static-header');
    const authContainer = document.getElementById('site-header-auth-container');
    
    if (header && authContainer) {
      // Make header position relative if needed for absolute positioning of auth wrap
      const headerStyle = window.getComputedStyle(header);
      if (headerStyle.position === 'static') {
        header.style.position = 'relative';
      }
    }
  }

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
        console.error('[tharaga-header] Error getting role state:', e);
      }
    }
    
    // Build menu HTML based on user state
    let menuHTML = '';
    
    // Always show Builder Dashboard link
    if (isLoggedIn && (userRoles.includes('builder') || isAdminOwner)) {
      const active = primaryRole === 'builder' ? ' <span style="color:#10b981">✓</span>' : '';
      const verified = builderVerified ? ' <span style="color:#10b981;font-size:11px">✓ Verified</span>' : '';
      menuHTML += '<a href="/builder" data-next-link data-portal-link="builder">🏗️ Builder Dashboard' + active + verified + '</a>';
    } else {
      // Not logged in or no builder role - show locked version
      menuHTML += '<a href="/builder" data-portal-link="builder" data-requires-auth="true" style="opacity:0.7;cursor:pointer;">🏗️ Builder Dashboard <span style="color:#6b7280;font-size:11px">🔒 Login Required</span></a>';
    }
    
    // Always show Buyer Dashboard link
    if (isLoggedIn && (userRoles.includes('buyer') || isAdminOwner)) {
      const active = primaryRole === 'buyer' ? ' <span style="color:#10b981">✓</span>' : '';
      menuHTML += '<a href="/my-dashboard" data-next-link data-portal-link="buyer">🏠 Buyer Dashboard' + active + '</a>';
    } else {
      // Not logged in or no buyer role - show locked version
      menuHTML += '<a href="/my-dashboard" data-portal-link="buyer" data-requires-auth="true" style="opacity:0.7;cursor:pointer;">🏠 Buyer Dashboard <span style="color:#6b7280;font-size:11px">🔒 Login Required</span></a>';
    }
    
    // Admin Panel (only if logged in and admin)
    if (isLoggedIn && (userRoles.includes('admin') || isAdminOwner)) {
      menuHTML += '<a href="/admin" data-next-link style="border-top:1px solid #e5e7eb;margin-top:8px;padding-top:8px;">🛡️ Admin Panel</a>';
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
          
          // Show professional login prompt
          showLoginPrompt(portalType);
        } else {
          // User is authenticated - allow navigation
          // Let link interceptor handle it
        }
      });
    });
    
    // Re-intercept regular links after portal menu update
    interceptHeaderLinks();
  };
  
  // Professional login prompt function
  function showLoginPrompt(portalType) {
    const portalName = portalType === 'builder' ? 'Builder Dashboard' : 'Buyer Dashboard';
    const portalIcon = portalType === 'builder' ? '🏗️' : '🏠';
    const portalDesc = portalType === 'builder' 
      ? 'Manage your properties, track leads, and grow your business'
      : 'Save properties, schedule visits, and track your home search';
    
    // Create professional modal overlay
    const existingModal = document.getElementById('thg-portal-login-prompt');
    if (existingModal) {
      existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'thg-portal-login-prompt';
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); backdrop-filter: saturate(140%) blur(6px); display: flex; align-items: center; justify-content: center; z-index: 99999; visibility: visible; opacity: 1; transition: opacity 0.18s ease;';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'width: 100%; max-width: 420px; background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98)); color: #111; border: 1px solid rgba(30,64,175,0.12); border-radius: 16px; box-shadow: 0 30px 60px rgba(30,64,175,0.16); transform: translateY(0) scale(1); opacity: 1; transition: transform 0.18s ease, opacity 0.18s ease;';
    
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid rgba(30,64,175,0.08);';
    
    const headerLeft = document.createElement('div');
    headerLeft.style.cssText = 'display: flex; align-items: center; gap: 12px;';
    headerLeft.innerHTML = '<span style="font-size: 32px;">' + portalIcon + '</span><h2 style="margin: 0; font-weight: 800; font-size: 20px; color: #0f172a;">' + portalName + '</h2>';
    
    const closeBtn = document.createElement('button');
    closeBtn.id = 'thg-portal-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.style.cssText = 'appearance: none; background: transparent; border: 0; color: #6b7280; cursor: pointer; font-size: 24px; line-height: 1; padding: 4px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: background 0.15s ease, color 0.15s ease;';
    closeBtn.textContent = '×';
    
    header.appendChild(headerLeft);
    header.appendChild(closeBtn);
    
    const body = document.createElement('div');
    body.style.cssText = 'padding: 24px;';
    
    const desc = document.createElement('p');
    desc.style.cssText = 'margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;';
    desc.textContent = portalDesc;
    
    const lockBox = document.createElement('div');
    lockBox.style.cssText = 'background: linear-gradient(135deg, rgba(30,64,175,0.08), rgba(59,130,246,0.06)); border: 1px solid rgba(30,64,175,0.12); border-radius: 12px; padding: 16px; margin-bottom: 20px;';
    lockBox.innerHTML = '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;"><span style="color: #1e40af; font-size: 18px;">🔒</span><span style="font-weight: 700; color: #0f172a; font-size: 14px;">Login Required</span></div><p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">Please sign in to access your ' + portalName.toLowerCase() + '. Create an account if you don\'t have one yet.</p>';
    
    const loginBtn = document.createElement('button');
    loginBtn.id = 'thg-portal-login-btn';
    loginBtn.style.cssText = 'width: 100%; appearance: none; background: linear-gradient(180deg, #f8d34a, #f0b90b, #c89200); color: #111; border: 1px solid rgba(250, 204, 21, 0.9); border-radius: 12px; padding: 14px 18px; font-weight: 800; font-size: 15px; cursor: pointer; transition: transform 0.06s ease, box-shadow 0.06s ease, filter 0.12s ease; box-shadow: 0 4px 0 rgba(250, 204, 21, 0.35); margin-bottom: 12px;';
    loginBtn.textContent = 'Sign In / Sign Up';
    
    const footer = document.createElement('p');
    footer.style.cssText = 'margin: 0; text-align: center; color: #64748b; font-size: 12px;';
    footer.textContent = 'Free to join • No credit card required';
    
    body.appendChild(desc);
    body.appendChild(lockBox);
    body.appendChild(loginBtn);
    body.appendChild(footer);
    
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    const closeModal = function() {
      modal.style.opacity = '0';
      setTimeout(function() {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        document.body.style.overflow = '';
      }, 180);
    };
    
    closeBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('mouseenter', function() {
      closeBtn.style.background = 'rgba(0,0,0,0.05)';
      closeBtn.style.color = '#111';
    });
    closeBtn.addEventListener('mouseleave', function() {
      closeBtn.style.background = 'transparent';
      closeBtn.style.color = '#6b7280';
    });
    
    loginBtn.addEventListener('click', function() {
      closeModal();
      const next = portalType === 'builder' ? '/builder' : '/my-dashboard';
      try {
        if (window.authGate && typeof window.authGate.openLoginModal === 'function') {
          window.authGate.openLoginModal({ next: next });
        } else if (typeof window.__thgOpenAuthModal === 'function') {
          window.__thgOpenAuthModal({ next: next });
        } else {
          window.location.href = '/login?next=' + encodeURIComponent(next);
        }
      } catch(e) {
        console.error('[tharaga-header] Error opening auth modal:', e);
        window.location.href = '/login?next=' + encodeURIComponent(next);
      }
    });
    loginBtn.addEventListener('mouseenter', function() {
      loginBtn.style.filter = 'brightness(1.03)';
    });
    loginBtn.addEventListener('mouseleave', function() {
      loginBtn.style.filter = 'none';
    });
    loginBtn.addEventListener('mousedown', function() {
      loginBtn.style.transform = 'translateY(1px)';
      loginBtn.style.boxShadow = 'none';
    });
    loginBtn.addEventListener('mouseup', function() {
      loginBtn.style.transform = 'translateY(0)';
      loginBtn.style.boxShadow = '0 4px 0 rgba(250, 204, 21, 0.35)';
    });
    
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    const escHandler = function(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    setTimeout(function() {
      if (loginBtn) loginBtn.focus();
    }, 50);
  }

  // Intercept header links for client-side navigation (Next.js)
  function interceptHeaderLinks() {
    const header = document.getElementById('tharaga-static-header');
    if (!header) return;
    
    const links = header.querySelectorAll('a[data-next-link], a[href^="/"]');
    links.forEach(function(link) {
      if (link.hasAttribute('data-next-link-processed')) return;
      link.setAttribute('data-next-link-processed', 'true');
      
      link.addEventListener('click', function(e) {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http')) return;
        
        // Skip if it's a portal link that requires auth (handled separately)
        if (link.getAttribute('data-requires-auth') === 'true') {
          return;
        }
        
        e.preventDefault();
        
        // Use Next.js router if available
        if (window.__nextRouter) {
          window.__nextRouter.push(href);
        } else {
          // Fallback to regular navigation
          window.location.href = href;
        }
      });
    });
  }
  
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
  
  // Initialize header functionality
  function init() {
    ensureAuthContainer();
    interceptHeaderLinks();
    initPortalMenu();
    
    // Re-intercept links when DOM changes (e.g., portal menu updates)
    const observer = new MutationObserver(function() {
      setTimeout(interceptHeaderLinks, 50);
    });
    
    const headerEl = document.getElementById('tharaga-static-header');
    if (headerEl) {
      observer.observe(headerEl, {
        childList: true,
        subtree: true
      });
    }
  }
  
  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

