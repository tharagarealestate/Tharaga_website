# 🎨 Mobile CSS Rules - Visual Reference

## 🔍 **Actual CSS Rules That Apply to Each Screen Size**

### **Rule 1: Mobile Container (Applied via PageWrapper)**

```css
.mobile-container {
  /* Base - All sizes */
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  
  /* Padding uses clamp() - automatically adjusts */
  padding-left: max(12px, env(safe-area-inset-left));
  padding-right: max(12px, env(safe-area-inset-right));
  padding-top: max(12px, env(safe-area-inset-top));
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}
```

**Applied to**: Homepage, Pricing, Property Listing, Dashboard pages

---

### **Rule 2: All Containers (Global Override)**

```css
@media (max-width: 1023px) {
  .container,
  [class*="container"] {
    padding-left: max(12px, env(safe-area-inset-left)) !important;
    padding-right: max(12px, env(safe-area-inset-right)) !important;
  }
}
```

**Applied to**: Builder dashboard, Admin panel, Any page with `.container` class

---

### **Rule 3: Main Content (Bottom Padding for Nav)**

```css
@media (max-width: 767px) {
  main[role="main"],
  main:not([role]) {
    padding-bottom: calc(80px + var(--safe-bottom)) !important;
  }
}
```

**Applied to**: ALL pages with `<main>` element

---

### **Rule 4: Grid Layouts (Auto-Stack on Mobile)**

```css
@media (max-width: 639px) {
  .grid-cols-2,
  [class*="grid-cols-2"],
  .grid-cols-3,
  [class*="grid-cols-3"],
  .grid-cols-4,
  [class*="grid-cols-4"] {
    grid-template-columns: 1fr !important;
  }
}
```

**Applied to**: Property grids, Feature sections, Dashboard cards

---

### **Rule 5: Forms (Stack Inputs on Mobile)**

```css
@media (max-width: 639px) {
  form .grid-cols-2,
  form [class*="grid-cols-2"] {
    grid-template-columns: 1fr !important;
  }
  
  form input,
  form select,
  form textarea {
    width: 100% !important;
    max-width: 100% !important;
  }
}
```

**Applied to**: All forms across the site

---

### **Rule 6: Property Cards (Mobile Optimized)**

```css
.mobile-card {
  border-radius: 20px;
  /* Base styles */
}

.mobile-card-image {
  aspect-ratio: 16 / 10;
  /* Optimal image sizing */
}
```

**Applied to**: Property listing pages

---

### **Rule 7: Typography (Fluid Sizing)**

```css
h1 { 
  font-size: clamp(22px, 6vw, 36px); 
}

p, body { 
  font-size: clamp(13px, 3.5vw, 16px); 
}
```

**Applied to**: ALL text across ALL pages

---

## 📱 **Screen Size Breakdown**

### **320px - 374px (iPhone SE)**
```css
/* Uses base .mobile-container */
padding-left: 12px;
padding-right: 12px;
/* Grids: 1 column */
/* Forms: Stacked */
/* Typography: Smallest sizes */
```

### **375px - 479px (iPhone 11/Android)**
```css
/* Uses base .mobile-container */
padding-left: 12px;
padding-right: 12px;
/* Grids: 1 column */
/* Forms: Stacked */
/* Typography: Medium-small sizes */
```

### **480px - 639px (Large Android)**
```css
/* Uses base .mobile-container with larger spacing */
padding-left: 16px;  /* Slightly more space */
padding-right: 16px;
/* Grids: 2 columns */
/* Forms: Can be side-by-side */
/* Typography: Medium sizes */
```

### **640px - 767px (Tablet)**
```css
/* Uses base .mobile-container with even more space */
padding-left: 24px;
padding-right: 24px;
/* Grids: 2 columns */
/* Forms: Side-by-side */
/* Typography: Larger sizes */
```

### **768px+ (Desktop)**
```css
/* Mobile styles hidden, desktop styles apply */
.mobile-bottom-nav { display: none; }
/* Normal desktop padding */
/* Full grid layouts */
```

---

## 🎯 **How Specific Pages Get Aligned**

### **Homepage (`/`)**
```tsx
<PageWrapper>  {/* Adds .mobile-container */}
  <main className="pt-20 sm:pt-32 pb-16">
    {/* Gets padding from .mobile-container */}
    {/* Content automatically aligned */}
  </main>
</PageWrapper>
```

**CSS Applied**:
- `.mobile-container` → 12px-24px padding based on width
- `main` → Bottom padding for nav on mobile

---

### **Property Listing (`/property-listing`)**
```tsx
<div className="property-listing">
  <div className="main-content">
    {/* Content */}
  </div>
</div>
```

**CSS Applied**:
```css
@media (max-width: 1023px) {
  .main-content {
    flex-direction: column !important;
    padding: 0 16px 24px !important;  /* Auto-aligned */
  }
}
```

---

### **Builder Dashboard (`/builder/*`)**
```tsx
<BuilderDashboardLayout>
  <div className={builderContentContainer}>
    {/* Content */}
  </div>
</BuilderDashboardLayout>
```

**CSS Applied**:
```css
@media (max-width: 1023px) {
  [class*="container"] {
    padding-left: max(12px, env(safe-area-inset-left)) !important;
    padding-right: max(12px, env(safe-area-inset-right)) !important;
  }
}
```

---

## 🔄 **CSS Cascade Flow**

```
Browser loads page
    ↓
layout.tsx loads mobile-premium-design-system.css
    ↓
CSS variables defined (--mobile-space-md, etc.)
    ↓
Media queries check viewport width
    ↓
    ├─ < 640px → Apply mobile styles
    ├─ 640-767px → Apply tablet styles
    └─ 768px+ → Hide mobile, show desktop
    ↓
Styles cascade to child elements
    ↓
All pages automatically aligned!
```

---

## ✅ **Verification Commands**

### **Check in Browser Console:**
```javascript
// Get current padding
const container = document.querySelector('.mobile-container');
console.log(getComputedStyle(container).paddingLeft);

// Check applied breakpoint
const width = window.innerWidth;
console.log(`Current width: ${width}px`);

// Check if mobile styles active
const isMobile = window.matchMedia('(max-width: 767px)').matches;
console.log(`Mobile mode: ${isMobile}`);
```

---

## 📊 **Summary Table**

| Element | Mobile (< 640px) | Tablet (640-767px) | Desktop (768px+) |
|---------|------------------|-------------------|------------------|
| Container Padding | 12px | 16-24px | Desktop styles |
| Grid Columns | 1 column | 2 columns | 3-4 columns |
| Forms | Stacked | Can be side-by-side | Side-by-side |
| Typography | Small | Medium | Large |
| Bottom Nav | Visible | Visible | Hidden |
| Sidebar | Hidden/Drawer | Hidden/Drawer | Visible |

---

**This is how ONE CSS file automatically aligns ALL pages!** 🎉

