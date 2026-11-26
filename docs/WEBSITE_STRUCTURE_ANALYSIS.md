# Tharaga Website Structure Analysis

## 1. HEADER COMPONENT LOCATION

### Main Files
- /app/components/StaticHeaderHTML.tsx - Primary header component
- /app/components/HeaderLinkInterceptor.tsx - Client-side navigation interceptor
- /app/components/ConditionalHeader.tsx - Controls header visibility

### How Header Works
- Static React component (memoized for performance)
- Uses JSX to define HTML structure (not HTML string)
- Sticky positioning with z-index: 9999
- Glassmorphic design with 20px blur
- Premium blue (#1e40af) and gold (#d4af37) colors
- Injected inline styles in root layout.tsx

---

## 2. LAYOUT HIERARCHY

### Root Layout
Location: /app/app/layout.tsx
- Includes global CSS, fonts, providers
- Renders static header
- Wraps all pages with:
  - EntitlementsProvider (feature gating)
  - AppI18nProvider (internationalization)
  - ReactQueryProvider (data fetching)
  - PrefetchRoutes (route prefetching)

### Group Layouts
Organize routes without affecting URLs:
- (auth) - Authentication routes
- (dashboard) - Protected dashboard routes  
- (marketing) - Marketing pages like pricing

---

## 3. DASHBOARD LAYOUT STRUCTURES

### Builder Dashboard
File: /app/app/(dashboard)/builder/layout.tsx
- Sidebar (visible on desktop, hidden on mobile)
- Responsive flex layout
- Real-time lead count updates
- Mobile hamburger menu
- Sidebar shows: Leads, Properties, Analytics, Settings

### My-Dashboard (Buyer)
File: /app/app/(dashboard)/my-dashboard/layout.tsx
- TopNav with search bar
- Saved properties count (from localStorage)
- Upcoming visits count (from Supabase)
- Notification panel
- Gradient background
- Mobile bottom navigation

### Admin Dashboard
File: /app/app/(dashboard)/admin/layout.tsx
- Dark theme (bg-gray-950)
- Real-time metrics display
- Supabase change listeners
- No sidebar - full-width content

---

## 4. ROUTING ORGANIZATION

### Current Structure
/app/app/
├── (auth)/ - Authentication routes
├── (dashboard)/ - Protected dashboard routes
│   ├── admin/ - Admin metrics
│   ├── builder/ - Builder dashboard
│   │   ├── leads/
│   │   ├── properties/
│   │   ├── analytics/
│   │   └── settings/
│   ├── my-dashboard/ - Buyer dashboard
│   └── behavior-tracking/
├── (marketing)/ - Marketing pages
├── [locale]/ - i18n routes
├── api/ - API endpoints
├── login/ - Login page
├── properties/[id]/ - Property detail
├── tools/ - Tools pages
├── tours/ - Tour pages
└── page.tsx - Homepage

### Route Separation
- Public routes: /, /login, /properties/[id], /tools/*, /tours/*, /pricing
- Protected routes: /admin, /builder, /my-dashboard (require authentication)
- API routes: /api/* (organized by feature)

---

## 5. EXISTING LAYOUT FILES

/app/app/layout.tsx - Root layout
/app/app/(dashboard)/builder/layout.tsx - Builder dashboard
/app/app/(dashboard)/my-dashboard/layout.tsx - Buyer dashboard
/app/app/(dashboard)/admin/layout.tsx - Admin dashboard
/app/app/[locale]/layout.tsx - i18n wrapper
/app/app/_embed/layout.tsx - Embedded content (minimal)
/app/app/embed/layout.tsx - Embed route page

---

## 6. NAVIGATION PATTERNS

### Static Header Navigation
- Features (dropdown) - Vastu, Climate, Voice, Verification, ROI
- Portal (dropdown) - Builder Dashboard, Buyer Dashboard, Admin Panel
- Pricing (link)
- About (link)
- Auth buttons - Login/Signup or user menu

### Portal Menu (Dynamic)
- Connected to role-manager-v2.js
- Updates based on user authentication and roles
- Shows lock icons for unauthenticated users
- Redirects to /login?next=[destination] on lock click

### Dashboard Navigation
Builder: Sidebar with Dashboard, Leads, Properties, Analytics, Settings
My-Dashboard: TopNav with search and shortcuts
Admin: No sidebar, full-width metrics

---

## 7. KEY PATTERNS

### Header Setup
- Positioned sticky at top: top: 0, z-index: 9999
- Sets --header-height CSS variable: 60px
- Dashboard content positioned at top-[60px] to account for header

### Mobile Responsiveness
- Static header: Always visible
- Dashboard mobile header: Appears at top-[60px] below static header
- Mobile bottom navigation: Positioned at bottom
- Sidebar: Hidden on mobile, visible on lg+ screens

### Real-Time Updates
- Leads count: Polled every 5-30 seconds
- Saved properties: Tracked via localStorage
- Visits count: Fetched from Supabase on 30s interval
- Role changes: Watched via event listeners

### Client Navigation
- HeaderLinkInterceptor intercepts header link clicks
- Uses Next.js router for client-side navigation
- MutationObserver watches for dynamic menu changes
- Header stays fixed while content loads

---

## 8. COMPONENT STRUCTURE

### Header Components
StaticHeaderHTML.tsx - Main header JSX
HeaderLinkInterceptor.tsx - Client-side navigation
ConditionalHeader.tsx - Visibility control
MobileBottomNav.tsx - Mobile navigation

### Dashboard Components
Sidebar.tsx (builder) - Navigation sidebar
TopNav.tsx (my-dashboard) - Top navigation
NotificationPanel.tsx - Shared notifications
Various card components for content display

### Providers
ReactQueryProvider - TanStack Query
AppI18nProvider - Internationalization
PrefetchRoutes - Route prefetching
EntitlementsProvider - Feature gating

---

## 9. API ROUTE ORGANIZATION

/api/builder/* - Builder operations
  /leads - CRUD operations
  /leads/[id] - Individual lead
  /properties - Property management
  /subscription - Subscription info

/api/admin/* - Admin operations
  /metrics/* - Various metrics endpoints
  /email-report - Email reports

/api/leads/* - Lead management
  /route.ts - CRUD
  /count - Lead count
  /bulk - Bulk operations
  /export - Export data

---

## SUMMARY

The Tharaga website uses:
1. Static header shared across all pages
2. Route groups to organize routes without URL changes
3. Different layouts for different dashboard user roles
4. Real-time updates via polling and event listeners
5. Mobile-first responsive design
6. Premium glassmorphic design system
7. Clear separation of public, protected, and API routes
