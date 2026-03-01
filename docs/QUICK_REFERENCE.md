QUICK REFERENCE GUIDE

HEADER FILES
============
/app/components/StaticHeaderHTML.tsx - Main header
/app/components/HeaderLinkInterceptor.tsx - Client nav
/app/components/ConditionalHeader.tsx - Visibility

ROOT LAYOUT
===========
/app/app/layout.tsx (NOT /app/layout.tsx)
- Has all providers
- Imports StaticHeaderHTML
- Has global CSS
- Auth setup

DASHBOARD LAYOUTS
=================
Builder: /app/app/(dashboard)/builder/layout.tsx
My-Dashboard: /app/app/(dashboard)/my-dashboard/layout.tsx
Admin: /app/app/(dashboard)/admin/layout.tsx

ROUTE GROUPS
============
(auth) - Auth routes
(dashboard) - Protected routes
(marketing) - Marketing pages
[locale] - Internationalization
_embed - Private folder

STYLING KEY POINTS
==================
Header: sticky, top-0, z-9999, height-60px
Colors: Blue #1e40af, Gold #d4af37
Mobile: < 880px breakpoint
Glassmorphism: blur(20px)

COMPONENTS
==========
Sidebar: /app/app/(dashboard)/builder/_components/Sidebar.tsx
TopNav: /app/app/(dashboard)/my-dashboard/_components/TopNav.tsx
NotificationPanel: /app/app/(dashboard)/_components/NotificationPanel.tsx

PORTAL MENU
===========
HTML: id="portal-menu" in StaticHeaderHTML.tsx
JS: window.__updatePortalMenu()
Roles: builder, buyer, admin
State: window.thgRoleManager

API ROUTES
==========
Builder: /api/builder/leads, /api/builder/properties
Admin: /api/admin/metrics/*
Leads: /api/leads, /api/leads/count, /api/leads/bulk
Shared: /api/interactions, /api/team-members

RESPONSIVE
==========
Mobile (< 640px): Header compact, sidebar hidden, mobile header visible
Desktop (> 1024px): Header full, sidebar visible, mobile hidden
Breakpoint: 880px and 1080px
