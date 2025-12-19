/**
 * Tharaga Role Management System v2.0
 * Optimized for speed, smooth UX, and zero lag
 */

(function() {
  if (window.__thgRoleManagerV2) return;
  window.__thgRoleManagerV2 = true;

  // Enhanced role state with initialization guard
  const roleState = {
    roles: [],
    primaryRole: null,
    builderVerified: false,
    hasBuilderProfile: false,
    hasBuyerProfile: false,
    loading: false,
    initialized: false,
    initializingModal: false,  // Prevents duplicate modals
    hasShownOnboarding: false, // Show onboarding only once per session
    user: null, // Store user info for route guard
  };

  // Emit custom event when role changes (for route guard)
  function emitRoleChangeEvent() {
    const event = new CustomEvent('thg-role-changed', {
      detail: {
        roles: roleState.roles,
        primaryRole: roleState.primaryRole,
        builderVerified: roleState.builderVerified,
      }
    });
    window.dispatchEvent(event);
    console.log('[role-v2] Emitted role change event');
  }

  // API helper with timeout and retry
  async function apiCall(endpoint, options = {}) {
    const token = await window.supabase?.auth?.getSession?.().then(r => r?.data?.session?.access_token);
    if (!token) throw new Error('Not authenticated');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(endpoint, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  // Fetch user roles (with cache)
  async function fetchUserRoles(force = false) {
    if (roleState.initialized && !force) {
      return roleState; // Return cached state
    }

    if (roleState.loading) {
      // Already loading, wait for it
      return new Promise(resolve => {
        const check = setInterval(() => {
          if (!roleState.loading) {
            clearInterval(check);
            resolve(roleState);
          }
        }, 100);
      });
    }

    try {
      roleState.loading = true;
      console.log('[role-v2] Fetching user roles...');

      // Get current user from Supabase
      const { data: { user } } = await window.supabase.auth.getUser();
      roleState.user = user; // Store user for admin owner check

      const data = await apiCall('/api/user/roles');

      roleState.roles = data.roles || [];
      roleState.primaryRole = data.primary_role;
      roleState.builderVerified = data.builder_verified || false;
      roleState.hasBuilderProfile = data.has_builder_profile || false;
      roleState.hasBuyerProfile = data.has_buyer_profile || false;
      roleState.initialized = true;
      roleState.loading = false;

      console.log('[role-v2] Roles fetched:', {
        roles: roleState.roles,
        primary: roleState.primaryRole,
        userEmail: roleState.user?.email, // Log email for debugging
      });

      // Dispatch event to notify portal menu and other listeners
      emitRoleChangeEvent();

      return roleState;
    } catch (error) {
      console.error('[role-v2] Error fetching roles:', error);
      roleState.loading = false;
      roleState.initialized = false;
      return null;
    }
  }

  // Add role (optimized)
  async function addRole(role, data = {}) {
    try {
      console.log('[role-v2] Adding role:', role);
      const result = await apiCall('/api/user/add-role', {
        method: 'POST',
        body: JSON.stringify({ role, ...data }),
      });

      // Update local state immediately (optimistic)
      if (!roleState.roles.includes(role)) {
        roleState.roles.push(role);
      }
      if (!roleState.primaryRole) {
        roleState.primaryRole = role;
      }

      // Rebuild menu instantly
      if (window.__thgUpdateMenu) {
        window.__thgUpdateMenu();
      }

      // Update portal menu
      if (window.__updatePortalMenu) {
        window.__updatePortalMenu();
      }

      // Fetch full state in background
      fetchUserRoles(true);

      return result;
    } catch (error) {
      console.error('[role-v2] Error adding role:', error);
      throw error;
    }
  }

  // Switch role (instant)
  async function switchRole(role) {
    if (role === roleState.primaryRole) {
      console.log('[role-v2] Already in', role, 'mode');
      return;
    }

    // Check if admin owner (bypass role check) - use multiple checks for reliability
    const userEmail = roleState.user?.email || window.__thgAuthState?.user?.email;
    const isAdminOwner = userEmail === 'tharagarealestate@gmail.com';

    // Validate role exists (unless admin owner switching to admin)
    // Admin owner can switch to admin even if not in roles array (they have admin privilege)
    const canSwitchToAdmin = isAdminOwner && role === 'admin';
    if (!canSwitchToAdmin && !roleState.roles.includes(role)) {
      console.error('[role-v2] Invalid role:', role, 'User roles:', roleState.roles, 'User email:', userEmail);
      showNotification(`Error: You don't have the ${role} role`, 'error');
      return;
    }

    try {
      console.log('[role-v2] Switching to role:', role, 'Admin owner:', isAdminOwner);

      // Update UI immediately (optimistic)
      const oldRole = roleState.primaryRole;
      roleState.primaryRole = role;

      // Store in localStorage
      try {
        localStorage.setItem('tharaga_active_role', role);
      } catch(e) {}

      // Rebuild menu instantly
      if (window.__thgUpdateMenu) {
        window.__thgUpdateMenu();
      }

      // Update portal menu
      if (window.__updatePortalMenu) {
        window.__updatePortalMenu();
      }

      // Show instant feedback
      showNotification(`Switched to ${role === 'buyer' ? 'Buyer' : 'Builder'} Mode`);

      // Emit role change event for route guard
      emitRoleChangeEvent();

      // API call in background
      apiCall('/api/user/switch-role', {
        method: 'POST',
        body: JSON.stringify({ role }),
      }).catch(error => {
        // Rollback on failure
        roleState.primaryRole = oldRole;
        if (window.__thgUpdateMenu) {
          window.__thgUpdateMenu();
        }
        showNotification(`Error: ${error.message}`, 'error');
      });

      // Broadcast role change
      try {
        const bc = new BroadcastChannel('tharaga-role');
        bc.postMessage({ type: 'ROLE_SWITCHED', role });
      } catch(e) {}

    } catch (error) {
      console.error('[role-v2] Error switching role:', error);
      throw error;
    }
  }

  // Check if needs onboarding
  async function needsOnboarding() {
    if (!roleState.initialized) await fetchUserRoles();
    
    // Admin owner with existing roles should skip onboarding
    const userEmail = roleState.user?.email || window.__thgAuthState?.user?.email;
    const isAdminOwner = userEmail === 'tharagarealestate@gmail.com';
    
    // If admin owner has any roles (including admin), skip onboarding
    if (isAdminOwner && roleState.roles.length > 0) {
      return false;
    }
    
    // Regular users need onboarding if they have no roles
    return roleState.roles.length === 0;
  }

  // Show role selection modal (with duplicate prevention)
  function showRoleSelectionModal() {
    // Prevent duplicates
    if (roleState.initializingModal || roleState.hasShownOnboarding) {
      console.log('[role-v2] Modal already shown or showing');
      return;
    }

    const existing = document.getElementById('thg-role-onboarding');
    if (existing) {
      console.log('[role-v2] Modal already exists');
      return;
    }

    roleState.initializingModal = true;
    roleState.hasShownOnboarding = true;

    console.log('[role-v2] Showing role selection modal');

    const modal = document.createElement('div');
    modal.id = 'thg-role-onboarding';
    modal.className = 'thg-role-modal-overlay';
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="thg-role-modal">
        <button class="thg-role-close" aria-label="Close" title="Close">✕</button>
        <div class="thg-role-header">
          <h2>🎉 Welcome to Tharaga!</h2>
          <p>Let's get you started. What brings you here today?</p>
        </div>
        <div class="thg-role-body">
          <div class="thg-role-cards">
            <button class="thg-role-card" data-role="buyer" type="button">
              <div class="thg-role-icon">🏠</div>
              <h3>I'm Buying</h3>
              <p>Find your dream home with verified properties</p>
              <span class="thg-role-select-btn">Select</span>
            </button>
            <button class="thg-role-card" data-role="builder" type="button">
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

    // Close modal function
    const closeModal = () => {
      roleState.hasShownOnboarding = true;
      roleState.initializingModal = false;
      const m = document.getElementById('thg-role-onboarding');
      if (m) {
        m.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => m.remove(), 300);
      }
    };

    // Close button handler
    const closeBtn = modal.querySelector('.thg-role-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Event listeners with instant feedback
    modal.querySelectorAll('.thg-role-card').forEach(card => {
      card.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();

        const role = this.getAttribute('data-role');
        console.log('[role-v2] Role card clicked:', role);

        // Disable all cards immediately
        modal.querySelectorAll('.thg-role-card').forEach(c => {
          c.style.opacity = '0.5';
          c.style.pointerEvents = 'none';
          c.disabled = true;
        });

        // Add loading state to clicked card
        const selectBtn = this.querySelector('.thg-role-select-btn');
        if (selectBtn) {
          selectBtn.textContent = 'Loading...';
        }

        try {
          if (role === 'builder') {
            // Remove ESC handler before showing builder form
            document.removeEventListener('keydown', escHandler);
            showBuilderVerificationForm();
          } else {
            await handleRoleSelection('buyer');
            // Remove ESC handler after successful selection
            document.removeEventListener('keydown', escHandler);
          }
        } catch (error) {
          console.error('[role-v2] Role selection failed:', error);
          // Re-enable cards on error
          modal.querySelectorAll('.thg-role-card').forEach(c => {
            c.style.opacity = '1';
            c.style.pointerEvents = 'auto';
            c.disabled = false;
          });
          if (selectBtn) {
            selectBtn.textContent = 'Select';
          }
        }
      });
    });

    // Inject styles
    injectStyles();

    roleState.initializingModal = false;
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
          <input type="text" id="builder-company" placeholder="ABC Constructions Pvt Ltd" required autofocus />
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
          <button type="button" class="thg-btn-gold" id="builder-submit">Submit</button>
        </div>
        <p class="thg-form-note">ℹ️ Verified builders get priority visibility</p>
      </div>
    `;

    body.querySelector('#builder-back').addEventListener('click', () => {
      roleState.hasShownOnboarding = false;
      roleState.initializingModal = false;
      const modal = document.getElementById('thg-role-onboarding');
      if (modal) modal.remove();
      setTimeout(showRoleSelectionModal, 100);
    });

    body.querySelector('#builder-submit').addEventListener('click', async function() {
      const companyName = document.getElementById('builder-company').value.trim();
      const gstin = document.getElementById('builder-gstin').value.trim();
      const reraNumber = document.getElementById('builder-rera').value.trim();

      if (!companyName) {
        showNotification('Please enter your company name', 'error');
        document.getElementById('builder-company').focus();
        return;
      }

      // Instant UI feedback
      this.disabled = true;
      this.textContent = 'Adding...';
      this.style.opacity = '0.7';

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
        this.textContent = 'Submit';
        this.style.opacity = '1';
      }
    });

    // Focus first input
    setTimeout(() => {
      const input = document.getElementById('builder-company');
      if (input) input.focus();
    }, 100);
  }

  // Handle role selection (NO auto-redirect, just add role)
  async function handleRoleSelection(role, data = {}) {
    try {
      console.log('[role-v2] Handling role selection:', role);

      // Add role with instant feedback
      await addRole(role, data);

      // Close modal with animation
      const modal = document.getElementById('thg-role-onboarding');
      if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
      }

      // Show success notification
      const roleLabel = role === 'buyer' ? 'Buyer' : 'Builder';
      showNotification(`✅ ${roleLabel} role added! Check Portal menu for dashboard access.`);

      // NO REDIRECT - just stay on current page

    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
      console.error('[role-v2] Role selection error:', error);
      throw error;
    }
  }

  // Show notification (optimized)
  function showNotification(message, type = 'success') {
    // Remove existing notifications
    document.querySelectorAll('.thg-notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `thg-notification thg-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 14px 20px;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      z-index: 2147483200;
      font-weight: 600;
      font-size: 14px;
      max-width: 300px;
      animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Enhanced menu builder
  function buildEnhancedMenu(ui) {
    if (!ui || !ui.menu || !roleState.initialized) return;

    const menu = ui.menu;
    const user = window.__thgAuthState?.user;
    if (!user) return;

    console.log('[role-v2] Building menu for roles:', roleState.roles);

    // Check if admin owner - show all options regardless of roles
    const userEmail = user.email || '';
    const isAdminOwner = userEmail === 'tharagarealestate@gmail.com';

    // Check if this is desktop header menu (not mobile)
    // Desktop menu is .thg-auth-menu inside header.nav
    // Mobile has separate .mobile-user-dropdown
    const isDesktopHeader = menu.closest && menu.closest('header.nav') && !menu.classList.contains('mobile-user-dropdown');
    const isMobile = window.innerWidth <= 767;

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

    // Role switcher section - ONLY show on mobile, NOT in desktop header dropdown
    // Desktop header dropdown should not show "YOUR ROLES" section to avoid clutter
    if (!isDesktopHeader && (roleState.roles.length > 0 || isAdminOwner)) {
      menuHTML += '<div class="thg-role-section">';
      menuHTML += '<div class="thg-role-label">YOUR ROLES</div>';

      // Determine which roles to show
      // For admin owner: show all roles they have (including admin if present)
      // For regular users: show only buyer/builder (never show admin)
      let rolesToShow = [];
      
      if (isAdminOwner) {
        // Admin owner: show all roles including admin
        rolesToShow = roleState.roles.length > 0 
          ? roleState.roles 
          : ['buyer', 'builder', 'admin']; // Fallback if no roles yet
      } else {
        // Regular users: filter out admin role - they should never see it
        rolesToShow = roleState.roles.filter(r => r !== 'admin');
      }

      // Count displayable roles for "add role" button logic (buyer/builder only)
      const displayableRoles = rolesToShow.filter(r => r !== 'admin');

      rolesToShow.forEach(role => {
        // For non-admin users, skip admin role (should never reach here due to filter above, but safety check)
        if (!isAdminOwner && role === 'admin') return;

        const isActive = role === roleState.primaryRole;
        let icon, label;
        
        if (role === 'admin') {
          icon = '⚙️';
          label = 'Admin Mode';
        } else if (role === 'buyer') {
          icon = '🏠';
          label = 'Buyer Mode';
        } else {
          icon = '🏗️';
          label = 'Builder Mode';
        }
        
        const badge = role === 'builder' && roleState.builderVerified ?
          '<span class="thg-role-badge verified">✓ Verified</span>' : '';
        const activeIndicator = isActive ? '<span class="thg-role-active">✓</span>' : '';

        menuHTML += `
          <div class="thg-auth-item thg-role-switcher ${isActive ? 'is-active' : ''}"
               role="menuitem" tabindex="0" data-role="${role}">
            <span class="thg-role-icon">${icon}</span>
            <span style="flex:1">${label}</span>
            ${badge}
            ${activeIndicator}
          </div>
        `;
      });

      // Add role button if user has only buyer OR only builder (not both)
      // Count only displayable roles (buyer/builder), not admin
      // Show for both regular users AND admin owner
      if (displayableRoles.length === 1) {
        const currentRole = displayableRoles[0];
        const otherRole = currentRole === 'buyer' ? 'builder' : 'buyer';
        const icon = otherRole === 'buyer' ? '🏠' : '🏗️';
        const label = otherRole === 'buyer' ? 'Buyer Mode' : 'Builder Mode';

        menuHTML += `
          <div class="thg-auth-item thg-add-role-btn"
               role="menuitem" tabindex="0" data-add-role="${otherRole}">
            <span class="thg-role-icon">➕</span>
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

    menuHTML += `
      <div class="thg-auth-item" role="menuitem" tabindex="0" data-action="logout">
        <span>🚪</span><span>Logout</span>
      </div>
    `;

    menu.innerHTML = menuHTML;

    // Add event listeners
    attachMenuEventListeners(menu, ui);
    injectEnhancedStyles();
  }

  // Attach menu event listeners
  function attachMenuEventListeners(menu, ui) {
    // Role switching
    menu.querySelectorAll('.thg-role-switcher').forEach(item => {
      item.addEventListener('click', async function(e) {
        e.stopPropagation();
        const role = this.getAttribute('data-role');

        if (role && role !== roleState.primaryRole) {
          // Instant visual feedback
          this.style.opacity = '0.6';

          try {
            await switchRole(role);
            // Menu auto-rebuilds via switchRole
          } catch (error) {
            this.style.opacity = '1';
            showNotification(`Error: ${error.message}`, 'error');
          }
        }
      });
    });

    // Add role button
    menu.querySelectorAll('.thg-add-role-btn').forEach(item => {
      item.addEventListener('click', async function(e) {
        e.stopPropagation();
        const role = this.getAttribute('data-add-role');

        // Close menu first
        try {
          const closeMenu = window.closeMenu || window.__thgCloseMenu;
          if (typeof closeMenu === 'function' && ui) {
            closeMenu(ui);
          }
        } catch(err) {
          console.log('[role-v2] Could not close menu:', err);
        }

        if (role === 'builder') {
          // Reset onboarding flags to allow showing modal again
          roleState.hasShownOnboarding = false;
          roleState.initializingModal = false;

          // Show builder form
          setTimeout(() => {
            const modal = document.getElementById('thg-role-onboarding');
            if (modal) modal.remove();
            showRoleSelectionModal();
            // Auto-click builder card after modal appears
            setTimeout(() => {
              const builderCard = document.querySelector('.thg-role-card[data-role="builder"]');
              if (builderCard) builderCard.click();
            }, 200);
          }, 100);
        } else {
          // Add buyer role directly
          this.style.opacity = '0.6';
          try {
            await addRole('buyer');
            showNotification('✅ Buyer mode added!');
          } catch (error) {
            this.style.opacity = '1';
            showNotification(`Error: ${error.message}`, 'error');
          }
        }
      });
    });
  }

  // Inject enhanced styles
  function injectEnhancedStyles() {
    if (document.getElementById('thg-role-enhanced-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'thg-role-enhanced-styles';
    styles.textContent = `
      .thg-role-section {
        padding: 4px 0;
      }

      .thg-role-label {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        color: rgba(255,255,255,0.4);
        padding: 8px 12px 6px;
        letter-spacing: 0.8px;
      }

      .thg-role-icon {
        font-size: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
      }

      .thg-role-switcher {
        position: relative;
        transition: all 0.15s ease;
        cursor: pointer;
      }

      .thg-role-switcher.is-active {
        background: rgba(243, 205, 74, 0.12) !important;
        border-left: 3px solid #f3cd4a;
        padding-left: 9px;
      }

      .thg-role-switcher:not(.is-active):hover {
        background: rgba(255, 255, 255, 0.08);
        cursor: pointer;
      }

      .thg-role-badge {
        font-size: 9px;
        padding: 3px 8px;
        border-radius: 10px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }

      .thg-role-badge.verified {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }

      .thg-role-active {
        color: #10b981;
        font-weight: 800;
        font-size: 16px;
      }

      .thg-add-role-btn {
        border: 1px dashed rgba(255,255,255,0.25);
        margin-top: 4px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .thg-add-role-btn:hover {
        border-color: #f3cd4a;
        background: rgba(243, 205, 74, 0.08);
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

      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(styles);
  }

  // Inject role modal styles
  function injectStyles() {
    if (document.getElementById('thg-role-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'thg-role-styles';
    styles.textContent = `
      .thg-role-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483100;
        animation: fadeIn 0.25s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .thg-role-modal {
        position: relative;
        width: 90%;
        max-width: 600px;
        background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
        animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
      }

      .thg-role-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 36px;
        height: 36px;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.2s ease;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .thg-role-close:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        transform: scale(1.05);
      }

      .thg-role-close:active {
        transform: scale(0.95);
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.96);
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
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
      }

      .thg-role-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(243, 205, 74, 0.1), rgba(234, 179, 8, 0.05));
        opacity: 0;
        transition: opacity 0.25s ease;
      }

      .thg-role-card:hover {
        transform: translateY(-4px) scale(1.01);
        border-color: rgba(243, 205, 74, 0.6);
        box-shadow: 0 12px 30px rgba(243, 205, 74, 0.2);
      }

      .thg-role-card:active {
        transform: translateY(-2px) scale(0.99);
      }

      .thg-role-card:hover::before {
        opacity: 1;
      }

      .thg-role-card .thg-role-icon {
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
        transition: all 0.2s ease;
      }

      .thg-role-card:hover .thg-role-select-btn {
        box-shadow: 0 6px 20px rgba(243, 205, 74, 0.4);
        transform: translateY(-2px);
      }

      .thg-role-hint {
        text-align: center;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
        margin: 0;
      }

      .thg-builder-form {
        max-width: 450px;
        margin: 0 auto;
      }

      .thg-builder-form h3 {
        font-size: 22px;
        font-weight: 700;
        color: #fff;
        margin: 0 0 24px;
        text-align: center;
      }

      .thg-form-field {
        margin-bottom: 16px;
      }

      .thg-form-field label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 8px;
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
        background: rgba(255, 255, 255, 0.08);
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

      .thg-btn-gold:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(243, 205, 74, 0.4);
      }

      .thg-btn-gold:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .thg-form-note {
        font-size: 12px;
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
    document.head.appendChild(styles);
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

  // Initialize role manager (with duplicate prevention)
  async function initRoleManager(user, ui) {
    if (!user) return;

    // Store user for route guard
    roleState.user = user;

    // Prevent duplicate initialization
    if (roleState.initialized && !window.__forceRoleInit) {
      console.log('[role-v2] Already initialized, rebuilding menu only');
      if (ui && ui.menu) {
        buildEnhancedMenu(ui);
      }
      return;
    }

    console.log('[role-v2] Initializing for user:', user.email);

    try {
      // Fetch roles
      await fetchUserRoles();

      // Build menu
      if (ui && ui.menu) {
        buildEnhancedMenu(ui);
      }

      // Check if needs onboarding (ONCE)
      if (await needsOnboarding()) {
        console.log('[role-v2] User needs onboarding');
        setTimeout(() => showRoleSelectionModal(), 400);
      } else {
        console.log('[role-v2] User has roles:', roleState.roles);
      }
    } catch (error) {
      console.error('[role-v2] Init error:', error);
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

  // Store closeMenu function globally
  window.__thgCloseMenu = function(ui) {
    if (ui && ui.menu) {
      ui.menu.setAttribute('aria-hidden', 'true');
      if (ui.btn) ui.btn.setAttribute('aria-expanded', 'false');
    }
  };

  console.log('[role-v2] Role manager v2.0 initialized - optimized for speed');
})();
