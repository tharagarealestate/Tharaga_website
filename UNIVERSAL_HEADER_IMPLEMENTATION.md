# Universal Static Header Implementation

## Overview
The header is now **universal** and works automatically on **ALL pages** across the entire website. No need to import or include anything in feature files - it's already in the root layout.

## Architecture

### Location
- **Component**: `app/components/StaticHeaderHTML.tsx`
- **Root Layout**: `app/app/layout.tsx` (includes the header automatically)
- **Link Interceptor**: `app/components/HeaderLinkInterceptor.tsx` (handles Next.js navigation)

### How It Works

1. **Universal Inclusion**: The header is included in `app/app/layout.tsx`, which is the root layout for ALL pages
2. **No Re-renders**: Uses `React.memo()` to prevent unnecessary re-renders
3. **Sticky Positioning**: Uses `position: sticky` (matches homepage exactly)
4. **Client-side Navigation**: `HeaderLinkInterceptor` intercepts clicks and uses Next.js router for smooth navigation

## Features

✅ **Always Visible**: Header appears on ALL pages automatically
✅ **No Import Needed**: Feature files don't need to import anything
✅ **Sticky Behavior**: Header sticks to top when scrolling
✅ **Login/Signup Buttons**: Always visible via `#site-header-auth-container`
✅ **Portal Menu**: Dynamically updates based on user roles
✅ **Mobile Responsive**: Works perfectly on mobile and desktop
✅ **Exact Homepage Match**: Font sizes, gaps, spacing match homepage exactly

## Usage in New Feature Files

### ✅ CORRECT - No header import needed
```tsx
// app/app/tools/my-new-feature/page.tsx
"use client"

export default function MyNewFeature() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1>My New Feature</h1>
      {/* Header is automatically visible - no import needed! */}
    </main>
  )
}
```

### ❌ WRONG - Don't import header
```tsx
// DON'T DO THIS - Header is already in root layout
import StaticHeaderHTML from '@/components/StaticHeaderHTML'
```

## Testing Checklist

### ✅ All Tool Pages
- [x] `/tools/vastu/` - Header visible
- [x] `/tools/currency-risk/` - Header visible
- [x] `/tools/environment/` - Header visible
- [x] `/tools/voice-tamil/` - Header visible
- [x] `/tools/verification/` - Header visible
- [x] `/tools/roi/` - Header visible
- [x] `/tools/cost-calculator/` - Header visible
- [x] `/tools/remote-management/` - Header visible

### ✅ Other Pages
- [x] Homepage (`/`) - Header visible
- [x] `/pricing/` - Header visible
- [x] `/about/` - Header visible
- [x] `/properties/[id]` - Header visible
- [x] Dashboard pages - Header visible (with their own nav below)

### ✅ Functionality
- [x] Header doesn't reload on navigation
- [x] Login/Signup buttons always visible
- [x] Portal menu updates based on user roles
- [x] Dropdowns work correctly
- [x] Mobile responsive
- [x] Sticky positioning works

## CSS Variables

The header uses these CSS variables (defined in root layout):
- `--primary`: `#1e40af`
- `--gold`: `#d4af37`
- `--slate-900`: `#0f172a`
- `--font-display`: `'Plus Jakarta Sans', 'Manrope', ...`
- `--header-height`: `60px`

## Key Files

1. **`app/components/StaticHeaderHTML.tsx`** - Main header component
2. **`app/components/HeaderLinkInterceptor.tsx`** - Handles Next.js navigation
3. **`app/app/layout.tsx`** - Root layout (includes header)

## Troubleshooting

### Header not visible?
- Check browser console for errors
- Verify `StaticHeaderHTML` is imported in `app/app/layout.tsx`
- Check CSS isn't hiding it (`display: none`)

### Login/Signup buttons not visible?
- Verify `#site-header-auth-container` exists in header HTML
- Check auth scripts are loaded (`/role-manager-v2.js`, `/snippets/`)
- Verify `window.AUTH_HIDE_HEADER=false` is set

### Portal menu not updating?
- Check `window.thgRoleManager` is loaded
- Verify `window.__updatePortalMenu` function exists
- Check browser console for errors

## Notes

- Header uses **sticky positioning**, not fixed (matches homepage)
- Header **never reloads** - it's truly static across navigation
- All styling matches homepage exactly (font-size: 26px, gaps: 10px, etc.)
- Mobile responsive with proper spacing for auth buttons

