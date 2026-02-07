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

  // Beautiful login prompt modal for non-authenticated users
  function showLoginPromptModal() {
    // Remove any existing modal
    const existingModal = document.getElementById('thg-portal-login-prompt');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'thg-portal-login-prompt';
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px) saturate(180%); display: flex; align-items: center; justify-content: center; z-index: 99999; visibility: visible; opacity: 1; transition: opacity 0.25s ease; padding: 20px;';
    
    // Create modal content with beautiful design
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'width: 100%; max-width: 480px; background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98)); color: #111; border: 2px solid rgba(212,175,55,0.3); border-radius: 24px; box-shadow: 0 32px 64px rgba(30,64,175,0.2), 0 0 0 1px rgba(212,175,55,0.1); transform: translateY(0) scale(1); opacity: 1; transition: transform 0.25s ease, opacity 0.25s ease; position: relative; overflow: hidden;';
    
    // Gold gradient top border
    const topBorder = document.createElement('div');
    topBorder.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #d4af37, #f5d779, #d4af37);';
    modalContent.appendChild(topBorder);
    
    // Header section
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 28px 28px 20px; position: relative; z-index: 1;';
    
    const headerLeft = document.createElement('div');
    headerLeft.style.cssText = 'display: flex; align-items: center; gap: 14px;';
    headerLeft.innerHTML = '<div style="width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #d4af37, #f5d779); display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 8px 20px rgba(212,175,55,0.3);">🔐</div><div><h2 style="margin: 0; font-weight: 900; font-size: 24px; color: #0f172a; letter-spacing: -0.02em; line-height: 1.2;">Welcome to Tharaga!</h2><p style="margin: 4px 0 0; color: #64748b; font-size: 14px; font-weight: 500;">Your real estate journey starts here</p></div>';
    
    const closeBtn = document.createElement('button');
    closeBtn.id = 'thg-portal-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.style.cssText = 'appearance: none; background: rgba(0,0,0,0.04); border: 0; color: #64748b; cursor: pointer; font-size: 22px; line-height: 1; padding: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; transition: all 0.2s ease;';
    closeBtn.innerHTML = '×';
    
    header.appendChild(headerLeft);
    header.appendChild(closeBtn);
    
    // Body section
    const body = document.createElement('div');
    body.style.cssText = 'padding: 0 28px 28px; position: relative; z-index: 1;';
    
    // Catchy message
    const message = document.createElement('div');
    message.style.cssText = 'background: linear-gradient(135deg, rgba(30,64,175,0.08), rgba(59,130,246,0.06)); border: 1px solid rgba(30,64,175,0.12); border-radius: 16px; padding: 20px; margin-bottom: 24px; position: relative; overflow: hidden;';
    message.innerHTML = '<div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: radial-gradient(circle, rgba(212,175,55,0.15), transparent); border-radius: 50%;"></div><div style="position: relative; z-index: 1;"><div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;"><span style="font-size: 20px;">✨</span><span style="font-weight: 800; color: #0f172a; font-size: 16px;">Unlock Your Real Estate Potential</span></div><p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">Sign in to access exclusive dashboards, save properties, track leads, and connect directly with verified builders. Join thousands of smart investors!</p></div>';
    
    // Features list
    const features = document.createElement('div');
    features.style.cssText = 'margin-bottom: 24px;';
    features.innerHTML = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;"><div style="display: flex; align-items: center; gap: 8px; padding: 10px; background: rgba(255,255,255,0.6); border-radius: 10px;"><span style="font-size: 18px;">🏗️</span><span style="font-size: 13px; font-weight: 600; color: #0f172a;">Builder Portal</span></div><div style="display: flex; align-items: center; gap: 8px; padding: 10px; background: rgba(255,255,255,0.6); border-radius: 10px;"><span style="font-size: 18px;">🏠</span><span style="font-size: 13px; font-weight: 600; color: #0f172a;">Buyer Dashboard</span></div></div>';
    
    // CTA Button
    const loginBtn = document.createElement('button');
    loginBtn.id = 'thg-portal-login-btn';
    loginBtn.style.cssText = 'width: 100%; appearance: none; background: linear-gradient(135deg, #d4af37, #f5d779, #c89200); color: #0f172a; border: 0; border-radius: 14px; padding: 16px 24px; font-weight: 800; font-size: 16px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 6px 20px rgba(212,175,55,0.35), 0 0 0 1px rgba(212,175,55,0.2); margin-bottom: 16px; letter-spacing: 0.01em;';
    loginBtn.textContent = 'Sign In / Create Account';
    
    // Footer text
    const footer = document.createElement('p');
    footer.style.cssText = 'margin: 0; text-align: center; color: #64748b; font-size: 13px; font-weight: 500;';
    footer.innerHTML = '🚀 <strong style="color: #1e40af;">100% Free</strong> • No credit card required • Join in seconds';
    
    body.appendChild(message);
    body.appendChild(features);
    body.appendChild(loginBtn);
    body.appendChild(footer);
    
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Close modal function
    const closeModal = function() {
      modal.style.opacity = '0';
      modalContent.style.transform = 'translateY(10px) scale(0.98)';
      setTimeout(function() {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        document.body.style.overflow = '';
      }, 250);
    };
    
    // Close button handlers
    closeBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('mouseenter', function() {
      closeBtn.style.background = 'rgba(0,0,0,0.08)';
      closeBtn.style.color = '#0f172a';
    });
    closeBtn.addEventListener('mouseleave', function() {
      closeBtn.style.background = 'rgba(0,0,0,0.04)';
      closeBtn.style.color = '#64748b';
    });
    
    // Login button handlers
    loginBtn.addEventListener('click', function() {
      closeModal();
      setTimeout(function() {
        try {
          if (window.authGate && typeof window.authGate.openLoginModal === 'function') {
            window.authGate.openLoginModal({ next: location.pathname + location.search });
          } else if (typeof window.__thgOpenAuthModal === 'function') {
            window.__thgOpenAuthModal({ next: location.pathname + location.search });
          } else {
            window.location.href = '/login';
          }
        } catch(e) {
          console.error('[tharaga-header] Error opening auth modal:', e);
          window.location.href = '/login';
        }
      }, 100);
    });
    
    loginBtn.addEventListener('mouseenter', function() {
      loginBtn.style.transform = 'translateY(-2px)';
      loginBtn.style.boxShadow = '0 8px 24px rgba(212,175,55,0.4), 0 0 0 1px rgba(212,175,55,0.3)';
    });
    loginBtn.addEventListener('mouseleave', function() {
      loginBtn.style.transform = 'translateY(0)';
      loginBtn.style.boxShadow = '0 6px 20px rgba(212,175,55,0.35), 0 0 0 1px rgba(212,175,55,0.2)';
    });
    
    // Close on backdrop click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Close on Escape key
    const escHandler = function(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // Focus login button
    setTimeout(function() {
      if (loginBtn) loginBtn.focus();
    }, 100);
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
    
    // Fallback: check auth state directly if role manager not available
    if (!isLoggedIn) {
      try {
        if (window.__thgAuthState && window.__thgAuthState.user && window.__thgAuthState.user.email) {
          isLoggedIn = true;
        } else if (window.__authGateLoggedIn === true) {
          isLoggedIn = true;
        }
      } catch(e) {
        // Ignore errors
      }
    }
    
    // Intercept Portal dropdown summary click when user is NOT logged in
    const portalSummary = portalMenu.querySelector('summary');
    if (portalSummary) {
      // Remove old listeners by cloning
      const newSummary = portalSummary.cloneNode(true);
      portalSummary.parentNode.replaceChild(newSummary, portalSummary);
      
      newSummary.addEventListener('click', function(e) {
        if (!isLoggedIn) {
          e.preventDefault();
          e.stopPropagation();
          // Close dropdown if it's open
          portalMenu.removeAttribute('open');
          // Show beautiful login prompt modal
          showLoginPromptModal();
        }
        // If logged in, let the dropdown open normally
      });
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
          
          // FORCE REMOVE any nested containers before opening modal
          const authGateModal = document.getElementById('authGateModal');
          if (authGateModal) authGateModal.remove();
          const portalPrompt = document.getElementById('thg-portal-login-prompt');
          if (portalPrompt) portalPrompt.remove();
          const iframes = document.querySelectorAll('iframe[id*="authGate"], iframe[src*="login_signup_glassdrop"]');
          iframes.forEach(function(iframe) { if (iframe.parentElement) iframe.parentElement.remove(); });
          const nestedAuth = document.querySelectorAll('.authgate-backdrop, .authgate-dialog, .authgate-frame-wrap');
          nestedAuth.forEach(function(el) { if (el.parentElement) el.parentElement.remove(); });
          
          // Open login modal instead of redirecting
          const next = newLink.getAttribute('href') || '/';
          try {
            // Use inline modal via __thgOpenAuthModal (preferred)
            if (typeof window.__thgOpenAuthModal === 'function') {
              window.__thgOpenAuthModal({ next: next });
              return;
            }
            // Fallback to authGate.openLoginModal (which now uses inline modal)
            if (window.authGate && typeof window.authGate.openLoginModal === 'function') {
              window.authGate.openLoginModal({ next: next });
              return;
            }
            // Last resort: wait a bit for modal to initialize, then try again
            setTimeout(function() {
              // Remove nested containers again before retry
              const authGateModal2 = document.getElementById('authGateModal');
              if (authGateModal2) authGateModal2.remove();
              const portalPrompt2 = document.getElementById('thg-portal-login-prompt');
              if (portalPrompt2) portalPrompt2.remove();
              
              if (typeof window.__thgOpenAuthModal === 'function') {
                window.__thgOpenAuthModal({ next: next });
              } else if (window.authGate && typeof window.authGate.openLoginModal === 'function') {
                window.authGate.openLoginModal({ next: next });
              } else {
                console.warn('[header] Login modal functions not available, redirecting to /login');
                window.location.href = '/login?next=' + encodeURIComponent(next);
              }
            }, 500);
          } catch(err) {
            console.error('[header] Error opening login modal:', err);
            // Fallback on error
            window.location.href = '/login?next=' + encodeURIComponent(next);
          }
        } else {
          // User is authenticated - allow navigation
          // Let link interceptor handle it
        }
      });
    });
    
    // Re-intercept regular links after portal menu update
    interceptHeaderLinks();
  };
  
  // showLoginPrompt function REMOVED - redirects to /login instead
  // This function is no longer needed - portal links redirect directly
  function showLoginPrompt_DISABLED(portalType) {
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
  
  // Homepage sticky shrink behavior
  function initHomepageHeader() {
    const header = document.getElementById('tharaga-static-header');
    if (!header) return;
    
    // Check if we're on homepage (has .hero-premium class or homepage-header class)
    const isHomepage = document.querySelector('.hero-premium') || document.body.classList.contains('homepage-header');
    if (!isHomepage) return;
    
    // Add class to body for CSS fallback (for browsers that don't support :has())
    document.body.classList.add('homepage-header');
    
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    function updateHeader() {
      const scrollY = window.scrollY;
      
      if (scrollY > 50) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
      
      lastScrollY = scrollY;
      ticking = false;
    }
    
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }
    
    window.addEventListener('scroll', onScroll, { passive: true });
    updateHeader(); // Initial check
  }
  
  // Mobile menu functionality
  function initMobileMenu() {
    const header = document.getElementById('tharaga-static-header');
    if (!header) return;
    
    const toggleBtn = header.querySelector('.mobile-menu-toggle');
    const closeBtn = header.querySelector('.mobile-menu-close');
    const overlay = header.querySelector('.mobile-menu-overlay');
    const panel = header.querySelector('.mobile-menu-panel');
    const desktopNav = header.querySelector('nav.row');
    
    if (!toggleBtn || !overlay || !panel) return;
    
    // Populate mobile menu with desktop nav items
    function populateMobileMenu() {
      if (!desktopNav || !panel) return;
      
      const menuItems = desktopNav.querySelectorAll('a, details');
      let menuHTML = '';
      
      menuItems.forEach(function(item) {
        if (item.tagName === 'A') {
          const href = item.getAttribute('href') || '#';
          const text = item.textContent.trim();
          menuHTML += '<a href="' + href + '" data-next-link>' + text + '</a>';
        } else if (item.tagName === 'DETAILS') {
          const summary = item.querySelector('summary');
          const menu = item.querySelector('.menu');
          if (summary && menu) {
            menuHTML += '<div class="mobile-menu-group">';
            menuHTML += '<div class="mobile-menu-title">' + summary.textContent.trim() + '</div>';
            const links = menu.querySelectorAll('a');
            links.forEach(function(link) {
              const href = link.getAttribute('href') || '#';
              const text = link.textContent.trim();
              menuHTML += '<a href="' + href + '" data-next-link class="mobile-menu-item">' + text + '</a>';
            });
            menuHTML += '</div>';
          }
        }
      });
      
      // Add auth buttons if available
      const authContainer = header.querySelector('#site-header-auth-container');
      if (authContainer) {
        const authLinks = authContainer.querySelectorAll('a, button');
        if (authLinks.length > 0) {
          menuHTML += '<div class="mobile-menu-divider"></div>';
          authLinks.forEach(function(link) {
            const href = link.getAttribute('href') || '#';
            const text = link.textContent.trim();
            const isButton = link.tagName === 'BUTTON';
            if (isButton) {
              menuHTML += '<button class="mobile-menu-cta">' + text + '</button>';
            } else {
              menuHTML += '<a href="' + href + '" data-next-link class="mobile-menu-cta">' + text + '</a>';
            }
          });
        }
      }
      
      panel.innerHTML = '<button class="mobile-menu-close" aria-label="Close menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' + menuHTML;
      
      // Re-attach close button listener
      const newCloseBtn = panel.querySelector('.mobile-menu-close');
      if (newCloseBtn) {
        newCloseBtn.addEventListener('click', closeMenu);
      }
      
      // Re-intercept links
      interceptHeaderLinks();
    }
    
    function openMenu() {
      overlay.classList.add('is-open');
      panel.classList.add('is-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      
      // Populate menu on open
      populateMobileMenu();
    }
    
    function closeMenu() {
      overlay.classList.remove('is-open');
      panel.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    
    toggleBtn.addEventListener('click', openMenu);
    overlay.addEventListener('click', closeMenu);
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        closeMenu();
      }
    });
    
    // Show/hide toggle button based on screen size
    function updateMobileMenuVisibility() {
      if (window.innerWidth <= 767) {
        toggleBtn.style.display = 'flex';
      } else {
        toggleBtn.style.display = 'none';
        closeMenu(); // Close menu if resizing to desktop
      }
    }
    
    window.addEventListener('resize', updateMobileMenuVisibility);
    updateMobileMenuVisibility();
  }
  
  // Initialize header functionality
  function init() {
    ensureAuthContainer();
    interceptHeaderLinks();
    initPortalMenu();
    initHomepageHeader();
    initMobileMenu();
    
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

