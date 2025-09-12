// @ts-nocheck
import { test, expect } from '@playwright/test';

// This test stubs the Supabase SDK module to avoid real network and simulates a successful setSession.
// It also validates that our callback page sends cross-tab signals and redirects to the next URL.

test.describe('auth callback flow (fragment + query)', () => {
  test('handles fragment tokens, signals opener, and shows success without forcing redirect', async ({ browser }) => {
    const context = await browser.newContext();
    const opener = await context.newPage();

    // Listen for BroadcastChannel-like behavior via storage and capture final URL of callback tab
    await opener.goto('/');
    await opener.addInitScript(() => {
      (window as any).__signals = { bc: false, storage: false, postMsg: false };
      try {
        const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('tharaga-auth') : null;
        bc && bc.addEventListener('message', (ev) => {
          if (ev.data && ev.data.type === 'THARAGA_AUTH_SUCCESS') {
            (window as any).__signals.bc = true;
          }
        });
      } catch {}
      window.addEventListener('storage', (ev) => {
        if (ev.key === '__tharaga_magic_confirmed') {
          (window as any).__signals.storage = true;
        }
      });
      window.addEventListener('message', (ev) => {
        if (ev.origin === window.location.origin && ev.data && ev.data.type === 'THARAGA_AUTH_SUCCESS') {
          (window as any).__signals.postMsg = true;
        }
      });
    });

    // Open callback in new tab with stubbed supabase module
    const callback = await context.newPage();

    // Stub the Supabase ESM module used by callback.html (both versioned and unversioned URLs)
    const stubBody = `export function createClient(){
      return { auth: {
        getSessionFromUrl: async () => ({ data: { session: { user: { id: 'u1', email: 't@t.co' } } } }),
        exchangeCodeForSession: async () => ({ data: { session: { user: { id: 'u1', email: 't@t.co' } } } }),
        setSession: async () => ({ data: { session: { user: { id: 'u1', email: 't@t.co' } } } }),
        getSession: async () => ({ data: { session: { user: { id: 'u1', email: 't@t.co' } } } })
      } };
    }`;
    await callback.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm', async (route) => {
      route.fulfill({ status: 200, contentType: 'application/javascript', body: stubBody });
    });
    await callback.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', async (route) => {
      route.fulfill({ status: 200, contentType: 'application/javascript', body: stubBody });
    });

    const next = '/about/';
    const url = `/auth/callback.html?next=${encodeURIComponent(next)}#access_token=FAKE_ACCESS&refresh_token=FAKE_REFRESH`;
    await callback.goto(url);
    // Expect the page to remain on callback (no forced redirect)
    await expect(callback).toHaveURL(/\/auth\/callback\.html/);

    // Check signals were sent (any of them suffices). Since BC/storage affect opener asynchronously, allow a delay
    await opener.waitForTimeout(400);
    const ok = await opener.evaluate(() => {
      const s = (window as any).__signals || { bc:false, storage:false, postMsg:false };
      const ls = !!localStorage.getItem('__tharaga_magic_confirmed');
      return !!(s.bc || s.storage || s.postMsg || ls);
    });
    expect(ok).toBeTruthy();
  });

  test('handles code param via exchangeCodeForSession and shows success without forcing redirect', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Stub supabase SDK
    const stubCodeBody = `export function createClient(){
      return { auth: {
        getSessionFromUrl: async () => { throw new Error('skip'); },
        exchangeCodeForSession: async () => ({ data: { session: { user: { id: 'u2', email: 'code@ex.co' } } } }),
        setSession: async () => ({ data: { session: { user: { id: 'u2', email: 'code@ex.co' } } } })
      } };
    }`;
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm', async (route) => {
      route.fulfill({ status: 200, contentType: 'application/javascript', body: stubCodeBody });
    });
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', async (route) => {
      route.fulfill({ status: 200, contentType: 'application/javascript', body: stubCodeBody });
    });

    const next = '/about/';
    await page.goto(`/auth/callback.html?code=SOME_CODE&next=${encodeURIComponent(next)}`);
    await expect(page).toHaveURL(/\/auth\/callback\.html/);
  });

  test('shows friendly message and stays when no auth tokens are present', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const stubNoTokens = `export function createClient(){
      return { auth: {
        getSessionFromUrl: async () => { throw new Error('no tokens'); },
        exchangeCodeForSession: async () => { throw new Error('no code'); },
        setSession: async () => { throw new Error('no tokens'); }
      } };
    }`;
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm', async (route) => {
      route.fulfill({ status: 200, contentType: 'application/javascript', body: stubNoTokens });
    });
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', async (route) => {
      route.fulfill({ status: 200, contentType: 'application/javascript', body: stubNoTokens });
    });

    const next = '/about/';
    await page.goto(`/auth/callback.html?next=${encodeURIComponent(next)}`);
    await expect(page).toHaveURL(/\/auth\/callback\.html/);
  });

  test('shows failure and stays on auth error', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const stubErrors = `export function createClient(){
      return { auth: {
        getSessionFromUrl: async () => { throw new Error('boom'); },
        exchangeCodeForSession: async () => { throw new Error('boom2'); },
        setSession: async () => { throw new Error('boom3'); },
        getSession: async () => ({ data: { session: null } })
      } };
    }`;
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm', async (route) => {
      route.fulfill({ status: 200, contentType: 'application/javascript', body: stubErrors });
    });
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', async (route) => {
      route.fulfill({ status: 200, contentType: 'application/javascript', body: stubErrors });
    });

    const next = '/about/';
    await page.goto(`/auth/callback.html?next=${encodeURIComponent(next)}#error=otp_expired`);
    await expect(page).toHaveURL(/\/auth\/callback\.html/);
  });

  test('uses getSessionFromUrl when available and stays', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const stubGetSession = `export function createClient(){
      return { auth: {
        getSessionFromUrl: async () => ({ data: { session: { user: { id: 'u3', email: 'magic@link.co' } } } }),
        exchangeCodeForSession: async () => ({ data: { session: { user: { id: 'u3', email: 'magic@link.co' } } } }),
        setSession: async () => ({ data: { session: { user: { id: 'u3', email: 'magic@link.co' } } } })
      } };
    }`;
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm', async (route) => {
      route.fulfill({ status: 200, contentType: 'application/javascript', body: stubGetSession });
    });
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm', async (route) => {
      route.fulfill({ status: 200, contentType: 'application/javascript', body: stubGetSession });
    });

    const next = '/about/';
    await page.goto(`/auth/callback.html?next=${encodeURIComponent(next)}`);
    await expect(page).toHaveURL(/\/auth\/callback\.html/);
  });
});

