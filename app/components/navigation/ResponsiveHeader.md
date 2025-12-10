# ResponsiveHeader Component Documentation

## Overview

A fully responsive, mobile-first navigation header component with advanced animations, accessibility features, and customizable styling. Built with Next.js, TypeScript, Framer Motion, and Tailwind CSS.

## Features

### Layout & Structure
- **Left Section (20% width)**: Logo & branding
- **Right Section (40% width)**: User utilities and hamburger menu
- **Responsive breakpoint**: 768px (mobile < 768px, desktop >= 768px)

### Mobile Features
- ✅ Full-screen hamburger menu
- ✅ Slides in from right (300-400ms ease-out)
- ✅ Semi-transparent backdrop overlay (70% opacity)
- ✅ Body scroll locking when menu is open
- ✅ Staggered item fade-in animations
- ✅ Expandable submenu sections
- ✅ User account icon (20-24px)
- ✅ Auto-close on route change
- ✅ Touch-friendly minimum sizes (44x44px)

### Animations & Micro-Interactions
- Opening: Menu slides from right, backdrop fades in, items stagger in (50ms delay each)
- Closing: Reverse animation with 250-300ms ease-in
- Hamburger icon: Gold default, rotates to X icon in blue circle when active
- Menu items: Hover highlight with slight scale (1.02x on desktop)
- Submenu chevron: Rotates 90 degrees on expand
- Active states: Brief highlight/flash before navigation

### Accessibility (WCAG AA Compliant)
- ✅ Semantic HTML (`header`, `nav`, `button`, `ul`, `li`)
- ✅ ARIA labels and roles (`role="banner"`, `aria-label`, `aria-expanded`, `aria-controls`)
- ✅ Keyboard navigation support
- ✅ Focus visible states with blue focus rings
- ✅ Color contrast ratios meet WCAG AA standards
- ✅ Minimum touch target sizes (44x44px)
- ✅ Screen reader friendly

### Typography
- **Logo**: Bold, 24-28px sans-serif
- **Nav items**: Regular weight, 14-16px
- **Subtle contrast** for readability

## Installation

Ensure you have the required dependencies:

```bash
npm install framer-motion lucide-react
```

## Usage

### Basic Example

```tsx
import ResponsiveHeader from '@/components/navigation/ResponsiveHeader'

export default function Page() {
  return (
    <ResponsiveHeader
      logoText="MyBrand"
      logoHref="/"
      navItems={[
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' }
      ]}
      onUserIconClick={() => console.log('User icon clicked')}
    />
  )
}
```

### Advanced Example with Submenus

```tsx
import ResponsiveHeader from '@/components/navigation/ResponsiveHeader'

const navItems = [
  { label: 'Home', href: '/' },
  {
    label: 'Products',
    href: '/products',
    subItems: [
      { label: 'Category A', href: '/products/category-a' },
      { label: 'Category B', href: '/products/category-b' },
      { label: 'Category C', href: '/products/category-c' }
    ]
  },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' }
]

export default function Page() {
  const handleUserClick = () => {
    // Open user profile modal or navigate to profile page
    console.log('Opening user profile...')
  }

  return (
    <ResponsiveHeader
      logoSrc="/images/logo.png"
      logoText="MyBrand"
      logoHref="/"
      navItems={navItems}
      onUserIconClick={handleUserClick}
      showUserIcon={true}
    />
  )
}
```

### With Custom Logo Image

```tsx
<ResponsiveHeader
  logoSrc="/assets/brand-logo.svg"
  logoText="Tharaga"
  logoHref="/"
  navItems={navItems}
/>
```

### Hide User Icon

```tsx
<ResponsiveHeader
  logoText="MyBrand"
  navItems={navItems}
  showUserIcon={false}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `logoSrc` | `string` (optional) | `undefined` | Path to logo image. If provided, displays image instead of text |
| `logoText` | `string` | `'Tharaga'` | Logo text to display (or alt text for logo image) |
| `logoHref` | `string` | `'/'` | Navigation link when logo is clicked |
| `navItems` | `NavItem[]` | `[]` | Array of navigation items |
| `onUserIconClick` | `() => void` (optional) | `undefined` | Callback when user icon is clicked |
| `showUserIcon` | `boolean` | `true` | Whether to show the user account icon |
| `className` | `string` | `''` | Additional CSS classes for the header element |

### NavItem Type

```typescript
interface NavItem {
  label: string           // Display text for the nav item
  href: string           // Link destination
  subItems?: {           // Optional nested submenu items
    label: string
    href: string
  }[]
}
```

## Styling & Customization

### Color Scheme
The component uses a dark theme with slate colors:
- **Background**: Gradient from `slate-900` → `slate-800` → `slate-900`
- **Border**: `slate-700/50`
- **Text**: `white` and `slate-200`
- **Accent**: `amber-500` (gold) for hamburger icon
- **Active**: `blue-600` for close button background
- **Hover**: `white/10` background overlay

### Custom Styling

You can customize the header by passing a `className` prop:

```tsx
<ResponsiveHeader
  logoText="MyBrand"
  navItems={navItems}
  className="bg-blue-900 border-blue-700"
/>
```

Or extend the component by wrapping it:

```tsx
<div className="shadow-xl">
  <ResponsiveHeader {...props} />
</div>
```

## Mobile Behavior

### Breakpoint: 768px

- **Below 768px (Mobile)**:
  - Desktop navigation items hidden
  - Hamburger menu icon visible (gold)
  - User icon visible (if `showUserIcon={true}`)
  - Full-screen menu on activation

- **Above 768px (Desktop)**:
  - Hamburger menu hidden
  - Desktop navigation visible in center
  - User icon visible on right side

### Menu Interactions

1. **Opening Menu**:
   - Click hamburger icon
   - Menu slides in from right (350ms)
   - Backdrop fades in (300ms, 70% opacity)
   - Body scroll locks
   - Items fade in with stagger (50ms delay each)

2. **Closing Menu**:
   - Click X icon
   - Click backdrop
   - Navigate to a page
   - Menu slides out to right (350ms)
   - Backdrop fades out

3. **Submenu Expansion**:
   - Click item with subItems
   - Submenu slides down (300ms)
   - Chevron rotates 90°
   - Sub-items fade in with stagger

## Accessibility Features

### Keyboard Navigation
- `Tab`: Navigate through focusable elements
- `Enter`/`Space`: Activate buttons and links
- `Esc`: Close mobile menu (can be added)

### Screen Readers
- All buttons have `aria-label` attributes
- Menu has `aria-expanded` and `aria-controls`
- Icons have `aria-hidden="true"`
- Semantic HTML structure

### Focus Management
- Blue focus rings on all interactive elements
- Focus offset for visibility on dark backgrounds
- Logical tab order

### Touch Targets
- Minimum 44x44px for all touchable elements
- Proper spacing between interactive elements

## Animation Details

### Timing Functions
- **Menu slide**: `easeOut` (350ms)
- **Backdrop fade**: Linear (300ms)
- **Icon rotation**: `duration: 0.2` (200ms)
- **Item stagger**: 50ms delay between each

### Motion Values
- **Menu translateX**: `100%` → `0` (open), `0` → `100%` (close)
- **Backdrop opacity**: `0` → `0.7` (open), `0.7` → `0` (close)
- **Icon rotate**: `-90° / 90°` (transition), `0°` (stable)
- **Chevron rotate**: `0°` → `90°` (expand)

### Framer Motion Variants

```typescript
// Menu slide-in
initial={{ x: '100%' }}
animate={{ x: 0 }}
exit={{ x: '100%' }}
transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}

// Backdrop fade
initial={{ opacity: 0 }}
animate={{ opacity: 0.7 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.3 }}

// Staggered items
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}
transition={{ delay: index * 0.05, duration: 0.3 }}
```

## Integration Examples

### With Authentication

```tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import ResponsiveHeader from '@/components/navigation/ResponsiveHeader'
import { useRouter } from 'next/navigation'

export default function AuthenticatedHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleUserClick = () => {
    if (user) {
      router.push('/profile')
    } else {
      router.push('/login')
    }
  }

  return (
    <ResponsiveHeader
      logoText="MyApp"
      logoHref="/"
      navItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings', href: '/settings' },
        { label: 'Logout', href: '/logout' }
      ]}
      onUserIconClick={handleUserClick}
      showUserIcon={!!user}
    />
  )
}
```

### With Layout

```tsx
// app/layout.tsx
import ResponsiveHeader from '@/components/navigation/ResponsiveHeader'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' }
]

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ResponsiveHeader
          logoText="MyBrand"
          navItems={navItems}
        />
        <main>{children}</main>
      </body>
    </html>
  )
}
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS 12+)
- ✅ Chrome Mobile (Android)

## Performance

- Lazy animations with Framer Motion
- Efficient re-renders with React hooks
- CSS transforms for smooth animations
- Body scroll lock prevents layout shifts
- Route change detection for auto-close

## Troubleshooting

### Menu not sliding in
- Ensure Framer Motion is installed: `npm install framer-motion`
- Check z-index conflicts with other fixed/sticky elements

### Icons not showing
- Verify lucide-react is installed: `npm install lucide-react`
- Check import paths

### Responsive breakpoint not working
- Ensure Tailwind CSS is configured correctly
- Check that md: breakpoint is set to 768px in tailwind.config.js

### Body scroll not locking
- Verify useEffect is running (component must be client-side)
- Check for conflicting overflow styles

## License

MIT

## Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide React](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
