export const runtime = 'edge'

export default function AboutPage() {
  return (
    <main className="container" style={{ width: '100%', maxWidth: '1180px', margin: '0 auto', padding: '24px' }}>
      <section className="about-hero" aria-labelledby="about-hero-title" style={{
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate',
        borderRadius: '18px',
        background: 'linear-gradient(180deg,#fff 0%,#fff9f7 100%)',
        boxShadow: '0 10px 35px rgba(110,13,37,.12)'
      }}>
        <div className="about-hero__inner" style={{ position: 'relative', padding: '56px 28px 32px' }}>
          <span className="eyebrow" style={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-block',
            fontWeight: 800,
            letterSpacing: '.09em',
            textTransform: 'uppercase',
            color: '#6e0d25',
            background: 'rgba(110,13,37,.08)',
            border: '1px solid rgba(110,13,37,.18)',
            padding: '6px 10px',
            borderRadius: '999px',
            marginBottom: '14px'
          }}>
            Tamil Nadu • Broker‑Free • AI‑Powered
          </span>

          <h1 id="about-hero-title" style={{
            position: 'relative',
            zIndex: 1,
            margin: '0 0 12px',
            fontSize: 'clamp(28px,4.2vw,46px)',
            lineHeight: 1.1,
            fontWeight: 800
          }}>
            Building the future of Tamil Nadu real estate—AI‑powered, transparent, and broker‑free.
          </h1>

          <p className="sub" style={{ position: 'relative', zIndex: 1, margin: '0 0 16px', color: '#5b5f6a', fontWeight: 700 }}>
            Verified buyers. Verified builders. No noise.
          </p>

          <p className="sub-tamil" lang="ta" style={{
            position: 'relative',
            zIndex: 1,
            margin: '4px 0 12px',
            color: '#7a7f8a',
            fontSize: '.98rem',
            fontWeight: 600
          }}>
            உண்மையான வீடு தேடுபவர்களையும், சரிபார்க்கப்பட்ட பில்டர்களையும் நேரடியாக இணைக்கும் — இடைத்தரகர் இல்லாத, தாரகாவின் நேர்மையான அனுபவம்.
          </p>

          <p className="lead" style={{
            position: 'relative',
            zIndex: 1,
            margin: '18px 0 20px',
            fontSize: 'clamp(14.5px,1.5vw,17px)',
            lineHeight: 1.7,
            maxWidth: '900px'
          }}>
            <strong>Tharaga</strong> exists because families and builders kept getting lost in broker chains, fake listings, and wasted site visits. Instead of dumping generic leads, we use <strong>AI buyer–property matching</strong>, <strong>predictive demand signals</strong>, and <strong>smart lead scoring</strong> to connect <strong>verified home seekers</strong> with <strong>verified builders</strong>—fast. Every project gets cinematic storytelling (reels, walkthroughs), organized legal folders, and <strong>WhatsApp‑first automation</strong> so conversations don&apos;t slip. For builders, that means fewer calls, more conversions, and control via a clean dashboard. For buyers, it means clarity, trust, and zero noise. <strong>Our vision is generational:</strong> by <strong>2035</strong>, every family in Tamil Nadu should know Tharaga as the most trusted name in homes—not just a portal, but a promise.
          </p>

          <nav className="cta-row" aria-label="Primary actions" style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            margin: '10px 0 12px'
          }}>
            <a className="btn btn--primary" href="https://docs.google.com/forms/d/e/1FAIpQLScVrrMf7voKVXGz9d2giOje_p-nyt9yEdxJgWkVc0Mc1-PN1Q/viewform?usp=sharing" rel="noopener" aria-label="List my project on Tharaga via secure form" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              borderRadius: '12px',
              border: '2px solid #6e0d25',
              padding: '12px 18px',
              fontWeight: 900,
              letterSpacing: '.01em',
              transition: 'box-shadow .15s ease, transform .15s ease, filter .15s ease',
              textDecoration: 'none',
              userSelect: 'none',
              background: '#6e0d25',
              color: '#fff'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              List My Project
            </a>
            <a className="btn btn--secondary" href="https://tharaga.co.in/verified-property-listings" rel="noopener" aria-label="Explore verified homes on Tharaga" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              borderRadius: '12px',
              border: '2px solid #6e0d25',
              padding: '12px 18px',
              fontWeight: 900,
              letterSpacing: '.01em',
              transition: 'box-shadow .15s ease, transform .15s ease, filter .15s ease',
              textDecoration: 'none',
              userSelect: 'none',
              background: '#fff',
              color: '#6e0d25'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Explore Verified Homes
            </a>
          </nav>

          <div className="proof" role="list" aria-label="Trust badges" style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            margin: '14px 0 6px'
          }}>
            <div className="proof__item" role="listitem" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#0b5e43',
              background: '#e9fbf3',
              border: '1px solid #d3f7e7',
              borderRadius: '999px',
              padding: '7px 12px',
              fontWeight: 700
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="#0f9d70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              OTP‑verified leads only
            </div>
            <div className="proof__item" role="listitem" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#0b5e43',
              background: '#e9fbf3',
              border: '1px solid #d3f7e7',
              borderRadius: '999px',
              padding: '7px 12px',
              fontWeight: 700
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="#0f9d70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              No brokerage, no middlemen
            </div>
            <div className="proof__item" role="listitem" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#0b5e43',
              background: '#e9fbf3',
              border: '1px solid #d3f7e7',
              borderRadius: '999px',
              padding: '7px 12px',
              fontWeight: 700
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="#0f9d70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              AI‑matched inquiries
            </div>
            <div className="proof__item" role="listitem" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#0b5e43',
              background: '#e9fbf3',
              border: '1px solid #d3f7e7',
              borderRadius: '999px',
              padding: '7px 12px',
              fontWeight: 700
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="#0f9d70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Tamil‑Nadu focused
            </div>
          </div>

          <div className="grid" aria-label="Founder note and differentiators" style={{
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,.8fr)',
            gap: '22px',
            marginTop: '24px',
            alignItems: 'start'
          }}>
            <article className="card" aria-labelledby="founder-note-title" style={{
              position: 'relative',
              background: '#ffffff',
              border: '1px solid #efe1e1',
              borderRadius: '16px',
              padding: '18px 16px',
              boxShadow: '0 6px 22px rgba(110,13,37,.09)'
            }}>
              <h3 id="founder-note-title" style={{ margin: '0 0 8px', fontSize: '18px' }}>Why We Started Tharaga</h3>
              <p className="quote" style={{ margin: 0, color: '#3f3f46', fontStyle: 'italic' }}>
                &quot;We built Tharaga because our own families struggled with noise and mistrust. Real estate should feel premium—and honest.&quot;
              </p>
              <p className="muted" style={{ marginTop: '8px', color: '#5b5f6a' }}>Built by creators and operators—focused on clarity and conversion.</p>
              <div className="roadmap" aria-label="Roadmap" style={{
                display: 'flex',
                gap: '12px',
                overflow: 'auto',
                padding: '10px 2px 2px',
                marginTop: '14px',
                scrollbarWidth: 'thin'
              }}>
                <div className="rm-step" style={{
                  minWidth: '220px',
                  background: 'linear-gradient(180deg,#fff,#fff7f5)',
                  border: '1.5px solid #efe1e1',
                  borderRadius: '14px',
                  padding: '12px 14px'
                }}>
                  <b style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#6e0d25',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    marginBottom: '6px'
                  }}>2025</b> Statewide AI matching
                </div>
                <div className="rm-step" style={{
                  minWidth: '220px',
                  background: 'linear-gradient(180deg,#fff,#fff7f5)',
                  border: '1.5px solid #efe1e1',
                  borderRadius: '14px',
                  padding: '12px 14px'
                }}>
                  <b style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#6e0d25',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    marginBottom: '6px'
                  }}>2027</b> Predictive locality insights
                </div>
                <div className="rm-step" style={{
                  minWidth: '220px',
                  background: 'linear-gradient(180deg,#fff,#fff7f5)',
                  border: '1.5px solid #efe1e1',
                  borderRadius: '14px',
                  padding: '12px 14px'
                }}>
                  <b style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#6e0d25',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    marginBottom: '6px'
                  }}>2030</b> End‑to‑end digital closing
                </div>
                <div className="rm-step" style={{
                  minWidth: '220px',
                  background: 'linear-gradient(180deg,#fff,#fff7f5)',
                  border: '1.5px solid #efe1e1',
                  borderRadius: '14px',
                  padding: '12px 14px'
                }}>
                  <b style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#6e0d25',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    marginBottom: '6px'
                  }}>2035</b> Tharaga in every TN household
                </div>
              </div>
            </article>

            <aside className="card diff" aria-label="Why we're different" style={{
              position: 'relative',
              background: '#ffffff',
              border: '1px solid #efe1e1',
              borderRadius: '16px',
              padding: '18px 16px',
              boxShadow: '0 6px 22px rgba(110,13,37,.09)',
              display: 'grid',
              gap: '12px'
            }}>
              <div className="chip" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                border: '1px dashed rgba(110,13,37,.3)',
                borderRadius: '12px',
                background: '#fff'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20V4m0 0 4 4m-4-4-4 4" stroke="#6e0d25" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div><b style={{ fontWeight: 900 }}>AI over Ads</b><br /><span style={{ color: '#5b5f6a' }}>Matches that convert, not mass leads.</span></div>
              </div>
              <div className="chip" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                border: '1px dashed rgba(110,13,37,.3)',
                borderRadius: '12px',
                background: '#fff'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12l2-2 4 4L21 4" stroke="#6e0d25" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div><b style={{ fontWeight: 900 }}>Storytelling that sells</b><br /><span style={{ color: '#5b5f6a' }}>Cinematic reels + legal clarity.</span></div>
              </div>
              <div className="chip" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                border: '1px dashed rgba(110,13,37,.3)',
                borderRadius: '12px',
                background: '#fff'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v8m-4-4h8" stroke="#6e0d25" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div><b style={{ fontWeight: 900 }}>TN‑first, always</b><br /><span style={{ color: '#5b5f6a' }}>Built for local realities & trust.</span></div>
              </div>
            </aside>
          </div>
        </div>

        {/* Background decorative elements */}
        <style jsx>{`
          .about-hero::after {
            content: "";
            position: absolute;
            right: -120px;
            top: -140px;
            width: 340px;
            height: 340px;
            border-radius: 50%;
            opacity: 0.24;
            z-index: 0;
            transform: translateZ(0);
            background: radial-gradient(closest-side, rgba(110,13,37,.35), transparent 75%);
          }
          .about-hero::before {
            content: "";
            position: absolute;
            inset: -1px;
            z-index: 0;
            pointer-events: none;
            opacity: 0.45;
            background:
              radial-gradient(circle at 1px 1px, rgba(110,13,37,.12) 1px, transparent 1px) 0 0/22px 22px,
              linear-gradient(180deg, rgba(110,13,37,.04), rgba(110,13,37,.02) 60%, transparent);
            mask: linear-gradient(180deg, rgba(0,0,0,.9), rgba(0,0,0,.65) 55%, rgba(0,0,0,.15));
          }

          @media (max-width: 980px) {
            .grid {
              grid-template-columns: minmax(0, 1fr) !important;
            }
          }
          @media (max-width: 560px) {
            .about-hero__inner {
              padding: 28px 16px !important;
            }
            .cta-row {
              gap: 10px !important;
            }
            .proof {
              gap: 10px !important;
            }
            .rm-step {
              min-width: 200px !important;
            }
          }
        `}</style>
      </section>
    </main>
  )
}
