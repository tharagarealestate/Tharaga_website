'use client'

export default function Header() {
  return (
    <header className="nav">
      <div className="inner">
        <div className="row">
          <a className="brand" href="/" style={{ fontSize: '26px' }}>THARAGA</a>
          <span className="pill" id="home_pill_trust">Verified • Broker‑free</span>
        </div>
        <nav className="row" aria-label="Primary">
          <span className="menu-group">
            <details className="dropdown">
              <summary>Features</summary>
              <div className="menu" role="menu">
                <a href="/tools/vastu/">Vastu</a>
                <a href="/tools/environment/">Climate &amp; environment</a>
                <a href="/tools/voice-tamil/">Voice (Tamil)</a>
                <a href="/tools/verification/">Verification</a>
                <a href="/tools/roi/">ROI</a>
                <a href="/tools/currency-risk/">Currency risk</a>
                {/* Mobile-only injected: Pricing + About (hidden on desktop) */}
                <span className="divider show-mobile-only" aria-hidden="true"></span>
                <a className="show-mobile-only" href="/pricing/">Pricing</a>
                <a className="show-mobile-only" href="/about/">About</a>
              </div>
            </details>
            <span className="divider" aria-hidden="true"></span>
            {/* Portal dropdown (dynamic based on user role) */}
            <details className="dropdown" id="portal-menu">
              <summary>Portal</summary>
              <div className="menu" role="menu" aria-label="Portal menu" id="portal-menu-items">
                {/* Dynamically populated by role manager */}
                <a href="/builder">Builder Dashboard</a>
                <a href="/my-dashboard">Buyer Dashboard</a>
              </div>
            </details>
            <span className="divider" aria-hidden="true"></span>
            <a href="/pricing/">Pricing</a>
          </span>
          <span className="divider" aria-hidden="true"></span>
          <a href="/about/">About</a>
        </nav>
        <a className="about-mobile-link" href="/about/">About</a>
        {/* Auth container - auth system will inject login/signup buttons here */}
        <div id="site-header-auth-container" className="tharaga-header__actions">
          {/* Auth system will inject .thg-auth-wrap here */}
        </div>
        {/* Mobile menu toggle button (hidden on desktop) */}
        <button
          className="mobile-menu-toggle"
          aria-label="Toggle menu"
          aria-expanded="false"
          aria-controls="mobile-menu-panel"
          style={{ display: 'none' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        {/* Mobile menu overlay */}
        <div className="mobile-menu-overlay" aria-hidden="true"></div>
        {/* Mobile menu panel */}
        <nav className="mobile-menu-panel" id="mobile-menu-panel" aria-label="Mobile navigation">
          <button className="mobile-menu-close" aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          {/* Mobile menu items will be populated by JavaScript */}
        </nav>
        {/* Right-side auth group is injected by auth script; ensure Features sits near it by letting nav push left via margin-left:auto */}
      </div>
    </header>
  )
}
