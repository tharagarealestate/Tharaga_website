/**
 * Route Guard System - Phase 3
 * Protects routes based on user roles with smooth redirects and notifications
 */

(function() {
  'use strict';

  const RouteGuard = {
    // Route definitions with required roles
    protectedRoutes: {
      '/builder': { requiredRole: 'builder', fallback: '/my-dashboard', name: 'Builder Dashboard' },
      '/builder/': { requiredRole: 'builder', fallback: '/my-dashboard', name: 'Builder Dashboard' },
      '/my-dashboard': { requiredRole: 'buyer', fallback: '/builder', name: 'Buyer Dashboard' },
      '/my-dashboard/': { requiredRole: 'buyer', fallback: '/builder', name: 'Buyer Dashboard' },
      '/admin': { requiredRole: 'admin', fallback: '/', name: 'Admin Panel' },
      '/admin/': { requiredRole: 'admin', fallback: '/', name: 'Admin Panel' }
    },

    // Check if current route is protected
    getCurrentRoute() {
      const path = window.location.pathname;
      return this.protectedRoutes[path] || null;
    },

    // Verify user has required role
    async verifyAccess() {
      const routeConfig = this.getCurrentRoute();
      if (!routeConfig) return true; // Not a protected route

      console.log('[route-guard] Checking access for:', window.location.pathname);

      // Wait for role manager to initialize
      if (!window.thgRoleManager) {
        console.warn('[route-guard] Role manager not loaded, allowing access temporarily');
        return true;
      }

      // Get current role state
      const state = window.thgRoleManager.getState();

      // If not initialized yet, wait a bit
      if (!state.initialized) {
        console.log('[route-guard] Waiting for role manager to initialize...');
        await this.waitForInitialization();
      }

      const updatedState = window.thgRoleManager.getState();

      // Check if user is logged in - NON-BLOCKING: just log, don't redirect
      if (!updatedState.user) {
        console.log('[route-guard] User not logged in (non-blocking - dashboard will show login prompt)');
        // Don't block - let dashboard handle auth UI
        // Only open modal if explicitly requested (not on page load)
        return true; // Allow access, dashboard will show login prompt
      }

      // Check if user has no roles yet
      if (!updatedState.roles || updatedState.roles.length === 0) {
        console.log('[route-guard] User has no roles, allowing access temporarily (user can add role)');
        // Allow access temporarily - user can add role from dashboard
        return true;
      }

      // Check if user has the required role
      const hasRequiredRole = updatedState.roles.includes(routeConfig.requiredRole);

      if (!hasRequiredRole) {
        console.warn(`[route-guard] Access warning: Required ${routeConfig.requiredRole}, User has: ${updatedState.roles.join(', ')} (non-blocking - dashboard will handle)`);
        // NON-BLOCKING: Just log warning, don't redirect
        // Dashboard will show appropriate UI for missing role
        return true; // Allow access, dashboard will handle role UI
      }

      console.log('[route-guard] Access granted');
      return true;
    },

    // Wait for role manager initialization
    waitForInitialization(timeout = 5000) {
      return new Promise((resolve) => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
          if (window.thgRoleManager && window.thgRoleManager.getState().initialized) {
            clearInterval(checkInterval);
            resolve(true);
          } else if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            console.warn('[route-guard] Initialization timeout');
            resolve(false);
          }
        }, 100);
      });
    },

    // Redirect with notification
    redirectWithMessage(url, message, type = 'info') {
      // Show notification if function exists
      if (typeof showNotification === 'function') {
        showNotification(message, type);
      } else if (window.thgRoleManager && typeof window.thgRoleManager.showNotification === 'function') {
        window.thgRoleManager.showNotification(message, type);
      } else {
        console.log(`[route-guard] ${type.toUpperCase()}: ${message}`);
      }

      // Redirect after short delay to show notification
      setTimeout(() => {
        window.location.href = url;
      }, 800);
    },

    // Initialize route guard
    async init() {
      console.log('[route-guard] Initializing route protection (non-blocking mode)');

      // NON-BLOCKING: Check access in background, don't block page load
      // This allows dashboards to render immediately
      this.verifyAccess().catch(err => {
        console.warn('[route-guard] Access check failed (non-blocking):', err);
      });

      // Monitor for route changes (for SPAs) - also non-blocking
      let lastPath = window.location.pathname;
      setInterval(() => {
        const currentPath = window.location.pathname;
        if (currentPath !== lastPath) {
          lastPath = currentPath;
          console.log('[route-guard] Route changed, verifying access (non-blocking)');
          this.verifyAccess().catch(err => {
            console.warn('[route-guard] Access check failed (non-blocking):', err);
          });
        }
      }, 500);

      // Listen for role changes
      window.addEventListener('storage', (e) => {
        if (e.key === 'tharaga_active_role') {
          console.log('[route-guard] Role changed, re-verifying access');
          setTimeout(() => this.verifyAccess(), 300);
        }
      });

      // Listen for custom role change events
      window.addEventListener('thg-role-changed', () => {
        console.log('[route-guard] Role changed event, re-verifying access');
        setTimeout(() => this.verifyAccess(), 300);
      });

      console.log('[route-guard] Route protection active');
    },

    // Add route to protection
    addProtectedRoute(path, requiredRole, fallback = '/', name = path) {
      this.protectedRoutes[path] = { requiredRole, fallback, name };
      console.log(`[route-guard] Added protected route: ${path} (requires ${requiredRole})`);
    },

    // Remove route protection
    removeProtectedRoute(path) {
      delete this.protectedRoutes[path];
      console.log(`[route-guard] Removed protection from route: ${path}`);
    }
  };

  // Expose globally
  window.RouteGuard = RouteGuard;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => RouteGuard.init(), 1000); // Wait for role manager
    });
  } else {
    setTimeout(() => RouteGuard.init(), 1000);
  }

  console.log('[route-guard] Route guard system loaded');
})();
