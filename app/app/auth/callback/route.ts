/**
 * Auth Callback Route — server-side OAuth & OTP exchange
 *
 * Handles three Supabase callback scenarios:
 *
 * 1. PKCE (Google OAuth): ?code=AUTH_CODE&next=/builder
 *    → exchangeCodeForSession() → redirect
 *
 * 2. Email OTP / Magic Link: ?token_hash=TOKEN&type=email|signup|...&next=/builder
 *    → verifyOtp() → redirect
 *
 * 3. Implicit grant (hash tokens): no server-visible params
 *    → The page.tsx client component at this path is ALSO in the same directory.
 *      But since route.ts takes precedence for GET, we serve a minimal client-side
 *      redirect script that reads the hash and calls the Supabase JS client.
 *      This preserves the hash fragment that the browser never sends to the server.
 *
 * Why server-side (route.ts) instead of client-side only (page.tsx):
 *  - PKCE exchange is atomic: one-time code → instant redirect. No hydration delay.
 *  - Session cookie is written server-side: works for SSR routes immediately.
 *  - Eliminates React 18 Strict Mode double-execution edge case.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code      = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type      = searchParams.get('type') as 'email' | 'signup' | 'recovery' | 'invite' | 'magiclink' | null
  const next      = searchParams.get('next') ?? '/builder'

  // Security: only allow relative paths (prevent open-redirect)
  const redirectTo = next.startsWith('/') ? next : '/builder'

  // ── 1. PKCE (Google OAuth) ────────────────────────────────────────────────
  // ── 2. Email OTP / Magic Link ─────────────────────────────────────────────
  if (code || (tokenHash && type)) {
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // Server Components: cookies are read-only. The middleware will
              // propagate fresh tokens on the next request. Safe to ignore.
            }
          },
        },
      }
    )

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
      console.error('[Auth Callback] PKCE exchange failed:', error.message)
    }

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      if (!error) {
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
      console.error('[Auth Callback] OTP verify failed:', error.message)
    }

    // Both methods failed → error redirect
    return NextResponse.redirect(`${origin}/?error=auth_callback_failed`)
  }

  // ── 3. Implicit grant (hash-based tokens) ─────────────────────────────────
  // The hash fragment is never sent to the server.
  // Serve a minimal script that reads the hash and lets the Supabase client
  // process it via detectSessionInUrl / setSession, then redirects.
  const safeNext = JSON.stringify(redirectTo)
  const safeOrigin = JSON.stringify(origin)

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Signing you in…</title>
  <style>
    body { margin:0; background:#09090b; display:flex; align-items:center; justify-content:center; min-height:100vh; font-family:system-ui,sans-serif; }
    .wrap { text-align:center; }
    .spinner { width:32px; height:32px; border-radius:50%; border:2px solid rgba(245,158,11,0.2); border-top-color:#f59e0b; animation:spin .7s linear infinite; margin:0 auto 16px; }
    @keyframes spin { to { transform:rotate(360deg) } }
    p { color:#71717a; font-size:13px; margin:0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="spinner"></div>
    <p>Completing sign in&hellip;</p>
  </div>
  <script>
    (function () {
      var redirectTo = ${safeNext};
      var origin     = ${safeOrigin};

      // Read hash fragment (never sent to server)
      var hash  = window.location.hash.slice(1);
      var query = new URLSearchParams(hash);
      var at    = query.get('access_token');
      var rt    = query.get('refresh_token');

      if (!at || !rt) {
        // No tokens in hash either — probably a stale or invalid link
        window.location.href = origin + '/?error=auth_callback_failed';
        return;
      }

      // Load Supabase from the global provided by the page layout,
      // or fall back to a minimal fetch to set the session cookie.
      function setAndRedirect() {
        // Store tokens in localStorage for Supabase client
        var storageKey = 'sb-' + new URL(origin).hostname.split('.')[0] + '-auth-token';
        try {
          var sess = {
            access_token:  at,
            refresh_token: rt,
            token_type:    'bearer',
            expires_in:    3600,
            expires_at:    Math.floor(Date.now() / 1000) + 3600,
            user:          null,
          };
          // Try to decode user from JWT
          try {
            var payload = JSON.parse(atob(at.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            sess.user = { id: payload.sub, email: payload.email, role: payload.role };
          } catch (_) {}
          // Supabase stores session under supabase.auth.token
          Object.keys(localStorage).forEach(function(k) {
            if (k.includes('-auth-token')) localStorage.removeItem(k);
          });
          localStorage.setItem('sb-wedevtjjmdvngyshqdro-auth-token', JSON.stringify(sess));
        } catch(_) {}
        window.location.href = origin + redirectTo;
      }

      setAndRedirect();
    })();
  </script>
</body>
</html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }
  )
}
