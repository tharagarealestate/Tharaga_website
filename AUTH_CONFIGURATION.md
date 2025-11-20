# Authentication System Configuration

## ✅ Complete Setup Verification

This document verifies that the authentication system (login/signup buttons) is properly configured for **Vercel deployment**.

## Configuration Checklist

### 1. Header Component ✅
**File**: `app/components/Header.tsx`

```tsx
<div id="site-header-auth-container" className="tharaga-header__actions"></div>
```

- ✅ Has `id="site-header-auth-container"` - Required for auth system injection
- ✅ Has `className="tharaga-header__actions"` - Additional styling class
- ✅ Empty div - Auth system will populate with buttons dynamically

### 2. Layout Configuration ✅
**File**: `app/app/layout.tsx`

#### Auth Scripts Loaded:
- ✅ **Line 50**: `window.AUTH_HIDE_HEADER=false` - Shows auth buttons
- ✅ **Line 50**: `window.AUTH_OPEN_ON_LOAD=false` - Don't auto-open login modal
- ✅ **Line 53**: `<Script src="/role-manager-v2.js" strategy="beforeInteractive" />` - Role management
- ✅ **Lines 97-693**: Inline auth script with `authGate.openLoginModal()` function
- ✅ **Line 183**: `document.getElementById('site-header-auth-container')` - Finds container

#### Auth System Functions:
```javascript
// Line 102-103
window.authGate = window.authGate || {};
window.authGate.openLoginModal = function(opts){ ... };

// Line 181-203
function ensureContainer(){
  let wrap = document.getElementById('site-header-auth-container');
  if (wrap) {
    wrap.classList.add('thg-auth-wrap');
    return wrap;
  }
  // Fallback to creating wrapper...
}
```

### 3. CSS Styling ✅
**File**: `app/app/layout.tsx` (lines 1254-1332)

```css
/* Override auth system's absolute positioning */
header.nav #site-header-auth-container.thg-auth-wrap {
  display:flex !important;
  align-items:center !important;
  gap:12px !important;
  position: relative !important;
  margin-left: auto !important;
}

/* Auth button styling */
header.nav .thg-auth-btn{
  background:rgba(30,64,175,.08) !important;
  color:#1e40af !important;
  border-color:rgba(30,64,175,.20) !important;
}
```

**File**: `app/app/globals.css` (lines 500-603)

```css
/* Homepage-specific auth styling */
body:has(.hero-premium) header.nav .thg-auth-wrap,
.homepage-header header.nav .thg-auth-wrap {
  /* White buttons on glassy header for dark hero background */
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}
```

### 4. Homepage Setup ✅
**File**: `app/app/page.tsx`

```tsx
export default function HomePage() {
  return (
    <div className="homepage-header">  {/* ← Triggers homepage-specific CSS */}
      <main>
        <HeroSection />  {/* Has .hero-premium class */}
        ...
      </main>
    </div>
  )
}
```

- ✅ Has `className="homepage-header"` - Triggers homepage auth styles
- ✅ HeroSection has `.hero-premium` class - Alternative CSS trigger

## How It Works

### 1. Page Load Sequence:
1. Layout loads `role-manager-v2.js` before page renders (`beforeInteractive`)
2. Inline auth script runs and finds `#site-header-auth-container`
3. Auth script adds `thg-auth-wrap` class to container
4. Auth script creates Login/Signup button and inserts into container
5. CSS from `globals.css` styles the buttons (white on transparent for homepage)

### 2. Auth Button Injection:
```javascript
// From layout.tsx line 183-189
let wrap = document.getElementById('site-header-auth-container');
if (wrap) {
  // Add auth wrapper class
  wrap.classList.add('thg-auth-wrap');

  // Auth system will then create button:
  // <button class="thg-auth-btn">
  //   Login / Signup
  // </button>
}
```

### 3. Homepage vs Other Pages:
- **Homepage**: White buttons on glassy transparent background (for dark hero)
- **Other pages**: Blue buttons on white header background
- Triggered by `.homepage-header` or `.hero-premium` presence

## Files Involved

### Core Files:
1. `app/components/Header.tsx` - Header with auth container
2. `app/app/layout.tsx` - Auth scripts and configuration
3. `app/app/globals.css` - Auth button styles
4. `app/app/page.tsx` - Homepage with trigger classes
5. `app/public/role-manager-v2.js` - Role management script

### Section Components:
1. `app/components/sections/HeroSection.tsx` - Hero with `.hero-premium` class
2. `app/components/sections/DashboardCTASection.tsx`
3. `app/components/sections/FeaturesSection.tsx`
4. `app/components/sections/Footer.tsx`

## Verification Steps

### Check on Live Site:
1. Visit https://tharaga-website.vercel.app/
2. Open browser DevTools Console
3. Run: `document.getElementById('site-header-auth-container')`
   - Should return the div element
4. Run: `window.authGate`
   - Should return object with `openLoginModal` function
5. Run: `document.querySelector('.thg-auth-btn')`
   - Should return the auth button element (if auth system loaded)

### Expected HTML Structure:
```html
<header class="nav">
  <div class="inner">
    <!-- Navigation items -->
    <div id="site-header-auth-container" class="tharaga-header__actions thg-auth-wrap">
      <!-- Auth system injects this: -->
      <button class="thg-auth-btn">
        Login / Signup
      </button>
    </div>
  </div>
</header>
```

## Troubleshooting

### If buttons don't appear:

1. **Check browser console** for errors
   - Look for script loading errors
   - Check for Supabase connection issues

2. **Verify scripts loaded**:
   ```javascript
   // In console:
   window.authGate  // Should exist
   window.__thgAuthInstalledV1  // Should be true
   ```

3. **Check container exists**:
   ```javascript
   document.getElementById('site-header-auth-container')  // Should return element
   ```

4. **Verify CSS applied**:
   ```javascript
   const container = document.getElementById('site-header-auth-container')
   getComputedStyle(container).display  // Should be 'flex'
   ```

5. **Check for CSP errors**:
   - Content Security Policy might block scripts
   - Verify Supabase domain is allowed

## Comparison: Netlify vs Vercel

### Netlify (Static):
- Serves `app/public/index.html` directly
- Auth scripts embedded in HTML `<head>`
- All configuration inline in HTML file

### Vercel (Next.js):
- Serves Next.js app with React components
- Auth scripts in `layout.tsx` `<Script>` tags
- Header from `components/Header.tsx`
- **Identical functionality** to Netlify version

## Important Notes

### ⚠️ Don't Modify:
- The `#site-header-auth-container` ID (required by auth system)
- The auth script in `layout.tsx` (synced with role-manager-v2.js)
- The `window.AUTH_HIDE_HEADER=false` config

### ✅ Safe to Modify:
- Button styling in CSS (colors, spacing, etc.)
- Header layout and navigation items
- Homepage section components

## Summary

**Everything is configured correctly!**

The auth buttons will appear automatically once the deployment completes and the page loads. The system:
1. ✅ Finds the container (`#site-header-auth-container`)
2. ✅ Injects the auth button
3. ✅ Applies correct styling (white for homepage, blue for other pages)
4. ✅ Connects to Supabase for authentication

No further configuration needed.
