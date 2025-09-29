import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tharaga — Premium Real Estate',
  description: 'AI-powered real estate assistant',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-inter bg-[var(--brand-cream)] text-[var(--brand-ink)] min-h-screen">
        <header className="border-b border-[rgba(110,13,37,.15)] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container mx-auto flex items-center justify-between py-4 px-4">
            <a href="/" className="flex items-center gap-2">
              <span className="inline-block h-6 w-6 rounded bg-[var(--brand-maroon)]" aria-hidden="true" />
              <span className="font-semibold tracking-tight">Tharaga</span>
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm text-[color:rgba(27,27,27,.8)]">
              <a href="/property-listing/" className="hover:text-[var(--brand-ink)]">Properties</a>
              <a href="/snippets/" className="hover:text-[var(--brand-ink)]">Snippets</a>
              <a href="/app/" className="hover:text-[var(--brand-ink)]">App</a>
            </nav>
            <div className="flex items-center gap-2">
              <a href="/login_signup_glassdrop/" className="inline-flex h-10 items-center rounded-xl border border-[rgba(110,13,37,.25)] px-4 text-sm hover:bg-[rgba(110,13,37,.06)]">Login</a>
              <a href="/login_signup_glassdrop/" className="inline-flex h-10 items-center rounded-xl bg-[var(--brand-maroon)] px-4 text-sm text-white hover:bg-[var(--brand-maroon-2)]">Sign up</a>
            </div>
          </div>
        </header>
        <main className="pb-20">{children}</main>
        <footer className="mt-auto border-t border-[rgba(110,13,37,.12)] bg-white">
          <div className="container mx-auto py-8 px-4 text-sm text-[rgba(27,27,27,.72)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p>© {new Date().getFullYear()} Tharaga. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <a href="/about/" className="hover:text-[var(--brand-ink)]">About</a>
                <a href="/rating/" className="hover:text-[var(--brand-ink)]">Ratings</a>
                <a href="/Reset_password/" className="hover:text-[var(--brand-ink)]">Reset Password</a>
              </div>
            </div>
          </div>
        </footer>
        {/* Web Vitals reporting */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            function report(name, value){
              try{ navigator.sendBeacon && navigator.sendBeacon('/api/__vitals', JSON.stringify({ name, value, t: Date.now() })); }catch(_){ }
            }
            try{
              if ('PerformanceObserver' in window) {
                new PerformanceObserver((list) => { for (const entry of list.getEntries()) report(entry.name, entry.value) }).observe({ type: 'largest-contentful-paint', buffered: true });
                new PerformanceObserver((list) => { for (const entry of list.getEntries()) report('CLS', entry.value) }).observe({ type: 'layout-shift', buffered: true });
              }
            }catch(_){ }
          })();
        `}} />
      </body>
    </html>
  )
}

