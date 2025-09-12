import { test, expect } from '@playwright/test';

// This test stubs the Supabase SDK module to avoid real network and simulates a successful setSession.
// It also validates that our callback page sends cross-tab signals and redirects to the next URL.

test.describe('auth callback flow (fragment + query)', () => {
  test('handles fragment tokens, signals opener, and redirects to next', async ({ browser }) => {
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

    // Stub the Supabase ESM module used by callback.html
    await callback.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm', async (route) => {
      const body = `export function createClient(){
        return { auth: {
          getSessionFromUrl: async () => ({ data: { session: { user: { id: 'u1', email: 't@t.co' } } } }),
          exchangeCodeForSession: async () => ({ data: { session: { user: { id: 'u1', email: 't@t.co' } } } }),
          setSession: async () => ({ data: { session: { user: { id: 'u1', email: 't@t.co' } } } }),
          getSession: async () => ({ data: { session: { user: { id: 'u1', email: 't@t.co' } } } })
        } };
      }`;
      route.fulfill({ status: 200, contentType: 'application/javascript', body });
    });

    const next = '/about/';
    const url = `/auth/callback.html?next=${encodeURIComponent(next)}#access_token=FAKE_ACCESS&refresh_token=FAKE_REFRESH`;
    await callback.goto(url);

    // Wait for redirect to happen
    await callback.waitForURL('**' + next);

    // Check signals were sent (any of them suffices). Since BC/storage affect opener asynchronously, allow a delay
    await opener.waitForTimeout(300);
    const signals = await opener.evaluate(() => (window as any).__signals);
    expect(signals).toBeTruthy();
    expect(signals.bc || signals.storage || signals.postMsg).toBeTruthy();
  });
});

