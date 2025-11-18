import React from 'react'

export default function StaticHeaderHTML() {
  return (
    <header className="nav tharaga-header" id="tharaga-static-header" role="banner">
      <div className="inner">
        {/* Brand row: Logo + Trust pill */}
        <div className="row">
          <a className="brand" href="/" style={{ fontSize: '26px' }}>THARAGA</a>
          <span className="pill" id="home_pill_trust">Verified • Broker‑free</span>
        </div>
        
        {/* Navigation menu */}
        <nav className="row" aria-label="Primary">
          <span className="menu-group">
            {/* Features dropdown */}
            <details className="dropdown">
              <summary>Features</summary>
              <div className="menu" role="menu">
                <a href="/tools/vastu/" data-next-link>Vastu</a>
                <a href="/tools/environment/" data-next-link>Climate &amp; environment</a>
                <a href="/tools/voice-tamil/" data-next-link>Voice (Tamil)</a>
                <a href="/tools/verification/" data-next-link>Verification</a>
                <a href="/tools/roi/" data-next-link>ROI</a>
                <a href="/tools/currency-risk/" data-next-link>Currency risk</a>
                <span className="divider show-mobile-only" aria-hidden="true"></span>
                <a className="show-mobile-only" href="/pricing/" data-next-link>Pricing</a>
                <a className="show-mobile-only" href="/about/" data-next-link>About</a>
              </div>
            </details>
            <span className="divider" aria-hidden="true"></span>
            
            {/* Portal menu - ALWAYS VISIBLE, shows login prompt if not authenticated */}
            <details className="dropdown" id="portal-menu">
              <summary>Portal</summary>
              <div className="menu" role="menu" aria-label="Portal menu" id="portal-menu-items">
                <a href="/builder" data-next-link data-portal-link="builder">Builder Dashboard</a>
                <a href="/my-dashboard" data-next-link data-portal-link="buyer">Buyer Dashboard</a>
              </div>
            </details>
            <span className="divider" aria-hidden="true"></span>
            
            <a href="/pricing/" data-next-link>Pricing</a>
          </span>
          <span className="divider" aria-hidden="true"></span>
          <a href="/about/" data-next-link>About</a>
        </nav>
        
        {/* Mobile-only About link (hidden by default) */}
        <a className="about-mobile-link" href="/about/" data-next-link>About</a>
        
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
      </div>
    </header>
  )
}

