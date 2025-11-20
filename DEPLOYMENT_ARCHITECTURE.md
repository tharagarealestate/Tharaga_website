# Deployment Architecture

## Overview

This project uses a **unified Next.js deployment** strategy that works identically on both Vercel and Netlify.

## Deployment Platforms

### ✅ Vercel (Production)
- **URL**: https://tharaga-website.vercel.app/
- **Build**: Automatic from `main` branch
- **Framework**: Next.js App Router
- **Homepage**: Renders `app/app/page.tsx` with `Header` component from `app/components/Header.tsx`

### ✅ Netlify (Alternative/Staging)
- **Build**: Automatic from `main` branch
- **Framework**: Next.js App Router (via `@netlify/plugin-nextjs`)
- **Publish Directory**: `app/.next`
- **Homepage**: Renders `app/app/page.tsx` with `Header` component from `app/components/Header.tsx`

## Homepage Architecture

### Current Setup (Next.js Components)

**File**: `app/app/page.tsx`

```tsx
import { HeroSection } from '@/components/sections/HeroSection'
import { DashboardCTASection } from '@/components/sections/DashboardCTASection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { Footer } from '@/components/sections/Footer'

export default function HomePage() {
  return (
    <div className="homepage-header">
      <main>
        <HeroSection />           // Premium blue gradient with AI search
        <DashboardCTASection />   // Call-to-action section
        <FeaturesSection />       // Platform features
      </main>
      <Footer />
    </div>
  )
}
```

**Header**: Rendered globally in `app/app/layout.tsx`

```tsx
import Header from '@/components/Header'

export default function RootLayout({ children }) {
  return (
    <body>
      <Header />  // Global navigation with auth
      {children}
    </body>
  )
}
```

### Static Files (Backup)

**File**: `app/public/index.html`

- Contains complete static HTML version with embedded header
- Includes all sections: Hero, Dashboard CTA, Features, Footer
- Has inline CSS styles matching Next.js design
- **NOT currently served** (rewrite rule in `next.config.mjs` doesn't work on Vercel)
- Kept as backup/reference implementation

## Why Both Platforms Serve Next.js

### Initial Problem
- Attempted to serve static `index.html` using rewrite in `next.config.mjs`:
  ```js
  rules.push({ source: '/', destination: '/index.html' })
  ```
- This **does not work on Vercel** (rewrites to public files fail)
- Netlify also configured for Next.js via `@netlify/plugin-nextjs`

### Solution
- Restored `Header` component to Next.js app
- Both platforms now serve identical Next.js build
- Header appears correctly on all pages
- No platform-specific configuration needed

## Key Files

### Next.js Components
- `app/components/Header.tsx` - Global navigation header
- `app/components/sections/HeroSection.tsx` - Homepage hero
- `app/components/sections/DashboardCTASection.tsx` - CTA section
- `app/components/sections/FeaturesSection.tsx` - Features grid
- `app/components/sections/Footer.tsx` - Site footer

### Styling
- `app/app/globals.css` - Global styles with glassmorphism header
- Includes `body:has(.hero-premium)` selectors for homepage-specific styling
- White text on transparent glassy background for header on homepage

### Configuration
- `app/next.config.mjs` - Next.js configuration
- `netlify.toml` - Netlify build and redirects
- `vercel.json` - (Not present, using auto-detection)

## Deployment Flow

### Vercel
1. Push to `main` branch
2. Vercel auto-builds Next.js
3. Deploys to production
4. Homepage renders with Header component

### Netlify
1. Push to `main` branch
2. Runs build command: `npm run build` in `app/`
3. Publishes `app/.next` directory
4. Homepage renders with Header component (identical to Vercel)

## Important Notes

### ❌ Don't Do This
- **Don't** try to serve `public/index.html` as homepage on Vercel (rewrites don't work)
- **Don't** remove `Header` component from `layout.tsx`
- **Don't** modify `next.config.mjs` rewrite rules (they don't work on Vercel)

### ✅ Do This
- **Do** keep Header component in `components/Header.tsx`
- **Do** import Header in `app/layout.tsx`
- **Do** maintain `public/index.html` as reference/backup
- **Do** use Next.js components for all sections

## Migration History

### Commit Timeline
- `be3eea0` - Attempted to integrate sections into static index.html, removed Header
- `7c6b3a4` - Had working Header component in Next.js
- `7ece3fe` - **Current**: Restored Header component, both platforms work

### Lessons Learned
1. Vercel doesn't support rewrites to public files for homepage
2. Both platforms work best with consistent Next.js approach
3. Static `index.html` can't be reliably served on Vercel
4. Component-based approach provides better maintainability

## Future Improvements

If you want to serve static `index.html` on Netlify only:

1. Create separate `netlify.toml` build context
2. Change publish directory to `app/public` for Netlify
3. Keep Vercel serving Next.js
4. Maintain two separate deployment strategies

**Current recommendation**: Keep unified Next.js approach for simplicity and consistency.
