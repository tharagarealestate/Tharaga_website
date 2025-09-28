import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tharaga — Premium Real Estate',
  description: 'AI-powered real estate assistant',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-inter bg-brandWhite text-deepBlue min-h-screen">
        <header className="border-b border-deepBlue/10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container mx-auto flex items-center justify-between py-4 px-4">
            <a href="/" className="flex items-center gap-2">
              <span className="inline-block h-6 w-6 rounded bg-deepBlue" aria-hidden="true" />
              <span className="font-semibold tracking-tight">Tharaga</span>
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm text-deepBlue/80">
              <a href="/property-listing/" className="hover:text-deepBlue">Properties</a>
              <a href="/snippets/" className="hover:text-deepBlue">Snippets</a>
              <a href="/app/" className="hover:text-deepBlue">App</a>
            </nav>
            <div className="flex items-center gap-2">
              <a href="/login_signup_glassdrop/" className="inline-flex h-10 items-center rounded-xl border border-deepBlue/20 px-4 text-sm hover:bg-deepBlue/5">Login</a>
              <a href="/login_signup_glassdrop/" className="inline-flex h-10 items-center rounded-xl bg-deepBlue px-4 text-sm text-white hover:bg-deepBlue/90">Sign up</a>
            </div>
          </div>
        </header>
        <main className="pb-20">{children}</main>
        <footer className="mt-auto border-t border-deepBlue/10 bg-white">
          <div className="container mx-auto py-8 px-4 text-sm text-deepBlue/70">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p>© {new Date().getFullYear()} Tharaga. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <a href="/about/" className="hover:text-deepBlue">About</a>
                <a href="/rating/" className="hover:text-deepBlue">Ratings</a>
                <a href="/Reset_password/" className="hover:text-deepBlue">Reset Password</a>
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

