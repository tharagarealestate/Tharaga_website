# Billing Page Design System - Reusable Code Patterns & Calculations

## Overview
This document provides detailed code patterns, calculations, and design structures extracted from the billing page implementation. Use these patterns to build consistent, professional features across the application.

---

## 1. Color System & Gradients

### 1.1 Background Gradients
```tsx
// Main Container Gradient (Multi-layer depth)
className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95"

// Calculation Breakdown:
// - from-slate-800/95: Starting point at 95% opacity (rgba(30, 41, 59, 0.95))
// - via-slate-800/95: Midpoint transition (same color for smooth blend)
// - to-slate-900/95: End point at 95% opacity (rgba(15, 23, 42, 0.95))
// - Direction: to-br (to bottom-right) creates subtle depth illusion
```

### 1.2 Header Gradient (Accent Section)
```tsx
// Header with Amber Accent Gradient
className="bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20"

// Calculation Breakdown:
// - from-amber-500/20: Start at 20% opacity amber-500 (rgba(245, 158, 11, 0.2))
// - via-amber-600/20: Midpoint at 20% opacity amber-600 (rgba(217, 119, 6, 0.2))
// - to-amber-500/20: End at 20% opacity amber-500 (creates symmetry)
// - Direction: to-r (to right) for horizontal gradient
// - Purpose: Creates premium accent without overwhelming content
```

### 1.3 Pricing Section Gradient
```tsx
// Subtle Background Gradient for Pricing Display
className="bg-gradient-to-b from-slate-800/50 to-transparent"

// Calculation Breakdown:
// - from-slate-800/50: Start at 50% opacity (rgba(30, 41, 59, 0.5))
// - to-transparent: Fade to fully transparent
// - Direction: to-b (to bottom) creates fade effect
// - Purpose: Subtle visual separation without hard borders
```

### 1.4 Button Gradient (Primary CTA)
```tsx
// Primary Action Button Gradient
className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"

// Calculation Breakdown:
// - from-amber-600: Start color (rgba(217, 119, 6, 1))
// - to-amber-500: End color (rgba(245, 158, 11, 1))
// - Hover: Lighter shades for feedback (amber-500 → amber-400)
// - Direction: to-r (horizontal) for consistent button appearance
```

### 1.5 Color Opacity Scale (Standard Pattern)
```tsx
// Standard Opacity Levels Used:
/20  = 20% opacity (subtle backgrounds, overlays)
/25  = 25% opacity (borders, dividers)
/30  = 30% opacity (hover states, secondary backgrounds)
/50  = 50% opacity (medium emphasis, semi-transparent)
/95  = 95% opacity (near-opaque, main containers)
// Full opacity (no suffix) = 100% (text, icons, primary elements)
```

---

## 2. Glow Border System

### 2.1 Standard Glow Border
```tsx
// Applied via className="glow-border"
// CSS Definition (should be in global CSS):
.glow-border {
  border: 1px solid rgba(251, 191, 36, 0.25);  /* amber-300 at 25% opacity */
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.1); /* Soft glow effect */
}

// Calculation Breakdown:
// - Border: 1px solid amber-300 at 25% opacity
// - Box-shadow: 10px blur radius, amber-300 at 10% opacity
// - Creates subtle golden glow around elements
```

### 2.2 Border with Glow (Divider)
```tsx
className="border-b glow-border border-b-amber-300/25"

// Calculation Breakdown:
// - border-b: Bottom border only
// - glow-border: Applies the glow effect class
// - border-b-amber-300/25: Explicit color override (redundant but ensures consistency)
// - Purpose: Creates elegant section dividers
```

### 2.3 Hover Glow Effect
```tsx
className="hover:glow-border transition-all"

// Calculation Breakdown:
// - hover:glow-border: Applies glow on hover state
// - transition-all: Smooth transition for all properties
// - Creates interactive feedback for clickable elements
```

---

## 3. Spacing & Layout Calculations

### 3.1 Container Spacing
```tsx
// Main Container
className="space-y-6"

// Calculation Breakdown:
// - space-y-6: 1.5rem (24px) vertical spacing between children
// - Applied to: Main container div wrapping all tabs
// - Creates consistent vertical rhythm
```

### 3.2 Card Padding System
```tsx
// Standard Card Padding
className="p-6 sm:p-8"

// Calculation Breakdown:
// - p-6: 1.5rem (24px) padding on mobile
// - sm:p-8: 2rem (32px) padding on small screens and up
// - Responsive: Increases padding on larger screens for better breathing room
// - Formula: Mobile (24px) → Desktop (32px) = 33% increase
```

### 3.3 Section Padding (Large Cards)
```tsx
// Header Section Padding
className="p-8 sm:p-12"

// Calculation Breakdown:
// - p-8: 2rem (32px) padding on mobile
// - sm:p-12: 3rem (48px) padding on small screens and up
// - Used for: Important sections like pricing headers
// - Formula: Mobile (32px) → Desktop (48px) = 50% increase
```

### 3.4 Grid Gap System
```tsx
// Statistics Grid
className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"

// Calculation Breakdown:
// - gap-4: 1rem (16px) gap between grid items
// - sm:grid-cols-2: 2 columns on small screens (640px+)
// - lg:grid-cols-4: 4 columns on large screens (1024px+)
// - Responsive breakpoints: Mobile (1 col) → Tablet (2 cols) → Desktop (4 cols)
```

### 3.5 Button Padding System
```tsx
// Primary Button
className="px-8 py-4"

// Calculation Breakdown:
// - px-8: 2rem (32px) horizontal padding
// - py-4: 1rem (16px) vertical padding
// - Ratio: 2:1 horizontal to vertical (wider than tall)
// - Creates comfortable click target (minimum 44x44px recommended)

// Large CTA Button
className="px-10 py-5"

// Calculation Breakdown:
// - px-10: 2.5rem (40px) horizontal padding
// - py-5: 1.25rem (20px) vertical padding
// - Ratio: 2:1 horizontal to vertical (maintained)
// - Used for: Primary subscription buttons
```

### 3.6 Icon Container Padding
```tsx
// Icon Background Container
className="p-3 bg-amber-500/20 rounded-lg"

// Calculation Breakdown:
// - p-3: 0.75rem (12px) padding around icon
// - Creates: Square container with icon centered
// - Size calculation: Icon (24px) + padding (12px × 2) = 48px total
```

---

## 4. Typography Hierarchy

### 4.1 Page Title
```tsx
className="text-2xl sm:text-3xl font-bold text-white"

// Calculation Breakdown:
// - text-2xl: 1.5rem (24px) on mobile
// - sm:text-3xl: 1.875rem (30px) on small screens+
// - font-bold: 700 weight
// - text-white: Primary text color
// - Responsive increase: 25% larger on desktop
```

### 4.2 Section Headers
```tsx
className="text-3xl sm:text-4xl font-bold text-white"

// Calculation Breakdown:
// - text-3xl: 1.875rem (30px) on mobile
// - sm:text-4xl: 2.25rem (36px) on small screens+
// - font-bold: 700 weight
// - Used for: Main pricing card titles
// - Responsive increase: 20% larger on desktop
```

### 4.3 Pricing Display
```tsx
className="text-5xl sm:text-6xl font-bold text-white mb-2"

// Calculation Breakdown:
// - text-5xl: 3rem (48px) on mobile
// - sm:text-6xl: 3.75rem (60px) on small screens+
// - font-bold: 700 weight
// - mb-2: 0.5rem (8px) margin bottom
// - Responsive increase: 25% larger on desktop
// - Purpose: Large, attention-grabbing price display
```

### 4.4 Subtitle Text
```tsx
className="text-lg sm:text-xl text-slate-300"

// Calculation Breakdown:
// - text-lg: 1.125rem (18px) on mobile
// - sm:text-xl: 1.25rem (20px) on small screens+
// - text-slate-300: Secondary text color
// - Responsive increase: ~11% larger on desktop
```

### 4.5 Body Text
```tsx
className="text-sm text-slate-400"

// Calculation Breakdown:
// - text-sm: 0.875rem (14px)
// - text-slate-400: Tertiary text color
// - Used for: Labels, metadata, descriptions
```

### 4.6 Label Text (Uppercase)
```tsx
className="text-xs text-slate-400 mb-2 uppercase tracking-wide"

// Calculation Breakdown:
// - text-xs: 0.75rem (12px)
// - uppercase: All caps transformation
// - tracking-wide: Increased letter spacing (0.025em)
// - mb-2: 0.5rem (8px) margin bottom
// - Purpose: Small labels with high readability
```

---

## 5. Border Radius System

### 5.1 Standard Card Radius
```tsx
className="rounded-lg"

// Calculation Breakdown:
// - rounded-lg: 0.5rem (8px) border radius
// - Used for: Standard cards, containers
// - Creates: Soft, modern appearance
```

### 5.2 Large Card Radius
```tsx
className="rounded-xl"

// Calculation Breakdown:
// - rounded-xl: 0.75rem (12px) border radius
// - Used for: Main feature cards, pricing cards
// - Creates: More prominent, premium feel
```

### 5.3 Button Radius
```tsx
className="rounded-lg"

// Calculation Breakdown:
// - rounded-lg: 0.5rem (8px) border radius
// - Used for: All buttons
// - Creates: Consistent button appearance
```

### 5.4 Icon Container Radius
```tsx
className="rounded-lg"

// Calculation Breakdown:
// - rounded-lg: 0.5rem (8px) border radius
// - Used for: Icon backgrounds, small containers
```

### 5.5 Badge/Pill Radius
```tsx
className="rounded-full"

// Calculation Breakdown:
// - rounded-full: 9999px (fully rounded)
// - Used for: Status badges, savings badges
// - Creates: Pill-shaped elements
```

---

## 6. Shadow System

### 6.1 Card Shadow
```tsx
className="shadow-2xl"

// Calculation Breakdown:
// - shadow-2xl: Large shadow (0 25px 50px -12px rgba(0, 0, 0, 0.25))
// - Used for: Main cards, elevated elements
// - Creates: Depth and separation from background
```

### 6.2 Button Hover Shadow
```tsx
className="hover:shadow-lg hover:shadow-amber-500/30"

// Calculation Breakdown:
// - shadow-lg: Large shadow (0 10px 15px -3px rgba(0, 0, 0, 0.1))
// - shadow-amber-500/30: Colored shadow at 30% opacity
// - Creates: Glowing effect on hover
// - Formula: Standard shadow + colored overlay
```

### 6.3 Badge Shadow
```tsx
className="shadow-lg glow-border"

// Calculation Breakdown:
// - shadow-lg: Standard large shadow
// - glow-border: Adds golden glow effect
// - Used for: Savings badges, status indicators
```

---

## 7. Animation Patterns (Framer Motion)

### 7.1 Tab Transition Animation
```tsx
<AnimatePresence mode="wait">
  {activeTab === 'overview' && (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Content */}
    </motion.div>
  )}
</AnimatePresence>

// Calculation Breakdown:
// - initial: opacity 0, y: 20 (starts invisible, 20px below)
// - animate: opacity 1, y: 0 (fades in, moves to position)
// - exit: opacity 0, y: -20 (fades out, moves 20px up)
// - mode="wait": Waits for exit before entering
// - Duration: Default 0.3s (smooth transition)
```

### 7.2 Staggered List Animation
```tsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    {/* Item */}
  </motion.div>
))}

// Calculation Breakdown:
// - delay: index * 0.05 (50ms delay per item)
// - Creates: Cascading reveal effect
// - Example: Item 0 = 0ms, Item 1 = 50ms, Item 2 = 100ms
```

### 7.3 Card Entrance Animation
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  className="bg-slate-800/95 glow-border rounded-xl"
>
  {/* Card Content */}
</motion.div>

// Calculation Breakdown:
// - initial: opacity 0, scale 0.95 (slightly smaller, invisible)
// - animate: opacity 1, scale 1 (full size, visible)
// - Creates: Subtle zoom-in effect
// - Duration: Default 0.3s
```

### 7.4 Error Alert Animation
```tsx
<AnimatePresence>
  {error && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 rounded-lg bg-rose-500/20 border border-rose-400/50"
    >
      {/* Error Message */}
    </motion.div>
  )}
</AnimatePresence>

// Calculation Breakdown:
// - initial: opacity 0, y: -10 (starts above, invisible)
// - animate: opacity 1, y: 0 (slides down, fades in)
// - exit: opacity 0, y: -10 (slides up, fades out)
// - Creates: Slide-down notification effect
```

### 7.5 Feature List Stagger Animation
```tsx
{features.map((feature, index) => (
  <motion.div
    key={index}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.03 }}
  >
    {/* Feature Item */}
  </motion.div>
))}

// Calculation Breakdown:
// - initial: opacity 0, x: -20 (starts left, invisible)
// - animate: opacity 1, x: 0 (slides right, fades in)
// - delay: index * 0.03 (30ms delay per item)
// - Creates: Left-to-right reveal with stagger
```

---

## 8. Tab Navigation System

### 8.1 Tab Container
```tsx
<div className="flex gap-2 border-b border-amber-300/20 pb-2 overflow-x-auto">
  {/* Tabs */}
</div>

// Calculation Breakdown:
// - flex: Horizontal layout
// - gap-2: 0.5rem (8px) spacing between tabs
// - border-b: Bottom border divider
// - border-amber-300/20: Amber border at 20% opacity
// - pb-2: 0.5rem (8px) padding bottom
// - overflow-x-auto: Horizontal scroll on mobile
```

### 8.2 Tab Button (Inactive)
```tsx
<button
  className="px-6 py-3 font-medium transition-all flex items-center gap-2 text-slate-400 hover:text-white"
>
  <Icon className="h-4 w-4" />
  {label}
</button>

// Calculation Breakdown:
// - px-6: 1.5rem (24px) horizontal padding
// - py-3: 0.75rem (12px) vertical padding
// - text-slate-400: Inactive text color
// - hover:text-white: White on hover
// - gap-2: 0.5rem (8px) space between icon and text
```

### 8.3 Tab Button (Active)
```tsx
<button
  className="px-6 py-3 font-medium transition-all flex items-center gap-2 text-amber-300 border-b-2 border-amber-300"
>
  <Icon className="h-4 w-4" />
  {label}
</button>

// Calculation Breakdown:
// - text-amber-300: Active text color (gold)
// - border-b-2: 2px bottom border (thicker for emphasis)
// - border-amber-300: Amber border color
// - Creates: Underline indicator for active tab
```

---

## 9. Status Badge System

### 9.1 Success Badge
```tsx
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
  {status}
</span>

// Calculation Breakdown:
// - px-3: 0.75rem (12px) horizontal padding
// - py-1: 0.25rem (4px) vertical padding
// - rounded-full: Fully rounded (pill shape)
// - text-xs: 0.75rem (12px) font size
// - bg-emerald-500/20: Green background at 20% opacity
// - text-emerald-300: Green text color
// - border: 1px border
// - border-emerald-400/30: Green border at 30% opacity
```

### 9.2 Error Badge
```tsx
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-400/30">
  {status}
</span>

// Calculation Breakdown:
// - Same structure as success badge
// - Colors: Rose/red instead of emerald/green
// - Used for: Error states, cancelled items
```

### 9.3 Neutral Badge
```tsx
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50">
  {status}
</span>

// Calculation Breakdown:
// - Same structure as success badge
// - Colors: Slate/gray for neutral states
// - Used for: Pending, inactive states
```

---

## 10. Statistics Card Pattern

### 10.1 Statistics Card Structure
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
  className="p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50"
>
  <div className="flex items-center justify-between mb-4">
    <Icon className="h-8 w-8 text-amber-300" />
    <TrendingUp className="h-4 w-4 text-emerald-400" />
  </div>
  <p className="text-2xl font-bold text-white mb-1">{value}</p>
  <p className="text-sm text-slate-400">{label}</p>
</motion.div>

// Calculation Breakdown:
// - p-6: 1.5rem (24px) padding
// - bg-slate-800/95: Dark background at 95% opacity
// - glow-border: Golden glow effect
// - border border-slate-700/50: Additional border at 50% opacity
// - Icon: h-8 w-8 (32px) main icon
// - Secondary icon: h-4 w-4 (16px) indicator icon
// - Value: text-2xl (24px) bold white text
// - Label: text-sm (14px) slate-400 text
// - Animation delay: 0.1s (100ms) for stagger effect
```

### 10.2 Statistics Grid Layout
```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {/* Statistics Cards */}
</div>

// Calculation Breakdown:
// - gap-4: 1rem (16px) gap between cards
// - sm:grid-cols-2: 2 columns on 640px+ screens
// - lg:grid-cols-4: 4 columns on 1024px+ screens
// - Responsive: 1 → 2 → 4 columns
```

---

## 11. Pricing Display Pattern

### 11.1 Billing Cycle Toggle
```tsx
<div className="flex items-center justify-center gap-4 mb-8">
  {(['monthly', 'yearly'] as const).map((cycle) => (
    <button
      key={cycle}
      onClick={() => setBillingCycle(cycle)}
      className={`px-6 py-3 rounded-lg transition-all capitalize font-medium ${
        billingCycle === cycle
          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
      }`}
    >
      {cycle}
      {cycle === 'yearly' && (
        <span className="ml-2 text-xs bg-green-500/30 text-green-300 px-2 py-1 rounded-full">
          Save 17%
        </span>
      )}
    </button>
  ))}
</div>

// Calculation Breakdown:
// - gap-4: 1rem (16px) spacing between buttons
// - mb-8: 2rem (32px) margin bottom
// - px-6 py-3: Button padding (24px × 12px)
// - Active state: amber-500 background, white text, shadow
// - Inactive state: slate-700/50 background, slate-300 text
// - Savings badge: ml-2 (8px) left margin, px-2 py-1 (8px × 4px) padding
```

### 11.2 Price Display (Monthly)
```tsx
<div className="text-center">
  <div className="text-sm text-slate-400 mb-2 uppercase tracking-wide">Monthly</div>
  <div className="text-5xl sm:text-6xl font-bold text-white mb-2">
    {plan.pricing.monthly.display}
  </div>
  <div className="text-lg text-slate-400">per month</div>
</div>

// Calculation Breakdown:
// - Label: text-sm (14px) uppercase slate-400
// - Price: text-5xl (48px) mobile, text-6xl (60px) desktop
// - font-bold: 700 weight for emphasis
// - Subtext: text-lg (18px) slate-400
// - mb-2: 0.5rem (8px) margin between elements
```

### 11.3 Price Display (Yearly with Comparison)
```tsx
<div className="flex items-center justify-center gap-8 mb-8 flex-wrap">
  {/* Old Price */}
  <div className="text-center">
    <div className="text-sm text-slate-400 mb-2 uppercase tracking-wide">Monthly</div>
    <div className="text-4xl font-bold text-white line-through text-slate-500 mb-2">
      {plan.pricing.monthly.display}
    </div>
    <div className="text-sm text-slate-400">per month</div>
  </div>
  
  {/* Arrow */}
  <div className="text-slate-400 text-3xl">→</div>
  
  {/* New Price with Badge */}
  <div className="relative text-center">
    <div className="absolute -top-4 -right-4 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-full glow-border shadow-lg">
      Save 17%
    </div>
    <div className="text-sm text-slate-400 mb-2 uppercase tracking-wide">Yearly</div>
    <div className="text-5xl sm:text-6xl font-bold text-green-300 mb-2">
      {plan.pricing.yearly.display}
    </div>
    <div className="text-lg text-slate-400">per month</div>
    <div className="text-sm text-slate-500 mt-2">{plan.pricing.yearly.totalYearly}</div>
  </div>
</div>

// Calculation Breakdown:
// - gap-8: 2rem (32px) spacing between price displays
// - Old price: text-4xl (36px), line-through, text-slate-500
// - Arrow: text-3xl (30px) separator
// - Savings badge: absolute positioned, -top-4 -right-4 (negative positioning)
// - New price: text-5xl/6xl (48px/60px), text-green-300 (highlighted)
// - Total: text-sm (14px) slate-500 for yearly total
```

---

## 12. Button System

### 12.1 Primary CTA Button
```tsx
<button
  className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-bold text-lg rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1"
>
  {content}
</button>

// Calculation Breakdown:
// - inline-flex: Inline flex container
// - items-center justify-center: Center alignment
// - gap-3: 0.75rem (12px) spacing between icon and text
// - px-10 py-5: 2.5rem × 1.25rem (40px × 20px) padding
// - bg-gradient-to-r: Horizontal gradient
// - from-amber-600 to-amber-500: Gradient colors
// - hover:from-amber-500 hover:to-amber-400: Lighter on hover
// - glow-border: Golden border glow
// - text-slate-900: Dark text (high contrast)
// - font-bold text-lg: 700 weight, 18px size
// - rounded-lg: 8px border radius
// - transition-all duration-300: 300ms smooth transitions
// - shadow-lg: Large shadow
// - hover:shadow-xl: Extra large shadow on hover
// - hover:shadow-amber-500/30: Colored shadow on hover
// - hover:-translate-y-1: Moves up 4px on hover (lift effect)
```

### 12.2 Secondary Button
```tsx
<button
  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
>
  <Icon className="h-4 w-4" />
  {label}
</button>

// Calculation Breakdown:
// - px-6 py-3: 1.5rem × 0.75rem (24px × 12px) padding
// - Same gradient as primary but smaller
// - text-white: White text (instead of slate-900)
// - font-medium: 500 weight (lighter than primary)
// - hover:-translate-y-0.5: Moves up 2px on hover (subtle lift)
// - gap-2: 0.5rem (8px) spacing for icon
```

### 12.3 Danger Button (Cancel)
```tsx
<button
  className="px-6 py-3 bg-rose-500/20 text-rose-300 rounded-lg hover:bg-rose-500/30 border border-rose-400/30 transition-all disabled:opacity-50 flex items-center gap-2"
>
  <Icon className="h-4 w-4" />
  {label}
</button>

// Calculation Breakdown:
// - px-6 py-3: Standard button padding
// - bg-rose-500/20: Rose background at 20% opacity
// - text-rose-300: Rose text color
// - hover:bg-rose-500/30: Darker on hover (30% opacity)
// - border border-rose-400/30: Rose border at 30% opacity
// - Used for: Destructive actions (cancel, delete)
```

---

## 13. Table Design Pattern

### 13.1 Table Container
```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    {/* Table Content */}
  </table>
</div>

// Calculation Breakdown:
// - overflow-x-auto: Horizontal scroll on mobile
// - w-full: 100% width
// - Purpose: Responsive table that scrolls on small screens
```

### 13.2 Table Header
```tsx
<thead>
  <tr className="border-b border-slate-700/50 bg-slate-800/50">
    <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300 uppercase tracking-wide">
      Column Name
    </th>
  </tr>
</thead>

// Calculation Breakdown:
// - border-b border-slate-700/50: Bottom border at 50% opacity
// - bg-slate-800/50: Header background at 50% opacity
// - py-4 px-6: 1rem × 1.5rem (16px × 24px) padding
// - text-sm: 14px font size
// - font-semibold: 600 weight
// - text-slate-300: Light gray text
// - uppercase tracking-wide: All caps with wide letter spacing
```

### 13.3 Table Row
```tsx
<motion.tr
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05 }}
  className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
>
  <td className="py-4 px-6">
    {/* Cell Content */}
  </td>
</motion.tr>

// Calculation Breakdown:
// - border-b border-slate-700/30: Bottom border at 30% opacity
// - hover:bg-slate-700/20: Background on hover at 20% opacity
// - transition-colors: Smooth color transitions
// - py-4 px-6: Same padding as header
// - Animation: Staggered entrance with 50ms delay per row
```

---

## 14. Empty State Pattern

### 14.1 Empty State Container
```tsx
<div className="text-center py-16 px-6">
  <div className="p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
    <Icon className="h-10 w-10 text-slate-500" />
  </div>
  <h4 className="text-xl font-semibold text-white mb-2">No items yet</h4>
  <p className="text-slate-400 mb-6">Description text</p>
  <button className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all inline-flex items-center gap-2">
    Action Button
    <ArrowRight className="w-4 h-4" />
  </button>
</div>

// Calculation Breakdown:
// - py-16 px-6: 4rem × 1.5rem (64px × 24px) padding
// - Icon container: p-4 (16px) padding, w-20 h-20 (80px) size
// - Icon: h-10 w-10 (40px) size
// - Heading: text-xl (20px), font-semibold (600 weight)
// - Description: text-slate-400, mb-6 (24px) margin
// - Button: Standard secondary button style
```

---

## 15. Responsive Breakpoint System

### 15.1 Standard Breakpoints
```tsx
// Tailwind Default Breakpoints:
sm:  640px   // Small devices (tablets)
md:  768px   // Medium devices (small laptops)
lg:  1024px  // Large devices (desktops)
xl:  1280px  // Extra large devices
2xl: 1536px  // 2X large devices

// Usage Pattern:
className="base-class sm:responsive-class lg:desktop-class"

// Example:
className="text-2xl sm:text-3xl lg:text-4xl"
// Mobile: 24px → Tablet: 30px → Desktop: 36px
```

### 15.2 Common Responsive Patterns
```tsx
// Padding
className="p-6 sm:p-8 lg:p-12"
// Mobile: 24px → Tablet: 32px → Desktop: 48px

// Grid Columns
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
// Mobile: 1 col → Tablet: 2 cols → Desktop: 4 cols

// Text Size
className="text-base sm:text-lg lg:text-xl"
// Mobile: 16px → Tablet: 18px → Desktop: 20px

// Spacing
className="gap-4 sm:gap-6 lg:gap-8"
// Mobile: 16px → Tablet: 24px → Desktop: 32px
```

---

## 16. Currency Formatting Function

### 16.1 Format Currency
```tsx
const formatCurrency = (amountInPaise: number) => {
  return `₹${(amountInPaise / 100).toLocaleString('en-IN')}`;
};

// Calculation Breakdown:
// - Input: Amount in paise (smallest currency unit)
// - Conversion: amountInPaise / 100 = rupees
// - Formatting: toLocaleString('en-IN') = Indian number format
// - Output: "₹4,999" (with comma separators)
// - Example: 499900 paise → ₹4,999
```

### 16.2 Format Date
```tsx
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Calculation Breakdown:
// - Input: ISO date string (e.g., "2024-01-15T00:00:00Z")
// - Conversion: new Date(dateString)
// - Formatting: toLocaleDateString('en-IN', options)
// - Output: "15 Jan 2024" (Indian date format)
```

---

## 17. Loading State Pattern

### 17.1 Loading Spinner
```tsx
<div className="flex items-center justify-center min-h-[400px]">
  <div className="text-center">
    <Loader2 className="h-12 w-12 animate-spin text-amber-300 mx-auto mb-4" />
    <p className="text-slate-400">Loading billing information...</p>
  </div>
</div>

// Calculation Breakdown:
// - min-h-[400px]: Minimum height 400px (prevents layout shift)
// - flex items-center justify-center: Center alignment
// - Loader2: h-12 w-12 (48px) spinner icon
// - animate-spin: Continuous rotation animation
// - text-amber-300: Golden spinner color
// - mx-auto mb-4: Center horizontally, 16px margin bottom
// - Text: text-slate-400 for secondary text
```

---

## 18. Error Alert Pattern

### 18.1 Error Alert Container
```tsx
<AnimatePresence>
  {error && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-100 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p>{error}</p>
      </div>
      <button
        onClick={() => setError('')}
        className="text-rose-300 hover:text-rose-100 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )}
</AnimatePresence>

// Calculation Breakdown:
// - p-4: 1rem (16px) padding
// - bg-rose-500/20: Rose background at 20% opacity
// - border border-rose-400/50: Rose border at 50% opacity
// - text-rose-100: Light rose text color
// - flex items-center justify-between: Space-between layout
// - gap-4: 1rem (16px) spacing
// - Icon: h-5 w-5 (20px) alert icon
// - Close button: h-4 w-4 (16px) close icon
// - Animation: Slide down on show, slide up on hide
```

---

## 19. Info Notice Pattern

### 19.1 Info Notice Container
```tsx
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  className="p-4 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-100 flex items-start gap-3"
>
  <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
  <div className="flex-1">
    <p className="font-medium mb-1">Title</p>
    <p className="text-sm text-amber-200/80">Description</p>
  </div>
</motion.div>

// Calculation Breakdown:
// - p-4: 1rem (16px) padding
// - bg-amber-500/20: Amber background at 20% opacity
// - border border-amber-400/50: Amber border at 50% opacity
// - text-amber-100: Light amber text
// - flex items-start: Top-aligned flex layout
// - gap-3: 0.75rem (12px) spacing
// - Icon: h-5 w-5 (20px), mt-0.5 (2px) top margin for alignment
// - Title: font-medium (500 weight), mb-1 (4px) margin
// - Description: text-sm (14px), text-amber-200/80 (80% opacity)
```

---

## 20. Complete Component Structure Template

### 20.1 Full Feature Page Template
```tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon1, Icon2, Icon3 } from 'lucide-react';

export default function FeaturePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data fetching logic here

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-300 mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-100 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-rose-300 hover:text-rose-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-amber-300/20 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Icon1 },
          { id: 'details', label: 'Details', icon: Icon2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-amber-300 border-b-2 border-amber-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Content here */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 21. Key Design Principles

### 21.1 Opacity Hierarchy
```
100% (full): Primary text, icons, important elements
95%: Main container backgrounds
50%: Borders, dividers, secondary backgrounds
30%: Hover states, interactive elements
25%: Glow borders, subtle accents
20%: Overlays, background tints
```

### 21.2 Spacing Scale
```
2px  (0.5rem): Tight spacing, icon margins
4px  (1rem):   Standard spacing, small gaps
8px  (0.5rem): Button padding, small margins
12px (0.75rem): Medium spacing, icon containers
16px (1rem):   Standard padding, gaps
24px (1.5rem): Card padding, section spacing
32px (2rem):   Large padding, section margins
48px (3rem):   Extra large padding, hero sections
```

### 21.3 Color Contrast Ratios
```
White on slate-800: 12.6:1 (AAA compliant)
Amber-300 on slate-800: 4.5:1 (AA compliant)
Slate-400 on slate-800: 3.2:1 (AA for large text)
Slate-300 on slate-800: 4.8:1 (AA compliant)
```

### 21.4 Animation Timing
```
Fast: 150ms (hover states, quick feedback)
Normal: 300ms (standard transitions)
Slow: 500ms (page transitions, complex animations)
Stagger: 30-50ms per item (list animations)
```

---

## 22. Reusable Utility Functions

### 22.1 Format Currency
```tsx
export const formatCurrency = (amountInPaise: number): string => {
  return `₹${(amountInPaise / 100).toLocaleString('en-IN')}`;
};
```

### 22.2 Format Date
```tsx
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};
```

### 22.3 Format Percentage
```tsx
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(0)}%`;
};
```

### 22.4 Format Number
```tsx
export const formatNumber = (value: number): string => {
  return value.toLocaleString('en-IN');
};
```

---

## 23. CSS Custom Properties (Global)

### 23.1 Add to Global CSS
```css
/* Glow Border Effect */
.glow-border {
  border: 1px solid rgba(251, 191, 36, 0.25);
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.1);
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(251, 191, 36, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(251, 191, 36, 0.7);
}
```

---

## 24. Summary: Quick Reference

### 24.1 Color Palette
- **Primary Background**: `bg-slate-800/95` or `bg-slate-900/95`
- **Accent Gradient**: `bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20`
- **Primary Text**: `text-white`
- **Secondary Text**: `text-slate-300`
- **Tertiary Text**: `text-slate-400`
- **Accent Text**: `text-amber-300`
- **Success**: `bg-emerald-500/20 text-emerald-300`
- **Error**: `bg-rose-500/20 text-rose-300`
- **Warning**: `bg-amber-500/20 text-amber-300`

### 24.2 Spacing Scale
- **Tight**: `gap-2` (8px), `p-2` (8px)
- **Standard**: `gap-4` (16px), `p-4` (16px), `p-6` (24px)
- **Large**: `gap-6` (24px), `p-8` (32px), `p-12` (48px)

### 24.3 Border Radius
- **Small**: `rounded-lg` (8px)
- **Medium**: `rounded-xl` (12px)
- **Full**: `rounded-full` (pills, badges)

### 24.4 Typography
- **Large Title**: `text-3xl sm:text-4xl font-bold`
- **Section Title**: `text-2xl sm:text-3xl font-bold`
- **Body**: `text-base` or `text-sm`
- **Label**: `text-xs uppercase tracking-wide`

### 24.5 Animation Pattern
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}
transition={{ delay: index * 0.05 }}
```

---

## 25. Implementation Checklist

When building a new feature using this design system:

- [ ] Use `bg-slate-800/95` or `bg-slate-900/95` for main containers
- [ ] Apply `glow-border` class to cards and important elements
- [ ] Use `space-y-6` for main container spacing
- [ ] Implement responsive padding: `p-6 sm:p-8`
- [ ] Use `text-amber-300` for accent text
- [ ] Apply Framer Motion animations with `AnimatePresence`
- [ ] Use tab navigation pattern for multiple sections
- [ ] Implement loading states with spinner
- [ ] Add error alerts with dismiss functionality
- [ ] Use status badges with opacity backgrounds
- [ ] Apply hover effects: `hover:-translate-y-1` for buttons
- [ ] Use `rounded-lg` for standard elements, `rounded-xl` for large cards
- [ ] Implement responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- [ ] Use `gap-4` for grid spacing
- [ ] Apply consistent button padding: `px-6 py-3` or `px-8 py-4`
- [ ] Use gradient backgrounds for headers: `bg-gradient-to-r from-amber-500/20...`

---

**End of Document**

This design system provides all the calculations, patterns, and code structures needed to build consistent, professional features matching the billing page design. Use these patterns as building blocks for any new feature implementation.

