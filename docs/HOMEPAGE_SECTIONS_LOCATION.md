# Homepage Sections Location Guide

## Main Homepage File
**Location:** `app/public/index.html`

All homepage sections are defined in this single static HTML file (not React components).

---

## Homepage Sections Overview

### 1. **Header Section**
- **Line:** 1431-1536
- **Class:** `header.nav`
- **Status:** ✅ **KEEP** (Must remain untouched)
- **Description:** Universal header with glassmorphic design, navigation, Features/Portal dropdowns, auth buttons

### 2. **Hero Section** (`hero-premium`)
- **Line:** 1538-1605
- **Class:** `hero-premium`
- **Status:** ⚠️ **DELETE** (Except header)
- **Description:**
  - Dark gradient background
  - Headline: "Build Wealth, Not Just Homes"
  - Trust cards grid (28h Time Saved, 100% RERA Verified, ₹120Cr+ Deals Closed)
  - CTA buttons (Explore Properties, See How It Works)
  - Social proof with avatars and 5-star rating
  - 3D property card visual with AI Match badge (92%) and ROI badge (+24%)
  - Floating background shapes (gold and blue blurred circles)

### 3. **Trial CTA Section** (`trial-cta`)
- **Line:** 1608-1626
- **Class:** `trial-cta`
- **Status:** ⚠️ **DELETE**
- **Description:**
  - Dark gradient background similar to hero
  - "Ready to Build Real Wealth?" headline
  - Free trial messaging
  - Trust indicators (RERA Verified, Bank-Grade Security)

### 4. **Value Proposition Section** (`value-prop`)
- **Line:** 1629-1701
- **Class:** `value-prop`
- **Status:** ⚠️ **DELETE**
- **Description:**
  - Light gradient background
  - 6-card grid showcasing features:
    1. AI-Powered Intelligence
    2. Document Snapshot Immutability
    3. Zero Broker Commission
    4. ROI Prediction Engine
    5. Family Decision Tools
    6. Tamil Voice Search
  - Glass-card components with icon circles
  - Fade-up animations

### 5. **How It Works Section** (`features`)
- **Line:** 1708-1717
- **Class:** `features`
- **Status:** ⚠️ **DELETE**
- **Description:**
  - Embedded iframe to `/embed/how-it-works` route
  - Auto-resizing JavaScript for mobile responsiveness

### 6. **Footer Section**
- **Line:** 1719
- **Class:** `footer`
- **Status:** ⚠️ **DELETE**
- **Description:**
  - Simple footer with copyright and links (About, Trust, Email confirmation)

---

## Section Styling

All section styles are defined inline within `<style>` tags in the same file:
- **Lines:** 16-680+ (CSS styles)

Key styling includes:
- `.hero-premium` - Dark gradient hero section styling
- `.trial-cta` - Trial CTA section styling
- `.value-prop` - Value proposition section styling
- `.features` - How It Works section styling
- Background animations (gold and blue gradient orbs)
- Shimmer effects
- Fade-up animations

---

## Related Components (NOT used on homepage)

These components exist but are NOT part of the homepage:
- `app/components/sections/Footer.tsx` - React Footer component (not used)
- `app/components/hero/BuyerSearchHero.tsx` - Used elsewhere
- `app/components/AnimatedHowItWorks/HowItWorksAnimatedSection.tsx` - Used in iframe route `/embed/how-it-works`

---

## Next Steps for Redesign

1. **Keep:** Header section (lines 1431-1536)
2. **Delete:** All sections from line 1538 onwards (Hero, Trial CTA, Value Prop, How It Works, Footer)
3. **Delete:** Related CSS for deleted sections (clean up styles)
4. **Create:** New homepage sections according to redesign requirements

---

## Notes

- The homepage is entirely static HTML in `app/public/index.html`
- No React components are used for homepage sections (except the header which is rendered via layout)
- All styling is inline CSS within the same file
- The page uses vanilla JavaScript for interactions

