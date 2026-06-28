# UI Diff Analysis: /pricing vs /property-listing

## Root Cause Summary

1. **Architecture Mismatch**: Pricing page uses Next.js React with Tailwind CSS classes, while property-listing is a static HTML file with standalone CSS
2. **CSS System**: Pricing relies on `app/app/globals.css` + Tailwind utilities, property-listing uses `property-listing/styles.css` (custom CSS)
3. **Font Loading**: Both import Playfair Display + Inter, but property-listing loads fonts directly in HTML while pricing uses globals.css import

## File Paths Comparison

### Pricing Page
- **Template**: `app/app/(marketing)/pricing/page.tsx`
- **CSS**: `app/app/globals.css` (imported globally via Next.js)
- **Components**: `app/components/pricing/PricingCard.tsx`
- **Config**: `app/tailwind.config.ts`
- **Fonts**: Imported in `globals.css` line 1

### Property Listing Page
- **Template**: `property-listing/index.html` (static HTML)
- **CSS**: `property-listing/styles.css` (standalone file)
- **Fonts**: Imported in HTML `<head>` (lines 7-9)

## Key Differences

### 1. Background Gradient
**Pricing** (page.tsx:15):
```tsx
className='min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800'
```

**Property Listing** (styles.css:58):
```css
background: linear-gradient(135deg, rgb(var(--primary-950)) 0%, rgb(var(--primary-900)) 50%, rgb(var(--primary-800)) 100%);
```
✅ **Status**: MATCHED (same gradient, different syntax)

### 2. Glass Card Styling
**Pricing** (uses Tailwind classes):
```tsx
className='backdrop-blur-xl bg-white/10 border border-white/20'
```

**Property Listing** (custom CSS):
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);
border: 1px solid rgba(255, 255, 255, 0.2);
```
✅ **Status**: MATCHED (equivalent styles)

### 3. Animated Background Blobs
**Pricing** (page.tsx:21-26):
```tsx
<div className='absolute inset-0 opacity-30'>
  <div className='absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow' />
  <div className='absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow' style={{ animationDelay: '1s' }} />
</div>
```

**Property Listing** (styles.css:65-119):
```css
body::after { /* gold blob */ }
body > .bg-blob-2 { /* emerald blob */ }
```
✅ **Status**: MATCHED (same effect, different implementation)

### 4. Font Family
**Pricing** (globals.css:91):
```css
--font-display: var(--font-playfair), 'Playfair Display', 'Merriweather', Georgia, serif;
```

**Property Listing** (styles.css:56):
```css
font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
```
⚠️ **Status**: DIFFERENT - Property listing doesn't use Playfair Display for headings

### 5. Hero Title Styling
**Pricing** (page.tsx:42-44):
```tsx
<h1 className='font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6'>
  Choose Your
  <span className='text-gradient-gold block mt-2'>Growth Path</span>
</h1>
```

**Property Listing** (index.html:33-35, styles.css:235-264):
```html
<h1 class="hero-title">
  Discover Premium Homes
  <span class="hero-title-accent">Across Tamil Nadu</span>
</h1>
```
```css
.hero-title {
  font-family: 'Playfair Display', 'Merriweather', Georgia, serif;
  font-weight: 700;
  font-size: 48px; /* responsive in media queries */
}
```
✅ **Status**: MATCHED (both use Playfair Display for hero)

## Missing Elements in Property Listing

1. **Tailwind Utility Classes**: Property listing can't use Tailwind classes like `text-gradient-gold`, `bg-gold-500/20`, etc.
2. **Responsive Font Sizing**: Pricing uses Tailwind responsive classes (`text-5xl sm:text-6xl lg:text-7xl`), property-listing uses media queries
3. **Component Structure**: Pricing uses React components with props, property-listing uses static HTML

## Recommendations

1. ✅ **Already Fixed**: Glassmorphic styling is matched
2. ✅ **Already Fixed**: Background gradient is matched
3. ✅ **Already Fixed**: Animated blobs are matched
4. ⚠️ **Verify**: Font rendering crispness (needs browser testing)
5. ⚠️ **Verify**: Backdrop-filter browser support (needs testing)

## Next Steps for Validation

1. Build and run local server
2. Take screenshots of both pages
3. Run Lighthouse audits
4. Check computed styles in browser DevTools
5. Verify font loading and rendering

