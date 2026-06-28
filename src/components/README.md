# Tharaga Global Header Partial

## Overview

This directory contains the global header component for the Tharaga website. The header is extracted into separate HTML, CSS, and JavaScript files for maximum reusability across different page types (Next.js, static HTML, etc.).

## Files

- **`header.html`** - Header HTML structure
- **`header.css`** - Namespaced CSS styles (prefixed with `.tharaga-header`)
- **`header.js`** - JavaScript functionality (portal menu, login prompts, link interception)
- **`header-injector.js`** - Client-side injection script for static HTML pages

## Usage

### For Next.js Pages (Current Implementation)

The header is already integrated via the `StaticHeaderHTML.tsx` component in `app/components/StaticHeaderHTML.tsx`. No additional setup needed - the header is automatically included in the root layout.

### For Static HTML Pages

1. Add a mount point in your HTML:
   ```html
   <div id="tharaga-header-mount"></div>
   ```

2. Load the injector script before closing `</body>`:
   ```html
   <script src="/src/components/header-injector.js"></script>
   ```

The injector will automatically:
- Load `header.css` into `<head>`
- Fetch `header.html` and inject it into the mount point
- Load `header.js` to initialize functionality

### Direct Inclusion (Advanced)

If you prefer to include files directly:

```html
<head>
  <link rel="stylesheet" href="/src/components/header.css">
</head>
<body>
  <!-- Include header.html content here -->
  <script src="/src/components/header.js"></script>
</body>
```

## Features

### Always Visible Portal Menu

The Portal menu is **always visible** in the header. When users are not authenticated:
- Dashboard links show "🔒 Login Required" badge
- Clicking locked links shows a professional login prompt modal
- Modal includes portal-specific description and "Sign In / Sign Up" button

When users are authenticated:
- Dashboard links show checkmarks (✓) for active role
- Builder Dashboard shows "✓ Verified" if builder is verified
- Admin Panel appears if user has admin role
- Links navigate directly (no login prompt)

### Responsive Design

- **Desktop (1080px+)**: Full navigation, trust pill visible
- **Tablet (880-1080px)**: Trust pill hidden, navigation still visible
- **Mobile (<880px)**: Tighter spacing, Pricing/About moved to Features dropdown

### Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support (Tab, Enter, Escape)
- Focus indicators meet WCAG requirements
- Screen reader friendly

### Performance

- Header height pre-calculated (60px) to prevent layout shift
- CSS namespaced to avoid conflicts with page-specific styles
- High z-index (9999) to prevent accidental hiding
- No render-blocking dependencies

## Dependencies

- **Role Manager**: `window.thgRoleManager` (for portal menu updates)
- **Auth System**: `window.authGate.openLoginModal` or `window.__thgOpenAuthModal` (for login modal)
- **Next.js Router** (optional): `window.__nextRouter` (for client-side navigation)

## CSS Namespacing

All CSS is namespaced with `.tharaga-header` to prevent conflicts:

```css
.tharaga-header { /* Header styles */ }
.tharaga-header .brand { /* Brand styles */ }
.tharaga-header nav { /* Navigation styles */ }
```

Critical layout properties use `!important` sparingly:
- `position: sticky !important`
- `top: 0 !important`
- `z-index: 9999 !important`

## JavaScript API

### Global Functions

- `window.__updatePortalMenu()` - Updates portal menu based on auth state (called by role manager)

### Events

- `tharaga-header-loaded` - Dispatched when header is injected (for header-injector.js)

## Testing

See `tests/header-smoke-test.md` for comprehensive testing checklist.

Run automated smoke tests:
```bash
./scripts/header-smoke-test.sh https://staging.tharaga.co.in
```

## Troubleshooting

### Header Not Visible

1. Check that header CSS is loaded (inspect `<head>`)
2. Verify header HTML is in DOM (check for `#tharaga-static-header`)
3. Check browser console for JavaScript errors
4. Verify z-index is not overridden by page CSS

### Login/Signup Buttons Not Showing

1. Verify auth system is loaded (`window.authGate` or `window.__thgOpenAuthModal`)
2. Check that `#site-header-auth-container` exists in header
3. Verify auth system is injecting `.thg-auth-wrap` into container

### Portal Menu Not Updating

1. Verify role manager is loaded (`window.thgRoleManager`)
2. Check browser console for errors
3. Verify `window.__updatePortalMenu` function exists
4. Check that role manager dispatches `thg-role-changed` events

### Header Clipped by Parent Element

If header is inside an element with `transform`, it may be clipped. Solution:
- Ensure header is mounted as direct child of `<body>`
- Or remove `transform` from parent element
- Header injector automatically mounts to `<body>` if mount point is not found

## Maintenance

When updating the header:

1. Update `header.html` for structure changes
2. Update `header.css` for style changes
3. Update `header.js` for functionality changes
4. Update `StaticHeaderHTML.tsx` to match changes (for Next.js)
5. Run smoke tests to verify changes
6. Test on all supported browsers and devices

## Related Files

- `app/components/StaticHeaderHTML.tsx` - Next.js React component wrapper
- `app/components/HeaderLinkInterceptor.tsx` - Next.js link interception
- `app/app/layout.tsx` - Root layout (includes header)

