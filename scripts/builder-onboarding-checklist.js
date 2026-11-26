/**
 * Builder Onboarding Checklist - Phase 5
 * Guides new builders through setup process
 */

(function() {
  'use strict';

  const BuilderOnboarding = {
    // Checklist steps
    steps: [
      { id: 'profile_complete', label: 'Complete your builder profile', completed: false },
      { id: 'verification_submitted', label: 'Submit verification documents', completed: false },
      { id: 'verification_approved', label: 'Get verified by Tharaga', completed: false },
      { id: 'first_property', label: 'Add your first property listing', completed: false },
      { id: 'profile_image', label: 'Upload company logo', completed: false },
    ],

    // Check completion status
    async checkProgress() {
      if (!window.thgRoleManager) {
        console.warn('[onboarding] Role manager not loaded');
        return;
      }

      const state = window.thgRoleManager.getState();

      // Only show for builders
      if (!state.roles.includes('builder')) {
        return;
      }

      // Update step completion based on state
      this.steps[0].completed = state.hasBuilderProfile;
      this.steps[1].completed = state.hasBuilderProfile;
      this.steps[2].completed = state.builderVerified;

      // TODO: Check for first property and profile image
      // Would require additional API calls

      return this.steps;
    },

    // Show checklist modal
    async show() {
      const steps = await this.checkProgress();
      if (!steps) return;

      // Check if already dismissed
      const dismissed = localStorage.getItem('thg_onboarding_dismissed');
      if (dismissed === 'true') return;

      // Check if all steps completed
      const allCompleted = steps.every(step => step.completed);
      if (allCompleted) {
        localStorage.setItem('thg_onboarding_dismissed', 'true');
        return;
      }

      // Create modal
      const modal = document.createElement('div');
      modal.id = 'thg-onboarding-checklist';
      modal.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        padding: 24px;
        max-width: 350px;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
      `;

      const completedCount = steps.filter(s => s.completed).length;
      const progress = Math.round((completedCount / steps.length) * 100);

      modal.innerHTML = `
        <style>
          @keyframes slideInRight {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .thg-onboard-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
          }

          .thg-onboard-title {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
            margin: 0;
          }

          .thg-onboard-close {
            background: none;
            border: none;
            font-size: 24px;
            color: #9ca3af;
            cursor: pointer;
            padding: 0;
            line-height: 1;
          }

          .thg-onboard-close:hover {
            color: #111827;
          }

          .thg-onboard-progress {
            margin-bottom: 20px;
          }

          .thg-onboard-progress-bar {
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 8px;
          }

          .thg-onboard-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #059669);
            width: ${progress}%;
            transition: width 0.5s ease;
          }

          .thg-onboard-progress-text {
            font-size: 13px;
            color: #6b7280;
            text-align: center;
          }

          .thg-onboard-step {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }

          .thg-onboard-step:last-child {
            border-bottom: none;
          }

          .thg-onboard-checkbox {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid #d1d5db;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.3s;
          }

          .thg-onboard-checkbox.completed {
            background: #10b981;
            border-color: #10b981;
          }

          .thg-onboard-checkbox svg {
            width: 14px;
            height: 14px;
            color: white;
          }

          .thg-onboard-step-label {
            font-size: 14px;
            color: #374151;
          }

          .thg-onboard-step.completed .thg-onboard-step-label {
            color: #9ca3af;
            text-decoration: line-through;
          }

          .thg-onboard-dismiss {
            margin-top: 16px;
            width: 100%;
            padding: 10px;
            background: #f3f4f6;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            color: #6b7280;
            cursor: pointer;
            transition: background 0.3s;
          }

          .thg-onboard-dismiss:hover {
            background: #e5e7eb;
          }
        </style>

        <div class="thg-onboard-header">
          <h3 class="thg-onboard-title">🚀 Getting Started</h3>
          <button class="thg-onboard-close" onclick="this.closest('#thg-onboarding-checklist').remove()">×</button>
        </div>

        <div class="thg-onboard-progress">
          <div class="thg-onboard-progress-bar">
            <div class="thg-onboard-progress-fill"></div>
          </div>
          <div class="thg-onboard-progress-text">${completedCount} of ${steps.length} completed (${progress}%)</div>
        </div>

        <div class="thg-onboard-steps">
          ${steps.map(step => `
            <div class="thg-onboard-step ${step.completed ? 'completed' : ''}">
              <div class="thg-onboard-checkbox ${step.completed ? 'completed' : ''}">
                ${step.completed ? `
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                ` : ''}
              </div>
              <span class="thg-onboard-step-label">${step.label}</span>
            </div>
          `).join('')}
        </div>

        <button class="thg-onboard-dismiss" onclick="localStorage.setItem('thg_onboarding_dismissed', 'true'); this.closest('#thg-onboarding-checklist').remove();">
          Dismiss
        </button>
      `;

      document.body.appendChild(modal);
    },

    // Reset checklist (for testing)
    reset() {
      localStorage.removeItem('thg_onboarding_dismissed');
      const existing = document.getElementById('thg-onboarding-checklist');
      if (existing) existing.remove();
    },
  };

  // Expose globally
  window.BuilderOnboarding = BuilderOnboarding;

  // Auto-show for builders after role manager initializes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (window.thgRoleManager && window.thgRoleManager.getState().initialized) {
          BuilderOnboarding.show();
        }
      }, 2000); // Show 2 seconds after page load
    });
  } else {
    setTimeout(() => {
      if (window.thgRoleManager && window.thgRoleManager.getState().initialized) {
        BuilderOnboarding.show();
      }
    }, 2000);
  }

  console.log('[onboarding] Builder onboarding checklist loaded');
})();
