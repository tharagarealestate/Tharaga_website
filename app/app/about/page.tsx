import { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'About Tharaga — AI‑Powered, Broker‑Free Real Estate',
  description: 'Building the future of Tamil Nadu real estate—AI‑powered, transparent, and broker‑free.',
}

export default function AboutPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .about-container {
            width: 100%;
            max-width: 1180px;
            margin: 0 auto;
            padding: 24px;
          }
          .about-hero {
            position: relative;
            overflow: hidden;
            isolation: isolate;
            border-radius: 18px;
            background: linear-gradient(180deg,#fff 0%,#fff9f7 100%);
            box-shadow: 0 10px 35px rgba(110,13,37,.12);
          }
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
          .about-hero__inner {
            position: relative;
            padding: 56px 28px 32px;
          }
          .about-eyebrow {
            position: relative;
            z-index: 1;
            display: inline-block;
            font-weight: 800;
            letter-spacing: .09em;
            text-transform: uppercase;
            color: #6e0d25;
            background: rgba(110,13,37,.08);
            border: 1px solid rgba(110,13,37,.18);
            padding: 6px 10px;
            border-radius: 999px;
            margin-bottom: 14px;
          }
          .about-hero h1 {
            position: relative;
            z-index: 1;
            margin: 0 0 12px;
            font-size: clamp(28px,4.2vw,46px);
            line-height: 1.1;
            font-weight: 800;
          }
          .about-sub {
            position: relative;
            z-index: 1;
            margin: 0 0 16px;
            color: #5b5f6a;
            font-weight: 700;
          }
          .about-sub-tamil {
            position: relative;
            z-index: 1;
            margin: 4px 0 12px;
            color: #7a7f8a;
            font-size: .98rem;
            font-weight: 600;
          }
          .about-lead {
            position: relative;
            z-index: 1;
            margin: 18px 0 20px;
            font-size: clamp(14.5px,1.5vw,17px);
            line-height: 1.7;
            max-width: 900px;
          }
          .about-cta-row {
            position: relative;
            z-index: 1;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin: 10px 0 12px;
          }
          .about-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            border-radius: 12px;
            padding: 12px 18px;
            font-weight: 900;
            letter-spacing: .01em;
            transition: box-shadow .15s ease, transform .15s ease, filter .15s ease;
            text-decoration: none;
            user-select: none;
          }
          .about-btn-primary {
            background: #6e0d25;
            color: #fff;
            border: 2px solid #6e0d25;
          }
          .about-btn-primary:hover {
            filter: brightness(1.04);
          }
          .about-btn-secondary {
            background: #fff;
            color: #6e0d25;
            border: 2px solid #6e0d25;
          }
          .about-btn-secondary:hover {
            background: #fff6f6;
          }
          .about-proof {
            position: relative;
            z-index: 1;
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            margin: 14px 0 6px;
          }
          .about-proof__item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #0b5e43;
            background: #e9fbf3;
            border: 1px solid #d3f7e7;
            border-radius: 999px;
            padding: 7px 12px;
            font-weight: 700;
          }
          .about-grid {
            position: relative;
            z-index: 1;
            display: grid;
            grid-template-columns: minmax(0,1.2fr) minmax(0,.8fr);
            gap: 22px;
            margin-top: 24px;
            align-items: start;
          }
          .about-card {
            position: relative;
            background: #ffffff;
            border: 1px solid #efe1e1;
            border-radius: 16px;
            padding: 18px 16px;
            box-shadow: 0 6px 22px rgba(110,13,37,.09);
          }
          .about-card h3 {
            margin: 0 0 8px;
            font-size: 18px;
          }
          .about-quote {
            margin: 0;
            color: #3f3f46;
            font-style: italic;
          }
          .about-muted {
            color: #5b5f6a;
          }
          .about-roadmap {
            display: flex;
            gap: 12px;
            overflow: auto;
            padding: 10px 2px 2px;
            margin-top: 14px;
            scrollbar-width: thin;
          }
          .about-rm-step {
            min-width: 220px;
            background: linear-gradient(180deg,#fff,#fff7f5);
            border: 1.5px solid #efe1e1;
            border-radius: 14px;
            padding: 12px 14px;
          }
          .about-rm-step b {
            display: block;
            font-size: 12px;
            color: #6e0d25;
            letter-spacing: .06em;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .about-diff {
            display: grid;
            gap: 12px;
          }
          .about-chip {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px;
            border: 1px dashed rgba(110,13,37,.3);
            border-radius: 12px;
            background: #fff;
          }
          .about-chip b {
            font-weight: 900;
          }

          @media (max-width: 980px) {
            .about-grid {
              grid-template-columns: minmax(0, 1fr);
            }
          }
          @media (max-width: 560px) {
            .about-hero__inner {
              padding: 28px 16px;
            }
            .about-cta-row {
              gap: 10px;
            }
            .about-proof {
              gap: 10px;
            }
            .about-rm-step {
              min-width: 200px;
            }
          }
        `
      }} />

      <main className="about-container">
        <section className="about-hero" aria-labelledby="about-hero-title">
          <div className="about-hero__inner">
            <span className="about-eyebrow">
              Tamil Nadu • Broker‑Free • AI‑Powered
            </span>

            <h1 id="about-hero-title">
              Building the future of Tamil Nadu real estate—AI‑powered, transparent, and broker‑free.
            </h1>

            <p className="about-sub">
              Verified buyers. Verified builders. No noise.
            </p>

            <p className="about-sub-tamil" lang="ta">
              உண்மையான வீடு தேடுபவர்களையும், சரிபார்க்கப்பட்ட பில்டர்களையும் நேரடியாக இணைக்கும் — இடைத்தரகர் இல்லாத, தாரகாவின் நேர்மையான அனுபவம்.
            </p>

            <p className="about-lead">
              <strong>Tharaga</strong> exists because families and builders kept getting lost in broker chains, fake listings, and wasted site visits. Instead of dumping generic leads, we use <strong>AI buyer–property matching</strong>, <strong>predictive demand signals</strong>, and <strong>smart lead scoring</strong> to connect <strong>verified home seekers</strong> with <strong>verified builders</strong>—fast. Every project gets cinematic storytelling (reels, walkthroughs), organized legal folders, and <strong>WhatsApp‑first automation</strong> so conversations don&apos;t slip. For builders, that means fewer calls, more conversions, and control via a clean dashboard. For buyers, it means clarity, trust, and zero noise. <strong>Our vision is generational:</strong> by <strong>2035</strong>, every family in Tamil Nadu should know Tharaga as the most trusted name in homes—not just a portal, but a promise.
            </p>

            <nav className="about-cta-row" aria-label="Primary actions">
              <a className="about-btn about-btn-primary" href="https://docs.google.com/forms/d/e/1FAIpQLScVrrMf7voKVXGz9d2giOje_p-nyt9yEdxJgWkVc0Mc1-PN1Q/viewform?usp=sharing" rel="noopener" aria-label="List my project on Tharaga via secure form">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                List My Project
              </a>
              <a className="about-btn about-btn-secondary" href="https://tharaga.co.in/verified-property-listings" rel="noopener" aria-label="Explore verified homes on Tharaga">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Explore Verified Homes
              </a>
            </nav>

            <div className="about-proof" role="list" aria-label="Trust badges">
              <div className="about-proof__item" role="listitem">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="#0f9d70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                OTP‑verified leads only
              </div>
              <div className="about-proof__item" role="listitem">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="#0f9d70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                No brokerage, no middlemen
              </div>
              <div className="about-proof__item" role="listitem">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="#0f9d70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                AI‑matched inquiries
              </div>
              <div className="about-proof__item" role="listitem">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="#0f9d70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Tamil‑Nadu focused
              </div>
            </div>

            <div className="about-grid" aria-label="Founder note and differentiators">
              <article className="about-card" aria-labelledby="founder-note-title">
                <h3 id="founder-note-title">Why We Started Tharaga</h3>
                <p className="about-quote">
                  &quot;We built Tharaga because our own families struggled with noise and mistrust. Real estate should feel premium—and honest.&quot;
                </p>
                <p className="about-muted" style={{ marginTop: '8px' }}>Built by creators and operators—focused on clarity and conversion.</p>
                <div className="about-roadmap" aria-label="Roadmap">
                  <div className="about-rm-step"><b>2025</b> Statewide AI matching</div>
                  <div className="about-rm-step"><b>2027</b> Predictive locality insights</div>
                  <div className="about-rm-step"><b>2030</b> End‑to‑end digital closing</div>
                  <div className="about-rm-step"><b>2035</b> Tharaga in every TN household</div>
                </div>
              </article>

              <aside className="about-card about-diff" aria-label="Why we're different">
                <div className="about-chip">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20V4m0 0 4 4m-4-4-4 4" stroke="#6e0d25" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <div><b>AI over Ads</b><br /><span className="about-muted">Matches that convert, not mass leads.</span></div>
                </div>
                <div className="about-chip">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12l2-2 4 4L21 4" stroke="#6e0d25" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <div><b>Storytelling that sells</b><br /><span className="about-muted">Cinematic reels + legal clarity.</span></div>
                </div>
                <div className="about-chip">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8v8m-4-4h8" stroke="#6e0d25" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <div><b>TN‑first, always</b><br /><span className="about-muted">Built for local realities & trust.</span></div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
