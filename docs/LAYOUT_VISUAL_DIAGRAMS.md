# THARAGA WEBSITE - VISUAL LAYOUT DIAGRAMS

## 1. ROOT LAYOUT STRUCTURE

/app/app/layout.tsx
├── HTML Head
│   ├── Global styles
│   ├── Fonts
│   └── Inline header styles
├── HTML Body
│   ├── Providers
│   │   ├── EntitlementsProvider
│   │   ├── AppI18nProvider
│   │   ├── ReactQueryProvider
│   │   └── PrefetchRoutes
│   ├── StaticHeaderHTML
│   │   └── Sticky header (z-9999, top-0)
│   ├── HeaderLinkInterceptor
│   ├── Page Content {children}
│   └── MobileBottomNav

## 2. DESKTOP VIEW - BUILDER DASHBOARD

┌─────────────────────────────────────────────┐
│  STATIC HEADER (60px, sticky)               │
│  Logo | Features | Portal | About | Auth    │
└─────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────┐
│                  │                          │
│  SIDEBAR         │  MAIN CONTENT            │
│ (hidden lg:)     │                          │
│                  │  {children}              │
│  Dashboard       │  ├── Leads               │
│  Leads (count)   │  ├── Properties          │
│  Properties      │  ├── Analytics           │
│  Analytics       │  ├── Settings            │
│  Settings        │                          │
│                  │                          │
└──────────────────┴──────────────────────────┘

## 3. MOBILE VIEW - BUILDER DASHBOARD

┌─────────────────────────────────┐
│  STATIC HEADER (60px)           │
│  Logo | Portal | Auth           │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  MOBILE HEADER (sticky @60px)   │
│  [Hamburger] Title              │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│                                 │
│  MAIN CONTENT                   │
│  {children}                     │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  MOBILE BOTTOM NAV              │
└─────────────────────────────────┘

Off-Canvas (hamburger click):
┌─────────────────────────────────┐
│ [Overlay: bg-gray-900/50]       │
│  ┌────────────────────────────┐ │
│  │ SIDEBAR                    │ │
│  │ Dashboard                  │ │
│  │ Leads                      │ │
│  │ Properties                 │ │
│  │ Analytics                  │ │
│  │ Settings                   │ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘

## 4. MY-DASHBOARD LAYOUT

┌─────────────────────────────────────────────┐
│  STATIC HEADER (60px)                       │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  TOPNAV                                     │
│  [Search] | Saved Count | Visits | Notif   │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│                                             │
│  CONTENT (max-w-7xl, mx-auto)              │
│  Gradient background                       │
│  ├── Luxury Cards                          │
│  ├── Upcoming Visits                       │
│  └── Recommendations                       │
│                                             │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  MOBILE BOTTOM NAV                          │
└─────────────────────────────────────────────┘

## 5. ADMIN DASHBOARD LAYOUT

┌─────────────────────────────────────────────┐
│  STATIC HEADER (60px)                       │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Dark Background (bg-gray-950)              │
│                                             │
│  ADMIN METRICS                              │
│  ├── Top Row Metrics                        │
│  ├── User Growth Chart                      │
│  ├── Revenue Forecast                       │
│  ├── Top Properties                         │
│  └── Builder Leaderboard                    │
│                                             │
│  Real-time updates via Supabase             │
│                                             │
└─────────────────────────────────────────────┘

## 6. STATIC HEADER STRUCTURE

<header class="nav">
  <div class="inner">
    <div class="row">
      <a class="brand">THARAGA</a>
      <span class="pill">Verified • Broker-free</span>
    </div>

    <nav class="row">
      Features (dropdown)
      │ Vastu
      │ Climate & environment
      │ Voice (Tamil)
      │ Verification
      │ ROI
      │ Currency risk

      Portal (dropdown)
      │ Builder Dashboard
      │ Buyer Dashboard
      │ Admin Panel (admin only)

      Pricing (link)
      About (link)
    </nav>

    <div id="site-header-auth-container">
      {Auth system injects here}
    </div>
  </div>
</header>

## 7. CSS POSITIONING

Static Header:
position: sticky;
top: 0;
z-index: 9999;
height: 60px;

Dashboard Content:
margin-top: 60px;
OR
position: sticky;
top: 60px;
z-index: 40;

Mobile Dashboard Header:
position: sticky;
top: 60px;
z-index: 40;

Mobile Bottom Nav:
position: fixed;
bottom: 0;
z-index: 50;

Sidebar Off-Canvas:
position: fixed;
inset: 0;
z-index: 50;

## 8. RESPONSIVE BREAKPOINTS

Mobile (< 640px):
- Header: Single row, compact
- Sidebar: Hidden, off-canvas
- Mobile header: Visible
- Bottom nav: Visible

Tablet (640px - 1024px):
- Header: Starts wrapping
- Sidebar: Still off-canvas
- Mobile header: Visible
- Bottom nav: Visible

Desktop (> 1024px):
- Header: Full layout
- Sidebar: Visible in layout
- Mobile header: Hidden
- Bottom nav: Hidden
- Mobile off-canvas: Hidden

## 9. PORTAL MENU BEHAVIOR

Not Authenticated:
├── Buyer Dashboard (with 🔒 lock)
├── Builder Dashboard (with 🔒 lock)
└── Clicking redirect to /login?next=[destination]

Authenticated (Builder):
├── Builder Dashboard ✓ (checkmark, active)
├── Buyer Dashboard (if has buyer role)
└── Admin Panel (if admin)

Authenticated (Buyer):
├── Buyer Dashboard ✓ (checkmark, active)
├── Builder Dashboard (if has builder role)
└── Admin Panel (if admin)

## 10. LAYOUT COMPOSITION PATTERN

Standard Dashboard Layout:

export default function DashboardLayout({ children }) {
  return (
    <Provider>
      <div className="min-h-screen bg-...">
        {/* Static header comes from root layout */}
        
        {/* Optional: Mobile header */}
        <MobileHeader />
        
        {/* Optional: Sidebar or TopNav */}
        <Sidebar /> or <TopNav />
        
        {/* Main content */}
        <main className="...">
          {children}
        </main>
        
        {/* Optional: Bottom nav */}
        <BottomNav />
      </div>
    </Provider>
  )
}

