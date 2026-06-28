# 🚀 Quick Reference: Mobile Alignment System

## ⚡ **TL;DR - How It Works**

1. **One CSS file** (`mobile-premium-design-system.css`) is imported in `layout.tsx`
2. **All pages** automatically inherit these styles
3. **Media queries** adjust padding/spacing based on screen width
4. **Class-based** system - use classes like `.mobile-container`, `.mobile-card`

---

## 📏 **Padding Values by Screen Size**

| Width | Device | Side Padding | Top/Bottom |
|-------|--------|--------------|------------|
| 320-374px | iPhone SE | **12px** | 12px / 16px |
| 375-479px | iPhone 11 | **12px** | 12px / 16px |
| 480-639px | Large Android | **16px** | 16px / 24px |
| 640-767px | Tablet | **24px** | 24px / 32px |
| 768px+ | Desktop | Desktop styles | Normal |

---

## 🎯 **Where Alignment Happens**

### **1. Root Level (ALL Pages)**
```tsx
// app/app/layout.tsx
import './mobile-premium-design-system.css'  // ← Applied globally
```

### **2. Page Level (Using PageWrapper)**
```tsx
<PageWrapper>  {/* ← Adds .mobile-container class */}
  {/* Content automatically aligned */}
</PageWrapper>
```

### **3. Component Level**
```tsx
<div className="mobile-card">  {/* ← Uses mobile styles */}
<div className="mobile-grid">  {/* ← Responsive grid */}
```

---

## 🔍 **CSS Rules That Apply Everywhere**

```css
/* ALL containers get mobile padding */
@media (max-width: 1023px) {
  .container,
  [class*="container"] {
    padding-left: max(12px, env(safe-area-inset-left)) !important;
    padding-right: max(12px, env(safe-area-inset-right)) !important;
  }
}

/* ALL main elements get bottom padding for nav */
@media (max-width: 767px) {
  main {
    padding-bottom: calc(80px + var(--safe-bottom)) !important;
  }
}

/* ALL grids stack on mobile */
@media (max-width: 639px) {
  .grid-cols-2, .grid-cols-3, .grid-cols-4 {
    grid-template-columns: 1fr !important;
  }
}
```

---

## ✅ **How to Check It's Working**

1. Open any page (homepage, pricing, property listing, etc.)
2. Open DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone 11 (375px width)
4. Inspect any content element
5. You'll see padding: `12px` on sides automatically

---

## 📝 **Files Involved**

- **`app/app/mobile-premium-design-system.css`** - Main mobile design system
- **`app/app/layout.tsx`** - Imports the CSS (applies to all pages)
- **`app/components/ui/PageWrapper.tsx`** - Adds `.mobile-container` class
- **`app/components/MobileBottomNav.tsx`** - Uses mobile classes
- **`app/components/mobile/MobilePropertyCard.tsx`** - Uses mobile classes

---

## 🎨 **Classes You Can Use**

```tsx
<div className="mobile-container">      {/* Optimal padding */}
<div className="mobile-card">           {/* Card with mobile styles */}
<div className="mobile-grid">           {/* Responsive grid */}
<div className="mobile-header">         {/* Mobile header */}
<div className="mobile-button">         {/* Touch-optimized button */}
<div className="mobile-input">          {/* Mobile form input */}
```

---

**That's it!** The system works automatically. Just use `PageWrapper` or add `.mobile-container` to your page content, and alignment is handled for all screen sizes! 🎉

