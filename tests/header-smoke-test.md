# Tharaga Header Smoke Test Checklist

## Overview
This document provides a comprehensive testing checklist for the Tharaga global header implementation. Use this checklist for both manual and automated testing.

## Manual Testing Checklist

### Desktop Testing (1366x768)

- [ ] **Header Visibility**
  - [ ] Header is visible at the top of the page
  - [ ] Header stays fixed/sticky when scrolling
  - [ ] Header does not overlap page content

- [ ] **Logo and Branding**
  - [ ] THARAGA logo is visible and correctly sized (26px)
  - [ ] Logo links to homepage (/)
  - [ ] "Verified • Broker‑free" pill is visible (desktop only)

- [ ] **Navigation Menu**
  - [ ] Features dropdown opens/closes correctly
  - [ ] Portal dropdown opens/closes correctly
  - [ ] Pricing link is visible and clickable
  - [ ] About link is visible and clickable
  - [ ] All navigation links have correct spacing (12px gap)

- [ ] **Login/Signup Buttons**
  - [ ] Login button is visible when not authenticated
  - [ ] Signup button is visible when not authenticated
  - [ ] Buttons are aligned correctly on the right side
  - [ ] Buttons open auth modal when clicked

- [ ] **Portal Menu (Not Authenticated)**
  - [ ] Portal menu is always visible
  - [ ] Builder Dashboard link shows "🔒 Login Required" badge
  - [ ] Buyer Dashboard link shows "🔒 Login Required" badge
  - [ ] Clicking locked dashboard links shows professional login prompt modal
  - [ ] Login prompt modal has correct styling and content
  - [ ] "Sign In / Sign Up" button in modal opens auth modal

- [ ] **Portal Menu (Authenticated)**
  - [ ] Portal menu shows active role with checkmark (✓)
  - [ ] Builder Dashboard shows "✓ Verified" if builder is verified
  - [ ] Admin Panel appears if user has admin role
  - [ ] Clicking dashboard links navigates correctly (no login prompt)

### Tablet Testing (768px)

- [ ] **Responsive Layout**
  - [ ] Header fits within viewport width
  - [ ] Trust pill is hidden (frees up space)
  - [ ] Navigation items are still visible (not collapsed into hamburger)
  - [ ] Login/Signup buttons are visible and accessible

- [ ] **Dropdown Menus**
  - [ ] Features dropdown opens correctly
  - [ ] Portal dropdown opens correctly
  - [ ] Dropdowns don't overflow viewport

### Mobile Testing (320-480px)

- [ ] **Mobile Layout**
  - [ ] Header fits within viewport (no horizontal overflow)
  - [ ] Brand logo is visible (22px font size)
  - [ ] Trust pill is hidden
  - [ ] Navigation items are visible (single row, tighter spacing)
  - [ ] Pricing is hidden from main nav (moved to Features dropdown)
  - [ ] About is hidden from main nav (moved to Features dropdown)

- [ ] **Mobile Dropdowns**
  - [ ] Features dropdown shows mobile-only items (Pricing, About)
  - [ ] Portal dropdown works correctly
  - [ ] Dropdowns are positioned correctly (right-aligned)

- [ ] **Mobile Auth Buttons**
  - [ ] Login/Signup buttons are visible
  - [ ] Buttons are positioned correctly (absolute, top-right)
  - [ ] Buttons don't overlap navigation items

### Auth State Testing

- [ ] **Not Authenticated**
  - [ ] Login button visible
  - [ ] Signup button visible
  - [ ] Portal menu shows locked dashboard links
  - [ ] Clicking locked links shows login prompt

- [ ] **Authenticated (Buyer)**
  - [ ] Login/Signup buttons replaced with user menu
  - [ ] Portal menu shows Buyer Dashboard with ✓
  - [ ] Builder Dashboard shows "🔒 Login Required" (if no builder role)
  - [ ] Clicking Buyer Dashboard navigates correctly

- [ ] **Authenticated (Builder)**
  - [ ] Portal menu shows Builder Dashboard with ✓
  - [ ] "✓ Verified" badge appears if builder is verified
  - [ ] Buyer Dashboard shows "🔒 Login Required" (if no buyer role)
  - [ ] Clicking Builder Dashboard navigates correctly

- [ ] **Authenticated (Admin)**
  - [ ] Admin Panel appears in Portal menu
  - [ ] All dashboards are accessible

### Cross-Browser Testing

- [ ] **Chrome (Desktop)**
  - [ ] Header renders correctly
  - [ ] Dropdowns work correctly
  - [ ] Sticky positioning works

- [ ] **Firefox (Desktop)**
  - [ ] Header renders correctly
  - [ ] Dropdowns work correctly
  - [ ] Sticky positioning works

- [ ] **Edge (Desktop)**
  - [ ] Header renders correctly
  - [ ] Dropdowns work correctly
  - [ ] Sticky positioning works

- [ ] **Safari (Desktop)**
  - [ ] Header renders correctly
  - [ ] Dropdowns work correctly
  - [ ] Sticky positioning works
  - [ ] Backdrop-filter works (glassmorphism)

- [ ] **Mobile Safari (iOS)**
  - [ ] Header renders correctly
  - [ ] Touch interactions work
  - [ ] Dropdowns open/close correctly

- [ ] **Chrome Mobile (Android)**
  - [ ] Header renders correctly
  - [ ] Touch interactions work
  - [ ] Dropdowns open/close correctly

### Accessibility Testing

- [ ] **Keyboard Navigation**
  - [ ] Tab key focuses navigation items in correct order
  - [ ] Enter/Space opens dropdowns
  - [ ] Escape closes dropdowns
  - [ ] Tab trap works in login prompt modal

- [ ] **Screen Reader**
  - [ ] Header has `role="banner"`
  - [ ] Navigation has `aria-label="Primary"`
  - [ ] Dropdowns have `role="menu"`
  - [ ] Menu items have `role="menuitem"`
  - [ ] Login prompt modal has `role="dialog"` and `aria-modal="true"`
  - [ ] Close button has `aria-label="Close"`

- [ ] **Focus Indicators**
  - [ ] All interactive elements have visible focus indicators
  - [ ] Focus indicators meet WCAG contrast requirements

### Feature Page Testing

Test header on all feature pages:

- [ ] `/tools/vastu/` - Header visible, no layout issues
- [ ] `/tools/environment/` - Header visible, no layout issues
- [ ] `/tools/voice-tamil/` - Header visible, no layout issues
- [ ] `/tools/verification/` - Header visible, no layout issues
- [ ] `/tools/roi/` - Header visible, no layout issues
- [ ] `/tools/currency-risk/` - Header visible, no layout issues
- [ ] `/properties` - Header visible, no layout issues
- [ ] `/about` - Header visible, no layout issues
- [ ] `/pricing` - Header visible, no layout issues

### Functional Testing

- [ ] **Page Interactions**
  - [ ] Forms on pages work correctly (header doesn't interfere)
  - [ ] Modals on pages work correctly (header z-index doesn't conflict)
  - [ ] Page-specific JavaScript doesn't break

- [ ] **Client-Side Navigation (Next.js)**
  - [ ] Clicking header links uses client-side navigation (no full page reload)
  - [ ] Header stays fixed during navigation
  - [ ] Browser back/forward buttons work correctly

- [ ] **Performance**
  - [ ] Header loads quickly (no blocking)
  - [ ] No Cumulative Layout Shift (CLS) - header height is pre-calculated
  - [ ] Lighthouse score is not negatively impacted

## Automated Testing

### Run Smoke Test Script

```bash
# Test staging environment
./scripts/header-smoke-test.sh https://staging.tharaga.co.in

# Test local development
./scripts/header-smoke-test.sh http://localhost:3000
```

### Expected Results

- [ ] All pages return HTTP 200
- [ ] All pages contain `id="tharaga-static-header"` or `tharaga-header`
- [ ] No pages fail the header presence check

### Lighthouse Testing

- [ ] **Performance**
  - [ ] No layout shift caused by header
  - [ ] Header doesn't block rendering
  - [ ] Header CSS is not render-blocking

- [ ] **Accessibility**
  - [ ] Header passes accessibility audit
  - [ ] All interactive elements are keyboard accessible
  - [ ] ARIA labels are correct

## Visual Regression Testing

Compare staging vs production:

- [ ] Header height is consistent (60px)
- [ ] Logo size is consistent (26px desktop, 22px mobile)
- [ ] Spacing between nav items is consistent (12px gap)
- [ ] Colors match design system (premium blue, gold accent)
- [ ] Fonts match (Plus Jakarta Sans for brand, Manrope for UI)

## Rollback Testing

If issues are found:

- [ ] Verify rollback procedure works
- [ ] Test that reverting commit restores previous header
- [ ] Confirm no data loss or broken functionality

## Notes

- Header should always be visible (never hidden)
- Portal menu should always be visible (shows locked state if not authenticated)
- Login/Signup buttons should always be visible when not authenticated
- Header should not be affected by page-specific CSS (use namespaced selectors)
- Header should not be clipped by parent elements with `transform` (mounted as child of `<body>`)

