/**
 * Tharaga Enhanced Role Management System
 * Complete role switcher UI with dynamic menus and badges
 */

(function() {
  if (window.__thgRoleManagerEnhanced) return;
  window.__thgRoleManagerEnhanced = true;

  // Enhanced role state
  const roleState = {
    roles: [],
    primaryRole: null,
    builderVerified: false,
    hasBuilderProfile: false,
    hasBuyerProfile: false,
    loading: true,
    initialized: false,
  };

  // API helper with better error handling
  async function apiCall(endpoint, options = {}) {
    const token = await window.supabase?.auth?.getSession?.().then(r => r?.data?.session?.access_token);
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Fetch user roles
  async function fetchUserRoles() {
    try {
      console.log('[role-manager] Fetching user roles...');
      const data = await apiCall('/api/user/roles');
      roleState.roles = data.roles || [];
      roleState.primaryRole = data.primary_role;
      roleState.builderVerified = data.builder_verified || false;
      roleState.hasBuilderProfile = data.has_builder_profile || false;
      roleState.hasBuyerProfile = data.has_buyer_profile || false;
      roleState.loading = false;
      roleState.initialized = true;
      console.log('[role-manager] Roles fetched:', roleState);
      return roleState;
    } catch (error) {
      console.error('[role-manager] Error fetching roles:', error);
      roleState.loading = false;
      roleState.initialized = false;
      return null;
    }
  }

  // Add role
  async function addRole(role, data = {}) {
    try {
      console.log('[role-manager] Adding role:', role);
      const result = await apiCall('/api/user/add-role', {
        method: 'POST',
        body: JSON.stringify({ role, ...data }),
      });

      // Refresh roles
      await fetchUserRoles();

      // Rebuild menu
      if (window.__thgUpdateMenu) {
        window.__thgUpdateMenu();
      }

      return result;
    } catch (error) {
      console.error('[role-manager] Error adding role:', error);
      throw error;
    }
  }

  // Switch role
  async function switchRole(role) {
    try {
      console.log('[role-manager] Switching to role:', role);

      const result = await apiCall('/api/user/switch-role', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });

      roleState.primaryRole = role;

      // Store in localStorage for persistence
      try {
        localStorage.setItem('tharaga_active_role', role);
      } catch(e) {}

      // Rebuild menu
      if (window.__thgUpdateMenu) {
        window.__thgUpdateMenu();
      }

      // Broadcast role change
      try {
        const bc = new BroadcastChannel('tharaga-role');
        bc.postMessage({ type: 'ROLE_SWITCHED', role });
      } catch(e) {}

      return result;
    } catch (error) {
      console.error('[role-manager] Error switching role:', error);
      throw error;
    }
  }

  // Check if needs onboarding
  async function needsOnboarding() {
    if (!roleState.initialized) await fetchUserRoles();
    return roleState.roles.length === 0;
  }

  // Enhanced role selection modal (from previous implementation)
  function showRoleSelectionModal() {
    const existing = document.getElementById('thg-role-onboarding');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'thg-role-onboarding';
    modal.className = 'thg-role-modal-overlay';
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="thg-role-modal">
        <div class="thg-role-header">
          <h2>🎉 Welcome to Tharaga!</h2>
          <p>Let's get you started. What brings you here today?</p>
        </div>
        <div class="thg-role-body">
          <div class="thg-role-cards">
            <button class="thg-role-card" data-role="buyer">
              <div class="thg-role-icon">🏠</div>
              <h3>I'm Buying</h3>
              <p>Find your dream home with verified properties</p>
              <span class="thg-role-select-btn">Select</span>
            </button>
            <button class="thg-role-card" data-role="builder">
              <div class="thg-role-icon">🏗️</div>
              <h3>I'm Building</h3>
              <p>List properties & manage leads professionally</p>
              <span class="thg-role-select-btn">Select</span>
            </button>
          </div>
          <p class="thg-role-hint">ℹ️ You can switch roles anytime from your profile</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelectorAll('.thg-role-card').forEach(card => {
      card.addEventListener('click', async function() {
        const role = this.getAttribute('data-role');
        if (role === 'builder') {
          showBuilderVerificationForm();
        } else {
          await handleRoleSelection('buyer');
        }
      });
    });

    // Inject styles if not already present
    if (!document.getElementById('thg-role-styles')) {
      const styles = document.createElement('style');
      styles.id = 'thg-role-styles';
      styles.textContent = getRoleStyles();
      document.head.appendChild(styles);
    }
  }

  // Builder verification form
  function showBuilderVerificationForm() {
    const modal = document.getElementById('thg-role-onboarding');
    if (!modal) return;

    const body = modal.querySelector('.thg-role-body');
    body.innerHTML = `
      <div class="thg-builder-form">
        <h3>🏗️ Builder Registration</h3>
        <div class="thg-form-field">
          <label for="builder-company">Company Name *</label>
          <input type="text" id="builder-company" placeholder="ABC Constructions Pvt Ltd" required />
        </div>
        <div class="thg-form-field">
          <label for="builder-gstin">GSTIN (optional)</label>
          <input type="text" id="builder-gstin" placeholder="29AABCU9603R1ZM" />
        </div>
        <div class="thg-form-field">
          <label for="builder-rera">RERA Number (optional)</label>
          <input type="text" id="builder-rera" placeholder="PRM/KA/RERA/1251/309/PR/171130" />
        </div>
        <div class="thg-form-actions">
          <button type="button" class="thg-btn-secondary" id="builder-back">Back</button>
          <button type="button" class="thg-btn-gold" id="builder-submit">Submit for Verification</button>
        </div>
        <p class="thg-form-note">ℹ️ Verified builders get priority visibility and trust badge</p>
      </div>
    `;

    body.querySelector('#builder-back').addEventListener('click', showRoleSelectionModal);
    body.querySelector('#builder-submit').addEventListener('click', async function() {
      const companyName = document.getElementById('builder-company').value.trim();
      const gstin = document.getElementById('builder-gstin').value.trim();
      const reraNumber = document.getElementById('builder-rera').value.trim();

      if (!companyName) {
        alert('Please enter your company name');
        return;
      }

      this.disabled = true;
      this.textContent = 'Submitting...';

      try {
        await handleRoleSelection('builder', {
          builder_data: {
            company_name: companyName,
            gstin: gstin || null,
            rera_number: reraNumber || null,
          },
        });
      } catch (error) {
        this.disabled = false;
        this.textContent = 'Submit for Verification';
        throw error;
      }
    });
  }

  // Handle role selection
  async function handleRoleSelection(role, data = {}) {
    try {
      await addRole(role, data);

      // Close modal
      const modal = document.getElementById('thg-role-onboarding');
      if (modal) modal.remove();

      // Show success message
      showNotification(`✅ ${role === 'buyer' ? 'Buyer' : 'Builder'} role added successfully!`);

      // Redirect to appropriate dashboard
      setTimeout(() => {
        const redirectUrl = role === 'buyer' ? '/my-dashboard' : '/builder';
        window.location.href = redirectUrl;
      }, 1000);
    } catch (error) {
      showNotification(`❌ Error: ${error.message}`, 'error');
      console.error('[role-manager] Role selection error:', error);
    }
  }

  // Show notification
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `thg-notification thg-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.3);
      z-index: 2147483200;
      animation: slideInRight 0.3s ease;
      font-weight: 600;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Enhanced menu builder with role switcher
  function buildEnhancedMenu(ui) {
    if (!ui || !ui.menu) return;

    const menu = ui.menu;
    const user = window.__thgAuthState?.user;

    if (!user || !roleState.initialized) {
      // Fallback to default menu
      return;
    }

    let menuHTML = `
      <div class="thg-auth-item is-header" aria-disabled="true">
        <span class="thg-initial-lg">${getInitials(user)}</span>
        <span class="thg-name-wrap">
          <span class="thg-name">${getDisplayName(user)}</span>
          <span class="thg-email">${user.email || ''}</span>
        </span>
      </div>
      <div class="thg-auth-sep"></div>
    `;

    // Role switcher section if user has roles
    if (roleState.roles.length > 0) {
      menuHTML += '<div class="thg-role-section">';
      menuHTML += '<div class="thg-role-label">Your Roles</div>';

      roleState.roles.forEach(role => {
        const isActive = role === roleState.primaryRole;
        const icon = role === 'buyer' ? '🏠' : '🏗️';
        const label = role === 'buyer' ? 'Buyer Mode' : 'Builder Mode';
        const badge = role === 'builder' && roleState.builderVerified ?
          '<span class="thg-role-badge verified">✓ Verified</span>' : '';
        const activeIndicator = isActive ? '<span class="thg-role-active">✓</span>' : '';

        menuHTML += `
          <div class="thg-auth-item thg-role-switcher ${isActive ? 'is-active' : ''}"
               role="menuitem" tabindex="0" data-role="${role}">
            <span>${icon}</span>
            <span style="flex:1">${label}</span>
            ${badge}
            ${activeIndicator}
          </div>
        `;
      });

      // Add role button if user only has one role
      if (roleState.roles.length === 1) {
        const otherRole = roleState.roles[0] === 'buyer' ? 'builder' : 'buyer';
        const icon = otherRole === 'buyer' ? '🏠' : '🏗️';
        const label = otherRole === 'buyer' ? 'Add Buyer Role' : 'Become a Builder';

        menuHTML += `
          <div class="thg-auth-item thg-add-role-btn"
               role="menuitem" tabindex="0" data-add-role="${otherRole}">
            <span>➕</span>
            <span>${label}</span>
          </div>
        `;
      }

      menuHTML += '</div>';
      menuHTML += '<div class="thg-auth-sep"></div>';
    }

    // Navigation links
    menuHTML += `
      <div class="thg-auth-item" role="menuitem" tabindex="0" data-action="profile">
        <span>👤</span><span>Profile</span>
      </div>
    `;

    // Dashboard link based on active role
    if (roleState.primaryRole) {
      const dashboardUrl = roleState.primaryRole === 'buyer' ? '/my-dashboard' : '/builder';
      const dashboardLabel = roleState.primaryRole === 'buyer' ? 'My Dashboard' : 'Builder Dashboard';
      menuHTML += `
        <div class="thg-auth-item" role="menuitem" tabindex="0" data-action="dashboard" data-url="${dashboardUrl}">
          <span>${roleState.primaryRole === 'buyer' ? '🏠' : '🏗️'}</span><span>${dashboardLabel}</span>
        </div>
      `;
    }

    menuHTML += `
      <div class="thg-auth-item" role="menuitem" tabindex="0" data-action="logout">
        <span>🚪</span><span>Logout</span>
      </div>
    `;

    menu.innerHTML = menuHTML;

    // Add event listeners for role switching
    menu.querySelectorAll('.thg-role-switcher').forEach(item => {
      item.addEventListener('click', async function(e) {
        e.stopPropagation();
        const role = this.getAttribute('data-role');
        if (role && role !== roleState.primaryRole) {
          this.style.opacity = '0.5';
          try {
            await switchRole(role);
            showNotification(`Switched to ${role === 'buyer' ? 'Buyer' : 'Builder'} mode`);
            // Reload page to reflect role change
            setTimeout(() => window.location.reload(), 500);
          } catch (error) {
            showNotification(`Error switching role: ${error.message}`, 'error');
            this.style.opacity = '1';
          }
        }
      });
    });

    // Add role button
    menu.querySelectorAll('.thg-add-role-btn').forEach(item => {
      item.addEventListener('click', async function(e) {
        e.stopPropagation();
        const role = this.getAttribute('data-add-role');
        if (role === 'builder') {
          // Close menu and show builder form
          if (ui && typeof window.closeMenu === 'function') {
            window.closeMenu(ui);
          }
          showBuilderVerificationForm();
        } else {
          // Add buyer role directly
          this.style.opacity = '0.5';
          try {
            await addRole('buyer');
            showNotification('Buyer role added successfully!');
            setTimeout(() => window.location.reload(), 500);
          } catch (error) {
            showNotification(`Error adding role: ${error.message}`, 'error');
            this.style.opacity = '1';
          }
        }
      });
    });

    // Dashboard link with custom URL
    const dashboardItem = menu.querySelector('[data-action="dashboard"]');
    if (dashboardItem) {
      dashboardItem.addEventListener('click', function(e) {
        const url = this.getAttribute('data-url');
        if (url) {
          window.location.href = url;
        }
      });
    }

    // Inject enhanced styles
    injectEnhancedStyles();
  }

  // Inject enhanced styles for role UI
  function injectEnhancedStyles() {
    if (document.getElementById('thg-role-enhanced-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'thg-role-enhanced-styles';
    styles.textContent = `
      .thg-role-section {
        padding: 4px 0;
      }

      .thg-role-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: rgba(255,255,255,0.5);
        padding: 8px 12px 4px;
        letter-spacing: 0.5px;
      }

      .thg-role-switcher {
        position: relative;
        transition: all 0.2s ease;
      }

      .thg-role-switcher.is-active {
        background: rgba(243, 205, 74, 0.15) !important;
        border-left: 3px solid #f3cd4a;
        padding-left: 9px;
      }

      .thg-role-switcher:not(.is-active):hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .thg-role-badge {
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 700;
      }

      .thg-role-badge.verified {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }

      .thg-role-badge.pending {
        background: #fbbf24;
        color: #78350f;
      }

      .thg-role-active {
        color: #10b981;
        font-weight: 700;
        font-size: 14px;
      }

      .thg-add-role-btn {
        border: 1px dashed rgba(255,255,255,0.2);
        margin-top: 4px;
      }

      .thg-add-role-btn:hover {
        border-color: #f3cd4a;
        background: rgba(243, 205, 74, 0.1);
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes slideOutRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100px);
        }
      }
    `;
    document.head.appendChild(styles);
  }

  // Get role styles
  function getRoleStyles() {
    return `
      .thg-role-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483100;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .thg-role-modal {
        width: 90%;
        max-width: 600px;
        background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .thg-role-header {
        text-align: center;
        padding: 32px 24px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .thg-role-header h2 {
        font-size: 28px;
        font-weight: 800;
        color: #fff;
        margin: 0 0 8px;
      }

      .thg-role-header p {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
      }

      .thg-role-body {
        padding: 32px 24px;
      }

      .thg-role-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .thg-role-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
      }

      .thg-role-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(243, 205, 74, 0.1), rgba(234, 179, 8, 0.05));
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .thg-role-card:hover {
        transform: translateY(-4px) scale(1.02);
        border-color: rgba(243, 205, 74, 0.6);
        box-shadow: 0 12px 30px rgba(243, 205, 74, 0.2);
      }

      .thg-role-card:hover::before {
        opacity: 1;
      }

      .thg-role-icon {
        font-size: 48px;
        margin-bottom: 12px;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
      }

      .thg-role-card h3 {
        font-size: 20px;
        font-weight: 700;
        color: #fff;
        margin: 0 0 8px;
        position: relative;
        z-index: 1;
      }

      .thg-role-card p {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.6);
        margin: 0 0 16px;
        line-height: 1.5;
        position: relative;
        z-index: 1;
      }

      .thg-role-select-btn {
        display: inline-block;
        background: linear-gradient(135deg, #f3cd4a, #eab308);
        color: #111;
        font-weight: 700;
        padding: 10px 24px;
        border-radius: 8px;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(243, 205, 74, 0.3);
        position: relative;
        z-index: 1;
      }

      .thg-role-card:hover .thg-role-select-btn {
        box-shadow: 0 6px 20px rgba(243, 205, 74, 0.4);
      }

      .thg-role-hint {
        text-align: center;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
        margin: 0;
      }

      .thg-builder-form {
        padding: 24px;
      }

      .thg-builder-form h3 {
        font-size: 22px;
        font-weight: 700;
        color: #fff;
        margin: 0 0 20px;
        text-align: center;
      }

      .thg-form-field {
        margin-bottom: 16px;
      }

      .thg-form-field label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 6px;
      }

      .thg-form-field input {
        width: 100%;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        color: #fff;
        font-size: 15px;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }

      .thg-form-field input:focus {
        outline: none;
        border-color: #f3cd4a;
        box-shadow: 0 0 0 3px rgba(243, 205, 74, 0.1);
      }

      .thg-form-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }

      .thg-btn-secondary {
        flex: 1;
        padding: 12px 24px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .thg-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .thg-btn-gold {
        flex: 2;
        padding: 12px 24px;
        background: linear-gradient(135deg, #f3cd4a, #eab308);
        border: none;
        color: #111;
        font-weight: 700;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(243, 205, 74, 0.3);
      }

      .thg-btn-gold:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(243, 205, 74, 0.4);
      }

      .thg-form-note {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 12px;
        text-align: center;
      }

      @media (max-width: 640px) {
        .thg-role-cards {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  // Helper functions
  function getInitials(user) {
    const meta = user?.user_metadata || {};
    const full = (meta.full_name || meta.name || '').trim();
    if (full) {
      const parts = full.split(/\s+/).filter(Boolean);
      const first = parts[0]?.[0] || '';
      const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
      return (first + last || first || '').toUpperCase() || 'U';
    }
    const email = (user?.email || '').trim();
    return email ? email[0].toUpperCase() : 'U';
  }

  function getDisplayName(user) {
    const meta = user?.user_metadata || {};
    return (meta.full_name || meta.name || user?.email?.split('@')[0] || 'User').trim();
  }

  // Initialize role manager after auth
  async function initRoleManager(user, ui) {
    if (!user) return;

    console.log('[role-manager-enhanced] Initializing for user:', user.email);

    try {
      await fetchUserRoles();

      // Build enhanced menu
      if (ui && ui.menu) {
        buildEnhancedMenu(ui);
      }

      // Check if needs onboarding
      if (await needsOnboarding()) {
        console.log('[role-manager-enhanced] User needs onboarding');
        setTimeout(() => showRoleSelectionModal(), 500);
      } else {
        console.log('[role-manager-enhanced] User has roles:', roleState.roles);
      }
    } catch (error) {
      console.error('[role-manager-enhanced] Init error:', error);
    }
  }

  // Expose API
  window.thgRoleManager = {
    fetchRoles: fetchUserRoles,
    addRole,
    switchRole,
    needsOnboarding,
    showRoleSelection: showRoleSelectionModal,
    init: initRoleManager,
    getState: () => ({ ...roleState }),
    buildMenu: buildEnhancedMenu,
  };

  // Export update menu function
  window.__thgUpdateMenu = function() {
    const ui = window.__thgAuthUI;
    if (ui && roleState.initialized) {
      buildEnhancedMenu(ui);
    }
  };

  console.log('[role-manager-enhanced] Enhanced role manager initialized');
})();
