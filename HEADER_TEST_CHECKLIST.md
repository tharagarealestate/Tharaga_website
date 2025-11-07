# Header Functionality Test Checklist

## Pages to Test

### 1. Builder Dashboard (`/builder`)
- [ ] Header is visible at top
- [ ] Portal menu shows "Builder Dashboard" with ✓ if active
- [ ] Login/Signup buttons visible in header
- [ ] Clicking Portal menu works
- [ ] Navigation to other pages works without header reload

### 2. Buyer Dashboard (`/my-dashboard`)
- [ ] Header is visible at top
- [ ] Portal menu shows "Buyer Dashboard" with ✓ if active
- [ ] Login/Signup buttons visible in header
- [ ] Clicking Portal menu works
- [ ] Navigation to other pages works without header reload

### 3. About Page (`/about/`)
- [ ] Header is visible at top
- [ ] All navigation links work
- [ ] Login/Signup buttons visible
- [ ] Portal menu appears if user has roles
- [ ] Features dropdown works

## Portal Menu Functionality

### When User is NOT Logged In
- [ ] Portal menu is HIDDEN (`display: none`)
- [ ] Only Features, Pricing, About visible
- [ ] Login/Signup buttons visible

### When User is Logged In (Buyer Role)
- [ ] Portal menu is VISIBLE
- [ ] Shows "🏠 Buyer Dashboard ✓" (with checkmark)
- [ ] Shows "🏗️ Builder Dashboard" (if user has builder role)
- [ ] Clicking links navigates correctly

### When User is Logged In (Builder Role)
- [ ] Portal menu is VISIBLE
- [ ] Shows "🏗️ Builder Dashboard ✓" (with checkmark)
- [ ] Shows "✓ Verified" if builder is verified
- [ ] Shows "🏠 Buyer Dashboard" (if user has buyer role)
- [ ] Clicking links navigates correctly

### When User is Admin Owner
- [ ] Portal menu is VISIBLE
- [ ] Shows all dashboards (Buyer, Builder, Admin)
- [ ] Admin Panel link appears with separator
- [ ] All links work correctly

## Login/Signup Functionality

### Auth Container
- [ ] `#site-header-auth-container` exists in header
- [ ] Auth system injects `.thg-auth-wrap` into header
- [ ] Login/Signup buttons appear correctly
- [ ] Buttons are positioned correctly (right side of header)

### When NOT Logged In
- [ ] Shows "Login" or "Sign Up" button
- [ ] Clicking opens auth modal
- [ ] Modal works correctly

### When Logged In
- [ ] Shows user avatar/initial
- [ ] Shows account menu dropdown
- [ ] Dropdown has profile/logout options
- [ ] All dropdown actions work

## Visual Checks

### Desktop View
- [ ] Header matches homepage exactly
- [ ] Font size: 26px for THARAGA brand
- [ ] Gaps: 10px between brand and pill
- [ ] Gaps: 12px in navigation
- [ ] Sticky positioning works
- [ ] Z-index: 20 (header stays above content)

### Mobile View
- [ ] Header is responsive
- [ ] Trust pill hides on small screens
- [ ] Navigation adapts correctly
- [ ] Login/Signup buttons visible
- [ ] Dropdowns work on mobile

## Runtime Testing

### Navigation Tests
1. Start on homepage (`/`)
2. Click "Features" → "Vastu"
   - [ ] Header stays visible
   - [ ] Header does NOT reload
   - [ ] Page content loads below header
3. Click "Portal" → "Builder Dashboard"
   - [ ] Header stays visible
   - [ ] Navigation works
   - [ ] Portal menu updates correctly
4. Navigate to `/about/`
   - [ ] Header stays visible
   - [ ] All links work
5. Navigate to `/tools/currency-risk/`
   - [ ] Header stays visible
   - [ ] Header matches homepage styling

### Role Switching Tests
1. Log in as user with buyer role
   - [ ] Portal menu shows Buyer Dashboard ✓
2. Switch to builder role (if available)
   - [ ] Portal menu updates
   - [ ] Builder Dashboard shows ✓
3. Navigate between dashboards
   - [ ] Header stays visible throughout
   - [ ] Portal menu updates correctly

## Console Checks

Open browser console and verify:
- [ ] No errors related to header
- [ ] `window.thgRoleManager` exists
- [ ] `window.__updatePortalMenu` function exists
- [ ] `window.__nextRouter` exists (for navigation)
- [ ] Auth system loads correctly
- [ ] Role manager initializes correctly

## Known Issues to Watch For

1. **Portal menu not showing**: Check if `window.thgRoleManager` is loaded
2. **Login/Signup buttons missing**: Check if auth scripts are loaded
3. **Header reloading**: Verify `React.memo()` is working
4. **Navigation not working**: Check `HeaderLinkInterceptor` is loaded
5. **Styling issues**: Verify CSS matches homepage exactly

