# Admin Dashboard UI/UX Design System - Complete Documentation

## Overview
This document provides a comprehensive guide to the UI and UX design system used in the Admin Dashboard (`/admin/*`). Use this as a reference when creating new admin pages or applying the same design patterns to other sections of the application.

---

## 1. **Color Palette**

### Primary Colors
- **Background Dark**: `bg-slate-950` (main page background)
- **Container Background**: `bg-slate-800/95` or `bg-slate-900/95` (cards, containers)
- **Secondary Background**: `bg-slate-700/50` (icon backgrounds, table headers)
- **Border Accent**: `border-amber-300` (primary border color, always `border-2`)

### Text Colors
- **Primary Text**: `text-white` (headings, main content, values)
- **Secondary Text**: `text-slate-200` (descriptions, body text)
- **Tertiary Text**: `text-slate-300` (table headers, labels)
- **Quaternary Text**: `text-slate-400` (subtle labels, metadata, inactive states)
- **Accent Text**: `text-amber-300` (active states, highlights)

### Status Colors
- **Success/Verified**: `bg-green-500/20 text-green-300` or `bg-green-600 hover:bg-green-700`
- **Warning/Pending**: `bg-amber-500/20 text-amber-300` or `bg-amber-500 hover:bg-amber-600`
- **Error/Rejected**: `bg-red-500/20 text-red-300` or `bg-red-600 hover:bg-red-700`
- **Info/Neutral**: `bg-blue-600 hover:bg-blue-700` or `bg-slate-700/50`

### Chart Colors
- **Primary Line**: `var(--primary-600)` or `#3b82f6`
- **Success Line**: `var(--emerald-500)` or `#10b981`
- **Gold Line**: `var(--gold-500)` or `#eab308`
- **Pie Chart Colors**: `['#eab308', '#f59e0b', '#3b82f6', '#6b7280', '#d1d5db']`

---

## 2. **Typography**

### Headings
```tsx
// Page Title
<h1 className="text-3xl font-bold text-white mb-2">Page Title</h1>
<p className="text-slate-300">Subtitle or description</p>

// Section Headers
<div className="text-gray-200 font-semibold">Section Title</div>
// or
<div className="text-white font-semibold">Section Title</div>

// Card Titles
<div className="text-sm text-gray-400">Card Label</div>
<div className="text-3xl font-semibold text-gray-100 tabular-nums">Value</div>
```

### Body Text
```tsx
// Primary content
<div className="text-white">Main content</div>

// Secondary content
<div className="text-slate-200">Description text</div>

// Labels
<div className="text-xs font-bold text-slate-400 uppercase mb-1">Label</div>
<div className="text-sm text-gray-300">Table header</div>
```

### Text Utilities
- **Uppercase Labels**: `text-xs font-bold text-slate-400 uppercase`
- **Tabular Numbers**: `tabular-nums` (for consistent number alignment)
- **Font Weights**: `font-bold`, `font-semibold` (for emphasis)

---

## 3. **Layout Structure**

### Page Container
```tsx
<div className="space-y-8">
  {/* Header */}
  <div className="mb-6">
    <h1 className="text-3xl font-bold text-white mb-2">Page Title</h1>
    <p className="text-slate-300">Description</p>
  </div>

  {/* Content */}
  {/* ... */}
</div>
```

### Grid Layouts
```tsx
// Stats Grid (4 columns)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Stat cards */}
</div>

// Stats Grid (6 columns)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
  {/* Stat cards */}
</div>

// Two Column Layout
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Cards */}
</div>

// Full Width Card
<div className="lg:col-span-2">
  {/* Card spanning 2 columns */}
</div>
```

### Spacing
- **Page Spacing**: `space-y-8` (between major sections)
- **Card Spacing**: `gap-4` or `gap-6` (between cards in grid)
- **Internal Padding**: `p-4`, `p-6` (card internal padding)
- **Section Margin**: `mb-6` (below headers)

---

## 4. **Card Components**

### Standard Card
```tsx
<Card className="bg-gray-900 border-gray-800">
  {/* Content */}
</Card>
```

### Stat Card
```tsx
<div className="bg-slate-800/95 border-2 border-amber-300 rounded-lg p-4">
  <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Label</h3>
  <div className="text-2xl font-bold text-white">{value}</div>
</div>
```

### Metric Card (with sparkline)
```tsx
<Card className="bg-gray-900 border-gray-800">
  <div className="text-sm text-gray-400">{title}</div>
  <div className="mt-1 flex items-baseline gap-2">
    <div className="text-3xl font-semibold text-gray-100 tabular-nums">{value}</div>
    {sub && <div className="text-xs text-gray-400">{sub}</div>}
  </div>
  {children && <div className="mt-2">{children}</div>}
</Card>
```

### Card with Chart
```tsx
<Card className="bg-gray-900 border-gray-800">
  <div className="mb-2 text-gray-200 font-semibold">Chart Title</div>
  {/* Chart content */}
</Card>
```

---

## 5. **Navigation**

### Admin Navigation Bar
```tsx
<nav className="bg-slate-900/95 border-b-2 border-amber-300 mb-6">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex gap-1 overflow-x-auto">
      {navItems.map((item) => (
        <Link
          href={item.href}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap border-b-2 ${
            isActive
              ? 'text-amber-300 border-amber-300'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          <Icon className="w-4 h-4" />
          {item.label}
        </Link>
      ))}
    </div>
  </div>
</nav>
```

### Tab Navigation
```tsx
<div className="flex gap-2 border-b-2 border-amber-300 overflow-x-auto">
  {tabs.map((tab) => (
    <button
      className={`px-5 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
        activeTab === tab
          ? 'text-amber-300 border-b-amber-300'
          : 'text-slate-400 border-b-transparent hover:text-slate-200'
      }`}
    >
      {tab.label}
      <span className={`px-2 py-1 rounded-full text-xs ${
        activeTab === tab 
          ? 'bg-amber-300 text-slate-900' 
          : 'bg-slate-700/50 text-slate-400'
      }`}>
        {count}
      </span>
    </button>
  ))}
</div>
```

---

## 6. **Buttons**

### Primary Button (Amber)
```tsx
<Button 
  className="bg-amber-500 hover:bg-amber-600 border-2 border-amber-300 text-slate-900"
>
  Primary Action
</Button>
```

### Secondary Button
```tsx
<Button
  variant="secondary"
  className="border-2 border-amber-300 bg-slate-800/95 text-slate-200 hover:bg-slate-700/50"
>
  Secondary Action
</Button>
```

### Action Buttons (Small)
```tsx
// View Button
<button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors border-2 border-blue-500">
  View
</button>

// Verify Button
<button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-colors border-2 border-green-500">
  Verify
</button>

// Reject Button
<button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors border-2 border-red-500">
  Reject
</button>
```

### Pagination Buttons
```tsx
// Previous/Next
<button
  className="px-3 py-1 border-2 border-amber-300 bg-slate-800/95 text-slate-200 rounded text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700/50"
  disabled={isDisabled}
>
  ← Previous
</button>

// Page Number
<button
  className={`px-3 py-1 border-2 rounded text-sm font-semibold ${
    isActive
      ? 'bg-amber-300 text-slate-900 border-amber-300'
      : 'border-amber-300 bg-slate-800/95 text-slate-200 hover:bg-slate-700/50'
  }`}
>
  {pageNum}
</button>
```

---

## 7. **Form Elements**

### Input Fields
```tsx
<input
  type="text"
  className="flex-1 min-w-[250px] px-4 py-2 bg-slate-800/95 border-2 border-amber-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
  placeholder="Search..."
/>
```

### Select Dropdowns
```tsx
<Select 
  value={value} 
  onChange={(e) => setValue(e.target.value)} 
  className="w-[160px] bg-slate-800/95 text-white border-2 border-amber-300"
>
  <option value="option1">Option 1</option>
</Select>
```

### Textarea
```tsx
<textarea
  className="w-full px-4 py-3 bg-slate-700/50 border-2 border-amber-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 min-h-[120px] resize-y"
  placeholder="Enter text..."
/>
```

---

## 8. **Tables**

### Table Container
```tsx
<div className="bg-slate-800/95 border-2 border-amber-300 rounded-lg overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      {/* Table content */}
    </table>
  </div>
</div>
```

### Table Header
```tsx
<thead className="bg-slate-700/50">
  <tr>
    <th className="px-3 py-3 text-left text-slate-300 font-bold">Column Name</th>
  </tr>
</thead>
```

### Table Body
```tsx
<tbody className="divide-y divide-slate-700/50">
  <tr className="hover:bg-slate-700/30">
    <td className="px-3 py-3 text-white font-semibold">Data</td>
    <td className="px-3 py-3 text-slate-200">Data</td>
  </tr>
</tbody>
```

### Status Badges in Tables
```tsx
<span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
  status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
  status === 'verified' ? 'bg-green-500/20 text-green-300' :
  'bg-red-500/20 text-red-300'
}`}>
  {status}
</span>
```

---

## 9. **Modals**

### Modal Overlay
```tsx
<div 
  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  onClick={() => closeModal()}
>
  {/* Modal content */}
</div>
```

### Modal Container
```tsx
<div 
  className="bg-slate-800/95 border-2 border-amber-300 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
  onClick={(e) => e.stopPropagation()}
>
  {/* Modal header */}
  <div className="flex justify-between items-center p-6 border-b-2 border-amber-300">
    <h2 className="text-2xl font-bold text-white">Modal Title</h2>
    <button
      onClick={() => closeModal()}
      className="text-slate-400 hover:text-slate-200 text-3xl leading-none"
    >
      ×
    </button>
  </div>

  {/* Modal body */}
  <div className="p-6 space-y-4">
    {/* Content */}
  </div>
</div>
```

### Modal Form Fields
```tsx
<div className="mb-4">
  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
    Field Label *
  </label>
  <input
    type="text"
    className="w-full px-4 py-3 bg-slate-700/50 border-2 border-amber-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
  />
</div>
```

---

## 10. **Loading States**

### Page Loading
```tsx
<div className="flex items-center justify-center h-96">
  <div className="text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto mb-4"></div>
    <p className="text-slate-400">Loading...</p>
  </div>
</div>
```

### Skeleton Loading (Cards)
```tsx
<div className="h-64 rounded-md bg-gray-800/60 animate-pulse" />
```

### Skeleton Loading (Tables)
```tsx
<div className="h-48 bg-gray-800/60 animate-pulse" />
```

---

## 11. **Empty States**

### Empty Table
```tsx
<div className="text-center py-12 text-slate-400">
  <p>No items found.</p>
</div>
```

### Empty Data in Table
```tsx
<tr>
  <td className="px-3 py-4" colSpan={columnCount}>
    No data.
  </td>
</tr>
```

---

## 12. **Toast Notifications**

### Toast Container
```tsx
{toast && (
  <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg z-50 ${
    toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
  } text-white font-semibold animate-slide-in`}>
    {toast.message}
  </div>
)}
```

---

## 13. **Charts & Data Visualization**

### Chart Container
```tsx
<Card className="bg-gray-900 border-gray-800">
  <div className="mb-2 text-gray-200 font-semibold">Chart Title</div>
  {isLoading ? (
    <div className="h-64 rounded-md bg-gray-800/60 animate-pulse" />
  ) : (
    <div className="h-64">
      {/* Chart component */}
    </div>
  )}
</Card>
```

### Chart Styling (Recharts)
```tsx
// Grid
<CartesianGrid stroke="#222" />

// Axes
<XAxis 
  dataKey="date" 
  stroke="#aaa" 
  tick={{ fill: '#aaa', fontSize: 12 }} 
/>
<YAxis 
  stroke="#aaa" 
  tick={{ fill: '#aaa', fontSize: 12 }} 
/>

// Tooltip
<Tooltip 
  contentStyle={{ 
    background: '#0b0b0b', 
    border: '1px solid #222', 
    color: '#eee' 
  }} 
/>

// Lines
<Line 
  dataKey="value" 
  stroke="var(--primary-600)" 
  dot={false} 
  strokeWidth={2} 
/>
```

---

## 14. **Search & Filters**

### Search Bar
```tsx
<div className="flex gap-3 flex-wrap">
  <input
    type="text"
    className="flex-1 min-w-[250px] px-4 py-2 bg-slate-800/95 border-2 border-amber-300 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
    placeholder="🔍 Search..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
  <button
    onClick={exportData}
    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors border-2 border-amber-300"
  >
    📥 Export CSV
  </button>
</div>
```

---

## 15. **Pagination**

### Pagination Container
```tsx
<div className="flex justify-between items-center px-4 py-4 border-t-2 border-amber-300">
  <div className="text-sm text-slate-300">
    Showing {startIdx + 1}-{Math.min(endIdx, total)} of {total} items
  </div>
  <div className="flex gap-2">
    {/* Previous, page numbers, Next buttons */}
  </div>
</div>
```

---

## 16. **Layout Wrapper**

### Admin Layout Structure
```tsx
<div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
  <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8" 
        style={{ 
          paddingLeft: 'max(16px, env(safe-area-inset-left))', 
          paddingRight: 'max(16px, env(safe-area-inset-right))' 
        }}>
    <AdminNav />
    {children}
  </main>
</div>
```

---

## 17. **Design Principles**

### Visual Hierarchy
1. **Primary Actions**: Amber buttons (`bg-amber-500`)
2. **Secondary Actions**: Slate buttons with amber borders
3. **Destructive Actions**: Red buttons (`bg-red-600`)
4. **Information**: Blue buttons (`bg-blue-600`)

### Consistency Rules
- **All borders**: Use `border-2 border-amber-300` (never `border` or `border-1`)
- **All containers**: Use `bg-slate-800/95` or `bg-slate-900/95` (never fully opaque)
- **All text**: Use solid colors (never `text-white/70` or transparency)
- **All spacing**: Use consistent `gap-4` or `gap-6` in grids
- **All rounded corners**: Use `rounded-lg` (consistent radius)

### Accessibility
- **Focus states**: `focus:outline-none focus:border-amber-400`
- **Disabled states**: `disabled:opacity-40 disabled:cursor-not-allowed`
- **Hover states**: Always provide visual feedback
- **Color contrast**: Ensure WCAG AA compliance (white on dark backgrounds)

---

## 18. **Component Patterns**

### Stats Grid Pattern
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {stats.map((stat) => (
    <div className="bg-slate-800/95 border-2 border-amber-300 rounded-lg p-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
        {stat.label}
      </h3>
      <div className="text-2xl font-bold text-white">{stat.value}</div>
    </div>
  ))}
</div>
```

### Data Table Pattern
```tsx
<div className="bg-slate-800/95 border-2 border-amber-300 rounded-lg overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead className="bg-slate-700/50">
        {/* Headers */}
      </thead>
      <tbody className="divide-y divide-slate-700/50">
        {/* Rows */}
      </tbody>
    </table>
  </div>
  {/* Pagination */}
</div>
```

### Modal Pattern
```tsx
{isOpen && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-slate-800/95 border-2 border-amber-300 rounded-lg max-w-2xl w-full">
      {/* Header */}
      {/* Body */}
      {/* Footer with actions */}
    </div>
  </div>
)}
```

---

## 19. **Responsive Design**

### Breakpoints
- **Mobile**: Default (no prefix)
- **Small**: `sm:` (640px+)
- **Large**: `lg:` (1024px+)

### Responsive Patterns
```tsx
// Grid that stacks on mobile
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Navigation that scrolls horizontally on mobile
<div className="flex gap-1 overflow-x-auto">

// Padding that adjusts
<div className="px-4 sm:px-6 lg:px-8">
```

---

## 20. **Animation & Transitions**

### Hover Effects
```tsx
// Button hover
className="hover:bg-amber-600 transition-colors"

// Row hover
className="hover:bg-slate-700/30"

// Card hover (subtle lift)
className="hover:-translate-y-1 transition-transform"
```

### Loading Animations
```tsx
// Spinner
className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300"

// Pulse (skeleton)
className="animate-pulse"
```

---

## 21. **Icon Usage**

### Icon Sizing
- **Navigation Icons**: `w-4 h-4`
- **Button Icons**: `w-4 h-4` or `w-5 h-5`
- **Card Icons**: `w-6 h-6` or `w-8 h-8`

### Icon Colors
- **Active**: `text-amber-300`
- **Inactive**: `text-slate-400`
- **Hover**: `hover:text-slate-200`

---

## 22. **Common Utilities**

### Text Formatting
```tsx
// Currency (INR)
const fmtINR = (value: number) => 
  new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(value);

// Percentage
const fmtPct = (value: number) => 
  `${value > 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;

// Date
new Date(dateString).toLocaleDateString()
new Date(dateString).toLocaleString()
```

---

## 23. **Complete Example: Admin Page Template**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AdminExamplePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login?next=/admin/example');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        router.push('/unauthorized');
        return;
      }

      setLoading(false);
      loadData();
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  const loadData = async () => {
    // Fetch data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Page Title</h1>
        <p className="text-slate-300">Page description</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button 
          className="bg-amber-500 hover:bg-amber-600 border-2 border-amber-300 text-slate-900"
        >
          Primary Action
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <div className="text-gray-200 font-semibold mb-2">Card Title</div>
          {/* Card content */}
        </Card>
      </div>
    </div>
  );
}
```

---

## 24. **Quick Reference Checklist**

When creating a new admin page, ensure:

- ✅ Background: `bg-slate-950` (page), `bg-slate-800/95` (containers)
- ✅ Borders: `border-2 border-amber-300` (all containers)
- ✅ Text: `text-white` (primary), `text-slate-200` (secondary), `text-slate-400` (labels)
- ✅ Buttons: Amber for primary, slate with amber border for secondary
- ✅ Tables: `bg-slate-700/50` headers, `divide-slate-700/50` rows
- ✅ Modals: `bg-black/60 backdrop-blur-sm` overlay, `bg-slate-800/95 border-2 border-amber-300` container
- ✅ Loading: Spinner with `border-amber-300`, skeleton with `bg-gray-800/60 animate-pulse`
- ✅ Spacing: `space-y-8` (page), `gap-4` or `gap-6` (grids)
- ✅ Responsive: Grid with `grid-cols-1 sm:grid-cols-2 lg:grid-cols-*`
- ✅ Auth check: Verify admin role before rendering content

---

## Summary

The Admin Dashboard design system emphasizes:
- **Consistency**: Uniform colors, borders, and spacing throughout
- **Clarity**: Solid text colors, clear hierarchy, readable typography
- **Professionalism**: Dark theme with amber accents, clean layouts
- **Usability**: Clear actions, proper loading states, accessible interactions
- **Responsiveness**: Mobile-first approach with breakpoint-based layouts

Use this document as a reference when building new admin pages or applying these patterns to other sections of the application.
































