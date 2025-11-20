# Final Auth System Setup

## Overview
Using **snippets inline auth system** with iframe modal (not popup).

## How It Works

### 1. Header HTML
**File**: `app/app/layout.tsx` line 1911

Injected exact header HTML from `index.html` using `dangerouslySetInnerHTML`:
- Navigation with dropdowns
- **`#site-header-auth-container`** - Auth button injection point
- Mobile menu

### 2. Auth Scripts
**File**: `app/app/layout.tsx` lines 50-693

Inline auth script that:
- Finds `#site-header-auth-container`
- Creates login/signup button
- Injects button into container
- Opens iframe modal on click

### 3. Auth Modal System
**Files**:
- `login_signup_glassdrop/auth-gate.js` - Modal iframe handler
- `login_signup_glassdrop/index.html` - Login form loaded in iframe

**Flow**:
1. Click "Login / Signup" button
2. Opens iframe modal overlay
3. Loads `/login_signup_glassdrop/` in iframe
4. User logs in via Supabase
5. Modal closes, user authenticated

### 4. Deployment

**Netlify**:
- Serves `app/public/index.html` directly
- Header with auth built-in

**Vercel**:
- Serves Next.js app
- Header HTML injected via `dangerouslySetInnerHTML`
- Same auth scripts as index.html

**Both platforms**:
- Auth button appears in header
- Iframe modal auth works
- `login_signup_glassdrop/` files deployed

## Key Files

### Auth System
- `app/app/layout.tsx` (lines 50-693) - Inline auth script
- `login_signup_glassdrop/auth-gate.js` - Modal iframe handler
- `login_signup_glassdrop/index.html` - Login form

### Header
- `app/app/layout.tsx` (line 1911) - Injected header HTML
- `app/public/index.html` (lines 2068-2137) - Original header

### Build
- `scripts/copy-static.cjs` - Copies `login_signup_glassdrop/` to `app/public/`
- `app/vercel.json` - Rewrite `/` to `/index.html` (for static file fallback)

## Auth Button Injection Process

1. **Page loads** → Auth script runs (layout.tsx line 571)
2. **Find container** → `document.getElementById('site-header-auth-container')`
3. **Create button** → `<button class="thg-auth-btn">Login / Signup</button>`
4. **Inject button** → Append to container
5. **Add event** → Click opens iframe modal

## MutationObserver Fix

**Problem**: Header renders after auth script runs
**Solution**: MutationObserver watches for `#site-header-auth-container` appearing
**Code**: `layout.tsx` line 569 - `observeRerenders(ui)`

When header appears:
1. Observer detects new `#site-header-auth-container`
2. Moves auth button into it
3. Button appears correctly

## CSS Styling

**File**: `app/app/globals.css` lines 500-603

Homepage-specific auth button styling:
```css
body:has(.hero-premium) header.nav .thg-auth-wrap,
.homepage-header header.nav .thg-auth-wrap {
  position: absolute;
  right: 20px;
  top: 50%;
  /* White button on glassy header */
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}
```

## No Custom Components

✅ No `Header.tsx` component
✅ No recreation of auth system
✅ Using exact HTML from `index.html`
✅ Using exact auth scripts from `index.html`

## Summary

The auth system is a **direct copy** from `index.html`:
1. Header HTML copied exactly (via `dangerouslySetInnerHTML`)
2. Auth scripts copied exactly (inline in layout.tsx)
3. Auth modal files deployed (`login_signup_glassdrop/`)

Everything works the same as `index.html`! 🎉
